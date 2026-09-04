// The adapter driven against a scripted child, so allow and deny are checked without spending
// quota. The same path against the real binary is
// `claude-structured-permission-as-data.integration.test.ts` (spec 012 criterion 1).

import { describe, expect, it, vi } from 'vitest'
import type { AgentSessionJournalIdentity } from '../../shared/agent-session-journal-types'
import {
  ClaudeStructuredSessionAdapter,
  type ClaudeStructuredSessionAdapterDeps
} from './claude-structured-session-adapter'
import type {
  ClaudeStructuredConnection,
  ClaudeStructuredConnectionHandlers
} from './claude-structured-connection'

const identity = {
  sessionId: 'claude_1',
  workspaceId: 'ws-1',
  hostId: 'local',
  agent: 'claude',
  providerHandle: { kind: 'claude', sessionId: 'claude_1', leafUuid: null }
} as unknown as AgentSessionJournalIdentity

const permissionFrame = {
  type: 'control_request',
  request_id: 'req-1',
  request: {
    subtype: 'can_use_tool',
    tool_name: 'Write',
    title: 'Write',
    description: 'nota.txt',
    input: { file_path: 'nota.txt' },
    tool_use_id: 'toolu_1'
  }
}

const RESERVED_SESSION_ID = '11111111-2222-4333-8444-555555555555'

function scriptedAdapter(overrides?: Partial<ClaudeStructuredSessionAdapterDeps>): {
  adapter: ClaudeStructuredSessionAdapter
  sent: unknown[]
  emit: (frame: Record<string, unknown>) => void
  appended: { body: unknown }[]
} {
  const sent: unknown[] = []
  const appended: { body: unknown }[] = []
  let handlers: ClaudeStructuredConnectionHandlers | null = null
  const connection: ClaudeStructuredConnection = {
    pid: 4242,
    closed: false,
    send: (frame) => {
      sent.push(frame)
      // The real child answers `initialize` and nothing else until the first turn: it emits no
      // `system/init` before one. That answer is what acquisition waits for.
      const record = frame as { type?: string; request_id?: string; request?: { subtype?: string } }
      if (record.type === 'control_request' && record.request?.subtype === 'initialize') {
        queueMicrotask(() =>
          handlers?.onFrame(
            {
              type: 'control_response',
              response: { subtype: 'success', request_id: record.request_id }
            },
            0
          )
        )
      }
    },
    close: async () => {}
  }
  const adapter = new ClaudeStructuredSessionAdapter({
    resolveLaunch: async () => ({
      command: 'claude',
      args: ['--session-id', RESERVED_SESSION_ID],
      cwd: '/tmp',
      env: {},
      resumeSessionId: null,
      reservedSessionId: RESERVED_SESSION_ID
    }),
    openConnection: (_request, given) => {
      handlers = given
      return connection
    },
    readProcessStartTime: async () => 1,
    now: () => 1000,
    ...overrides
  })
  return {
    adapter,
    sent,
    appended,
    emit: (frame) => handlers?.onFrame(frame, 0)
  }
}

const sink = (appended: { body: unknown }[]): never =>
  ({
    appendItem: (_identity: unknown, body: unknown) => appended.push({ body }),
    appendTombstone: () => {},
    publish: () => {}
  }) as never

describe('acquiring a claude session', () => {
  /** Measured against the real binary on 2026-09-04: with `--input-format stream-json` the CLI
   *  emits `system/init` with the first turn and not before, so there is no announced id to wait
   *  for on a session nobody has written to. Andes names it with `--session-id` instead, and the
   *  answer to `initialize` is what proves the child is alive and speaking this wire. */
  it('mints the handle with the session id it reserved once the child answers initialize', async () => {
    const { adapter, sent } = scriptedAdapter()
    const acquisition = await adapter.acquire({
      identity,
      fence: 1,
      spawnToken: 'token-1'
    } as never)
    expect(acquisition.link.handle).toEqual({
      provider: 'claude',
      sessionId: RESERVED_SESSION_ID,
      leafUuid: null
    })
    expect(acquisition.process.pid).toBe(4242)
    expect(sent[0]).toMatchObject({
      type: 'control_request',
      request: { subtype: 'initialize' }
    })
  })

  it('refuses when claude never answers the initialize request', async () => {
    const adapter = new ClaudeStructuredSessionAdapter({
      resolveLaunch: async () => ({
        command: 'claude',
        args: [],
        cwd: '/tmp',
        env: {},
        resumeSessionId: null,
        reservedSessionId: RESERVED_SESSION_ID
      }),
      openConnection: () => ({
        pid: 1,
        closed: false,
        send: () => {},
        close: async () => {}
      }),
      readProcessStartTime: async () => 1,
      initTimeoutMs: 5
    })
    await expect(adapter.acquire({ identity, fence: 1, spawnToken: 't' } as never)).rejects.toThrow(
      /never answered the initialize request/
    )
  })

  /** Every Claude item identity is keyed by the session id. A child journaling under another name
   *  is a disagreement, and renaming the session here would hide it. */
  it('ends the session when the child answers under a different session id', async () => {
    const events: { type: string; reason?: string }[] = []
    const { adapter, emit } = scriptedAdapter({ onEvent: (event) => events.push(event) })
    await adapter.acquire({ identity, fence: 1, spawnToken: 'token-1' } as never)

    emit({ type: 'system', subtype: 'init', session_id: 'otra-sesion' })

    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'ended',
        reason: expect.stringContaining('otra-sesion')
      })
    )
  })
})

