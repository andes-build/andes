// The adapter driven against a scripted child, so allow and deny are checked without spending
// quota. The same path against the real binary is
// `claude-structured-permission-as-data.integration.test.ts` (spec 012 criterion 1).

import { describe, expect, it, vi } from 'vitest'
import type { AgentSessionJournalIdentity } from '../../shared/agent-session-journal-types'
import { ClaudeStructuredSessionAdapter } from './claude-structured-session-adapter'
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

function scriptedAdapter(): {
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
    send: (frame) => sent.push(frame),
    close: async () => {}
  }
  const adapter = new ClaudeStructuredSessionAdapter({
    resolveLaunch: async () => ({
      command: 'claude',
      args: [],
      cwd: '/tmp',
      env: {},
      resumeSessionId: null
    }),
    openConnection: (_request, given) => {
      handlers = given
      // The child announces itself the moment it is opened, the way the real one does.
      queueMicrotask(() =>
        given.onFrame({ type: 'system', subtype: 'init', session_id: 'claude-sdk-1' }, 0)
      )
      return connection
    },
    readProcessStartTime: async () => 1,
    now: () => 1000
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
  it('mints the handle with the session id claude announced, not the one Andes reserved', async () => {
    const { adapter } = scriptedAdapter()
    const acquisition = await adapter.acquire({
      identity,
      fence: 1,
      spawnToken: 'token-1'
    } as never)
    expect(acquisition.link.handle).toEqual({
      provider: 'claude',
      sessionId: 'claude-sdk-1',
      leafUuid: null
    })
    expect(acquisition.process.pid).toBe(4242)
  })

  it('refuses when claude never announces a session id', async () => {
    const adapter = new ClaudeStructuredSessionAdapter({
      resolveLaunch: async () => ({
        command: 'claude',
        args: [],
        cwd: '/tmp',
        env: {},
        resumeSessionId: null
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
      /never announced a session id/
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
