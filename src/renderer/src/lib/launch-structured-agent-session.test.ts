import { beforeEach, describe, expect, it, vi } from 'vitest'
import { structuredAgentSessionPayloadFingerprint } from '../../../shared/structured-agent-session-mutation'
import { callStructuredAgentSession } from '@/runtime/structured-agent-session-client'
import {
  createStructuredAgentSessionLaunchIntent,
  launchStructuredAgentSession
} from './launch-structured-agent-session'

vi.mock('@/runtime/structured-agent-session-client', () => ({
  callStructuredAgentSession: vi.fn()
}))

describe('structured Codex launch', () => {
  beforeEach(() => {
    vi.mocked(callStructuredAgentSession).mockReset()
  })

  it('creates a native session with a host-verifiable launch intent', async () => {
    vi.mocked(callStructuredAgentSession).mockImplementation(async (_target, _method, params) => ({
      ok: true,
      replayed: false,
      fence: 1,
      cursor: { epoch: 'epoch-1', sequence: 0 },
      value: {
        sessionId: (params as { envelope: { sessionId: string } }).envelope.sessionId,
        fence: 1,
        page: {
          sessionId: 'session-1',
          epoch: 'epoch-1',
          direction: 'tail',
          items: [],
          removedItemIds: [],
          submissions: [],
          window: {
            oldest: null,
            newest: null,
            nextCursor: { epoch: 'epoch-1', sequence: 0 }
          },
          liveCursor: { epoch: 'epoch-1', sequence: 0 },
          hasOlder: false,
          hasNewer: false
        },
        unconfirmedClientMessageIds: []
      }
    }))

    const intent = createStructuredAgentSessionLaunchIntent('workspace-1', 'codex')
    const sessionId = await launchStructuredAgentSession(intent)
    const params = vi.mocked(callStructuredAgentSession).mock.calls[0]?.[2] as {
      envelope: { sessionId: string; payloadFingerprint: string }
      worktree: string
      agent: 'codex'
    }

    expect(sessionId).toMatch(/^codex_[A-Za-z0-9_]{36}$/)
    expect(callStructuredAgentSession).toHaveBeenCalledWith(
      { kind: 'local' },
      'agentSession.create',
      expect.objectContaining({ worktree: 'id:workspace-1', agent: 'codex' })
    )
    expect(params.envelope.payloadFingerprint).toBe(
      structuredAgentSessionPayloadFingerprint({
        method: 'agentSession.create',
        sessionId: params.envelope.sessionId,
        fields: { worktree: 'id:workspace-1', agent: 'codex' }
      })
    )
    expect(params).toBe(intent.params)
  })

  /** Spec 012: the thread's birth message travels in the create, and the fingerprint covers it —
   *  otherwise a retry could carry a different message under the same operation id. */
  it('puts the trimmed first message in the create and in its fingerprint', () => {
    const intent = createStructuredAgentSessionLaunchIntent(
      'workspace-1',
      'claude',
      '  trabaja en el alcance X  '
    )

    expect(intent.params).toMatchObject({
      worktree: 'id:workspace-1',
      agent: 'claude',
      firstMessage: 'trabaja en el alcance X'
    })
    expect(intent.params.envelope.payloadFingerprint).toBe(
      structuredAgentSessionPayloadFingerprint({
        method: 'agentSession.create',
        sessionId: intent.params.envelope.sessionId,
        fields: {
          worktree: 'id:workspace-1',
          agent: 'claude',
          firstMessage: 'trabaja en el alcance X'
        }
      })
    )
  })

  /** A create with no message hashes exactly as it did before spec 012: an absent key is dropped by
   *  the canonicalizer on both peers, never hashed as present-but-empty. */
  it('leaves the create of a message-less launch byte-identical', () => {
    const intent = createStructuredAgentSessionLaunchIntent('workspace-1', 'codex', '   ')

    expect(intent.params).not.toHaveProperty('firstMessage')
    expect(intent.params.envelope.payloadFingerprint).toBe(
      structuredAgentSessionPayloadFingerprint({
        method: 'agentSession.create',
        sessionId: intent.params.envelope.sessionId,
        fields: { worktree: 'id:workspace-1', agent: 'codex' }
      })
    )
  })

  it('replays the exact create envelope when an unknown outcome is retried', async () => {
    const intent = createStructuredAgentSessionLaunchIntent('workspace-retry', 'codex')
    vi.mocked(callStructuredAgentSession).mockRejectedValue(new Error('response lost'))

    await expect(launchStructuredAgentSession(intent)).rejects.toThrow('response lost')
    await expect(launchStructuredAgentSession(intent)).rejects.toThrow('response lost')

    const first = vi.mocked(callStructuredAgentSession).mock.calls[0]?.[2]
    const second = vi.mocked(callStructuredAgentSession).mock.calls[1]?.[2]
    expect(first).toBe(intent.params)
    expect(second).toBe(first)
    expect(intent.params.envelope.clientOperationId).toMatch(/^\d{13}-[0-9a-f]{32}$/)
  })
})