describe('answering a permission', () => {
  it('allows over the data channel, with the input unchanged', async () => {
    const { adapter, sent, emit, appended } = scriptedAdapter()
    await adapter.acquire({
      identity,
      fence: 1,
      spawnToken: 't',
      events: sink(appended)
    } as never)
    emit(permissionFrame)
    expect(appended.at(-1)?.body).toMatchObject({
      kind: 'approval',
      title: 'Write',
      detail: 'nota.txt'
    })
    await adapter.answerPrompt({
      sessionId: 'claude_1',
      itemId: 'req-1',
      kind: 'approval',
      optionId: 'allow'
    })
    expect(sent.at(-1)).toEqual({
      type: 'control_response',
      response: {
        subtype: 'success',
        request_id: 'req-1',
        response: { behavior: 'allow', updatedInput: { file_path: 'nota.txt' } }
      }
    })
  })

  it('denies over the same channel', async () => {
    const { adapter, sent, emit, appended } = scriptedAdapter()
    await adapter.acquire({
      identity,
      fence: 1,
      spawnToken: 't',
      events: sink(appended)
    } as never)
    emit(permissionFrame)
    await adapter.answerPrompt({
      sessionId: 'claude_1',
      itemId: 'req-1',
      kind: 'approval',
      optionId: 'deny'
    })
    expect(sent.at(-1)).toMatchObject({
      response: { response: { behavior: 'deny' } }
    })
  })

  it('answers one permission exactly once', async () => {
    const { adapter, emit, appended } = scriptedAdapter()
    await adapter.acquire({
      identity,
      fence: 1,
      spawnToken: 't',
      events: sink(appended)
    } as never)
    emit(permissionFrame)
    const answer = {
      sessionId: 'claude_1',
      itemId: 'req-1',
      kind: 'approval' as const,
      optionId: 'allow'
    }
    await adapter.answerPrompt(answer)
    await expect(adapter.answerPrompt(answer)).rejects.toThrow(/no longer waiting/)
  })

  it('refuses a question rather than answering the wrong thing', async () => {
    const { adapter, appended } = scriptedAdapter()
    await adapter.acquire({
      identity,
      fence: 1,
      spawnToken: 't',
      events: sink(appended)
    } as never)
    await expect(
      adapter.answerPrompt({
        sessionId: 'claude_1',
        itemId: 'x',
        kind: 'question',
        optionId: 'a'
      })
    ).rejects.toThrow(/no question channel/)
  })
})

describe('what the lane declares instead of simulating', () => {
  it('refuses a session option rather than reporting one it never set', async () => {
    const { adapter, appended } = scriptedAdapter()
    await adapter.acquire({ identity, fence: 1, spawnToken: 't', events: sink(appended) } as never)
    await expect(
      adapter.setOption({ sessionId: 'claude_1', key: 'model', value: 'opus', fence: 1 })
    ).rejects.toThrow(/no option named model/)
  })

  it('reports a turn as unconfirmed rather than claiming the provider took it', async () => {
    const { adapter, appended } = scriptedAdapter()
    await adapter.acquire({ identity, fence: 1, spawnToken: 't', events: sink(appended) } as never)
    const outcome = await adapter.dispatch({
      sessionId: 'claude_1',
      clientMessageId: 'c-1',
      body: { kind: 'message', role: 'user', blocks: [{ type: 'text', text: 'hola' }] },
      fence: 1
    })
    expect(outcome.state).toBe('unknown')
  })

  it('rejects a turn with no text', async () => {
    const { adapter, appended } = scriptedAdapter()
    await adapter.acquire({ identity, fence: 1, spawnToken: 't', events: sink(appended) } as never)
    const outcome = await adapter.dispatch({
      sessionId: 'claude_1',
      clientMessageId: 'c-1',
      body: { kind: 'message', role: 'user', blocks: [] },
      fence: 1
    })
    expect(outcome).toEqual({
      state: 'rejected',
      reason: 'a claude turn carries text and this message had none'
    })
  })
})

describe('supportsCreate', () => {
  it('takes claude and leaves codex to its own lane', () => {
    const { adapter } = scriptedAdapter()
    const local = { wslDistro: null } as never
    expect(adapter.supportsCreate(local, 'claude')).toBe(true)
    expect(adapter.supportsCreate(local, 'codex')).toBe(false)
    expect(adapter.supportsCreate({ wslDistro: 'Ubuntu' } as never, 'claude')).toBe(false)
  })
})

vi.mock('../runtime/agent-session-process-identity-probe', () => ({
  readProcessStartTimeMs: async () => 1
}))
