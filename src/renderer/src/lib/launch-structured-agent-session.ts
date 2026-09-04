import type {
  AgentSessionAttachResult,
  AgentSessionMutationEnvelope,
  AgentSessionMutationResult
} from '../../../shared/agent-session-wire'
import {
  createStructuredAgentSessionOperationId,
  structuredAgentSessionPayloadFingerprint
} from '../../../shared/structured-agent-session-mutation'
import { callStructuredAgentSession } from '@/runtime/structured-agent-session-client'
import { toRuntimeWorktreeSelector } from '@/runtime/runtime-worktree-selector'
import { useAppStore } from '@/store'
import {
  clearWebSessionFocusIntentIfMatches,
  recordWebSessionFocusIntent,
  resolveWebSessionVisibleTabId
} from '@/runtime/web-session-focus-intent'
import { LOCAL_STRUCTURED_SESSION_OWNER } from '@/runtime/local-structured-session-tabs-sync'

/** Providers with a lane on the structured wire. Adding one here is not enough on its own: the
 *  host needs its adapter too (`structured-agent-session-adapter-router.ts`). */
export type StructuredAgentSessionProvider = 'codex' | 'claude'

type StructuredAgentSessionCreateParams = {
  envelope: AgentSessionMutationEnvelope
  worktree: string
  agent: StructuredAgentSessionProvider
  /** Spec 012: the message the thread is born with. The host turns it into the first turn as part
   *  of the create, so this call stays the only emitter on a session nobody has typed into yet. */
  firstMessage?: string
}

export type StructuredAgentSessionLaunchIntent = {
  sessionId: string
  worktreeId: string
  params: StructuredAgentSessionCreateParams
}

export class StructuredAgentSessionCreateRefusalError extends Error {}

export function createStructuredAgentSessionLaunchIntent(
  worktreeId: string,
  agent: StructuredAgentSessionProvider,
  firstMessage?: string
): StructuredAgentSessionLaunchIntent {
  const sessionId = `${agent}_${crypto.randomUUID().replaceAll('-', '_')}`
  const trimmedFirstMessage = firstMessage?.trim()
  // Undefined is dropped by the canonicalizer on both peers, so a create with no first message
  // hashes exactly as it did before spec 012.
  const fields = {
    worktree: toRuntimeWorktreeSelector(worktreeId),
    agent,
    ...(trimmedFirstMessage ? { firstMessage: trimmedFirstMessage } : {})
  }
  const state = useAppStore.getState()
  recordWebSessionFocusIntent(
    { environmentId: LOCAL_STRUCTURED_SESSION_OWNER },
    worktreeId,
    `agent-session:${sessionId}`,
    undefined,
    resolveWebSessionVisibleTabId(state, worktreeId)
  )
  return {
    sessionId,
    worktreeId,
    params: {
      envelope: {
        sessionId,
        clientOperationId: createStructuredAgentSessionOperationId(() => crypto.randomUUID()),
        expectedRuntimeFence: null,
        payloadFingerprint: structuredAgentSessionPayloadFingerprint({
          method: 'agentSession.create',
          sessionId,
          fields
        })
      },
      ...fields
    }
  }
}

export function abandonStructuredAgentSessionLaunchIntent(
  intent: StructuredAgentSessionLaunchIntent
): void {
  clearWebSessionFocusIntentIfMatches(
    { environmentId: LOCAL_STRUCTURED_SESSION_OWNER },
    intent.worktreeId,
    `agent-session:${intent.sessionId}`
  )
}

export async function launchStructuredAgentSession(
  intent: StructuredAgentSessionLaunchIntent
): Promise<string> {
  const result = await callStructuredAgentSession<
    AgentSessionMutationResult<AgentSessionAttachResult>
  >({ kind: 'local' }, 'agentSession.create', intent.params)
  if (!result.ok) {
    abandonStructuredAgentSessionLaunchIntent(intent)
    throw new StructuredAgentSessionCreateRefusalError(result.refusal.message)
  }
  return result.value.sessionId
}
