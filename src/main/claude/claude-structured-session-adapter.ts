// The Claude lane of the structured wire.
//
// Same contract as the Codex adapter (`StructuredAgentSessionAdapter`), never a second notion of a
// structured session. It is one file rather than the Codex lane's fifty-five because Claude's wire
// is line-delimited JSON with a control channel, not a JSON-RPC app-server with threads, thread
// options and per-turn approval methods — every Codex file that exists for one of those has no
// Claude counterpart to port.
//
// What Claude cannot do here, and is declared instead of simulated (spec 012 criterion 7):
//   · subagents — frames carrying `parent_tool_use_id` land as ordinary items; the subagent card
//     stays deferred (`tsk-172`)
//   · questions — `answerPrompt` refuses `kind: 'question'`; Claude asks through its own tool, and
//     faking a question item would answer the wrong thing
//   · session options — Codex reads and writes thread options over its app-server; `setOption`
//     refuses rather than reporting a value it never set
//   · diffs — Codex mints file-change items; a Claude edit arrives as a tool call and stays one

import type {
  AgentJournalMessageItem,
  AgentSessionJournalIdentity
} from '../../shared/agent-session-journal-types'
import type { AgentSessionExecutionLocation } from '../../shared/agent-session-record'
import { isTextBlock } from '../../shared/native-chat-types'
import {
  AgentSessionPreSpawnError,
  type AgentSessionAcquisition,
  type AgentSessionDispatchOutcome,
  type StructuredAgentSessionAcquireInput,
  type StructuredAgentSessionAdapter,
  type StructuredAgentSessionLifecycleEvent,
  type StructuredAgentSessionSetOptionInput
} from '../native-chat/agent-session-wire/structured-agent-session-adapter'
import { readProcessStartTimeMs } from '../runtime/agent-session-process-identity-probe'
import {
  CLAUDE_SPAWN_TOKEN_ENV,
  openClaudeStructuredConnection,
  type ClaudeStructuredConnection
} from './claude-structured-connection'
import {
  createClaudeJournalTranslator,
  type ClaudeJournalTranslator
} from './claude-structured-journal-translation'
import type { ClaudeStructuredLaunch } from './claude-structured-launch-resolution'
import {
  buildClaudeStructuredInitializeRequest,
  buildClaudeStructuredPermissionResponse,
  buildClaudeStructuredUserMessage,
  claudeStructuredDecisionForOption,
  readClaudeStructuredControlResponseRequestId,
  type ClaudeStructuredPermissionRequest
} from './claude-structured-stream-protocol'

const START_TIME_READ_ATTEMPTS = 3

/** How long acquisition waits for the child to answer the `initialize` control request. That
 *  answer is the acquisition proof: it says the child is alive and speaking this wire.
 *
 *  It is NOT `system/init`. Claude emits that frame with the first turn and not before, so a
 *  session nobody has written to yet has no announced id to wait for — measured against the real
 *  binary on 2026-09-04 (`docs/research/2026-09-04-chequeo-funcional-spec-012/`). The id is instead
 *  the one Andes names with `--session-id`, and the first frame that carries one has to agree. */
const INIT_FRAME_TIMEOUT_MS = 60000

export type ClaudeStructuredSessionAdapterDeps = {
  resolveLaunch: (input: {
    identity: AgentSessionJournalIdentity
  }) => Promise<ClaudeStructuredLaunch>
  openConnection?: typeof openClaudeStructuredConnection
  readProcessStartTime?: (pid: number) => Promise<number | null>
  onEvent?: (event: StructuredAgentSessionLifecycleEvent) => void
  now?: () => number
  mintLinkId?: () => string
  initTimeoutMs?: number
}

type ClaudeSession = {
  connection: ClaudeStructuredConnection
  translator: ClaudeJournalTranslator | null
  fence: number
  acquisitionGeneration: string
  ended: boolean
  /** The session id the transcript carries: the one Andes reserved with `--session-id`, or the one
   *  a resume already proved. Verified against the first frame that announces one. */
  providerSessionId: string | null
  pendingPermissions: Map<string, ClaudeStructuredPermissionRequest>
}

/** The only text a turn carries to the child: the wire sends one user message per dispatch. */
function dispatchText(body: AgentJournalMessageItem): string {
  return body.blocks
    .filter((block) => isTextBlock(block))
    .map((block) => block.text)
    .join('\n')
    .trim()
}

export class ClaudeStructuredSessionAdapter implements StructuredAgentSessionAdapter {
  private readonly sessions = new Map<string, ClaudeSession>()

  constructor(private readonly deps: ClaudeStructuredSessionAdapterDeps) {}

  supportsCreate = (location: AgentSessionExecutionLocation, agent: string): boolean =>
    agent === 'claude' && this.supportsLocation(location)

  supportsLocation = (location: AgentSessionExecutionLocation): boolean =>
    location.wslDistro === null

  async acquire(input: StructuredAgentSessionAcquireInput): Promise<AgentSessionAcquisition> {
    const sessionId = input.identity.sessionId
    await this.closeSession(sessionId)
    const launch = await this.deps.resolveLaunch({ identity: input.identity }).catch((error) => {
      throw new AgentSessionPreSpawnError(error)
    })
    const session: ClaudeSession = {
      connection: null as unknown as ClaudeStructuredConnection,
      translator: null,
      fence: input.fence,
      acquisitionGeneration: `claude-${input.fence}-${input.spawnToken}`.slice(0, 128),
      ended: false,
      providerSessionId: launch.resumeSessionId ?? launch.reservedSessionId,
      pendingPermissions: new Map()
    }
    let initializeAnswered = false
    let announceInit: (() => void) | null = null
    const initAnnounced = new Promise<void>((resolve) => {
      announceInit = () => {
        initializeAnswered = true
        resolve()
      }
    })
    const initializeRequestId = `andes-init-${input.spawnToken}`
    session.translator = input.events
      ? createClaudeJournalTranslator({
          sink: input.events,
          sessionId: () => session.providerSessionId,
          bindPermission: (itemId, request) => session.pendingPermissions.set(itemId, request)
        })
      : null
    const connection = (this.deps.openConnection ?? openClaudeStructuredConnection)(
      {
        command: launch.command,
        args: launch.args,
        cwd: launch.cwd,
        // The environment goes through as it is. Claude signs in on its own state root and spec
        // 012 does not touch that layer; the only thing added is the token the owner probe reads
        // back to tell this child from a same-pid stranger.
        env: { ...launch.env, [CLAUDE_SPAWN_TOKEN_ENV]: input.spawnToken }
      },
      {
        onFrame: (frame) => {
          // The answer to `initialize` is what proves the child speaks this wire. It carries no
          // session id of its own, which is why the id is the reserved one and not a learned one.
          if (
            frame.type === 'control_response' &&
            readClaudeStructuredControlResponseRequestId(frame) === initializeRequestId
          ) {
            announceInit?.()
          }
          // Every Claude item identity is keyed by the session id, so a child that adopted a
          // different one would journal under a name the transcript does not have. Ending the
          // session is the only honest answer; renaming it here would hide the disagreement.
          const announced = typeof frame.session_id === 'string' ? frame.session_id : null
          if (announced !== null && session.providerSessionId === null) {
            session.providerSessionId = announced
          } else if (announced !== null && announced !== session.providerSessionId) {
            this.handleExit(
              sessionId,
              session,
              new Error(
                `claude answered as session ${announced}, not the ${session.providerSessionId} it was given`
              )
            )
            return
          }
          session.translator?.handle(frame)
        },
        onExit: (error) => this.handleExit(sessionId, session, error)
      }
    )
    session.connection = connection
    connection.send(buildClaudeStructuredInitializeRequest(initializeRequestId))
    const pid = connection.pid
    if (pid === undefined) {
      await connection.close()
      throw new Error('claude started without a pid')
    }
    let processStartTimeMs: number | null = null
    const readStartTime = this.deps.readProcessStartTime ?? readProcessStartTimeMs
    for (
      let attempt = 0;
      attempt < START_TIME_READ_ATTEMPTS && processStartTimeMs === null;
      attempt += 1
    ) {
      processStartTimeMs = await readStartTime(pid)
    }
    if (processStartTimeMs === null) {
      // Recording null makes every later owner probe indeterminate — a durable latch. Reaping the
      // child and refusing leaves a retryable failure instead.
      await connection.close()
      throw new Error(`claude start time for pid ${pid} could not be read`)
    }
    const timeout = this.deps.initTimeoutMs ?? INIT_FRAME_TIMEOUT_MS
    let timer: NodeJS.Timeout | undefined
    await Promise.race([
      initAnnounced,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, timeout)
      })
    ]).finally(() => clearTimeout(timer))
    const provenSessionId = session.providerSessionId
    if (provenSessionId === null || !initializeAnswered) {
      const stderr = connection.readStderr?.().trim()
      await connection.close()
      throw new Error(
        `claude never answered the initialize request within ${timeout}ms${
          stderr ? `: ${stderr}` : ''
        }`
      )
    }
    this.sessions.set(sessionId, session)
    return {
      process: {
        hostId: input.identity.hostId,
        pid,
        processStartTimeMs,
        spawnToken: input.spawnToken
      },
      link: {
        linkId:
          this.deps.mintLinkId?.() ?? `claude-${input.fence}-${provenSessionId}`.slice(0, 128),
        handle: { provider: 'claude', sessionId: provenSessionId, leafUuid: null },
        origin: launch.resumeSessionId ? 'resumed' : 'created',
        mintedAtFence: input.fence,
        observedAt: this.deps.now?.() ?? Date.now()
      },
      acquisitionGeneration: session.acquisitionGeneration
    }
  }

  async dispatch(input: {
    sessionId: string
    clientMessageId: string
    body: AgentJournalMessageItem
    fence: number
  }): Promise<AgentSessionDispatchOutcome> {
    const session = this.sessions.get(input.sessionId)
    if (!session || session.ended || session.connection.closed) {
      return { state: 'rejected', reason: `no live claude session for ${input.sessionId}` }
    }
    const text = dispatchText(input.body)
    if (text.length === 0) {
      return { state: 'rejected', reason: 'a claude turn carries text and this message had none' }
    }
    session.connection.send(buildClaudeStructuredUserMessage(text))
    // The wire is one-way: writing the frame is everything this adapter can observe. `unknown` is
    // the honest answer — the journal renders it as delivery unconfirmed, never as failure, and
    // nothing re-sends on the person's behalf.
    return {
      state: 'unknown',
      reason: 'claude acknowledges a turn only by answering it'
    }
  }

  async cancelTurn(input: { sessionId: string; turnId: string }): Promise<{ cancelled: boolean }> {
    const session = this.sessions.get(input.sessionId)
    if (!session || session.ended) {
      return { cancelled: false }
    }
    session.connection.send({
      type: 'control_request',
      request_id: `andes-interrupt-${input.turnId}`,
      request: { subtype: 'interrupt' }
    })
    return { cancelled: true }
  }

  async answerPrompt(input: {
    sessionId: string
    itemId: string
    kind: 'approval' | 'question'
    optionId: string
  }): Promise<void> {
    if (input.kind === 'question') {
      throw new Error('the claude lane has no question channel; see spec 012 criterion 7')
    }
    const session = this.sessions.get(input.sessionId)
    if (!session || session.ended) {
      throw new Error(`no live claude session for ${input.sessionId}`)
    }
    const request = session.pendingPermissions.get(input.itemId)
    if (!request) {
      throw new Error(`claude is no longer waiting on permission ${input.itemId}`)
    }
    // Forget before answering, so a race cannot answer the same permission twice.
    session.pendingPermissions.delete(input.itemId)
    session.connection.send(
      buildClaudeStructuredPermissionResponse({
        requestId: request.requestId,
        input: request.input,
        decision: claudeStructuredDecisionForOption(input.optionId),
        denyMessage: 'Denied from Andes'
      })
    )
    session.translator?.resolvePermission(
      input.itemId,
      input.optionId,
      this.deps.now?.() ?? Date.now()
    )
  }

  async setOption(input: StructuredAgentSessionSetOptionInput): Promise<void> {
    throw new Error(`claude structured sessions have no option named ${input.key}`)
  }

  /** Null hands the lookup back to the session-file resolver, which already finds Claude's own
   *  transcript from its session id. */
  historyFilePath = async (): Promise<string | null> => null

  closeSession = async (sessionId: string): Promise<boolean> => {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return true
    }
    this.sessions.delete(sessionId)
    session.ended = true
    session.translator?.dispose()
    await session.connection.close()
    return true
  }

  forceCloseSession = (sessionId: string): Promise<boolean> => this.closeSession(sessionId)
  disposeSession = (sessionId: string): Promise<boolean> => this.closeSession(sessionId)
  releaseAcquisition = (input: { sessionId: string }): Promise<boolean> =>
    this.closeSession(input.sessionId)

  closeAll = async (): Promise<void> => {
    for (const sessionId of new Set(this.sessions.keys())) {
      await this.closeSession(sessionId)
    }
  }

  private handleExit(sessionId: string, session: ClaudeSession, error: Error | null): void {
    if (session.ended) {
      return
    }
    session.ended = true
    this.sessions.delete(sessionId)
    session.translator?.dispose()
    this.deps.onEvent?.({
      type: 'ended',
      sessionId,
      reason: error ? error.message : 'claude exited',
      cause: 'unexpected-exit',
      fence: session.fence,
      acquisitionGeneration: session.acquisitionGeneration
    })
  }
}
