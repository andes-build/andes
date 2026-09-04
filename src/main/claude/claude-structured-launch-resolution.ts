// How a durable session record becomes a `claude` process launch.
//
// Only the arguments change. The binary is the person's own, run unmodified with their own
// subscription; nothing here packages, patches, wraps or replaces it, and the sign-in layer is
// untouched (decision of 2026-09-04, Gate 1 of spec 012).
//
// Like the Codex resolver, every input is read back from the durable record, never from the call
// that triggered the acquire: a client that attaches twice must land in the same working directory.

import type { AgentSessionJournalIdentity } from '../../shared/agent-session-journal-types'
import { agentSessionProviderHandleChainHead } from '../../shared/agent-session-provider-handle'
import { LOCAL_EXECUTION_HOST_ID } from '../../shared/execution-host'
import { resolveClaudeCommand } from '../../shared/node-cli-command-resolution'
import type { AgentSessionRecordStore } from '../runtime/agent-session-record-store'
import { CLAUDE_STRUCTURED_LAUNCH_ARGS } from './claude-structured-stream-protocol'

/** Simple mode's whole design is the permission card, so the child must ask for everything.
 *  Same value the terminal path passes — `src/shared/tui-agent-permissions.ts`. */
const CLAUDE_ASK_PERMISSION_ARGS = ['--permission-mode', 'manual'] as const

export type ClaudeStructuredLaunch = {
  command: string
  args: string[]
  cwd: string
  env: Record<string, string>
  /** Provider session id this session already proved, or null to start one. */
  resumeSessionId: string | null
}

export type ClaudeStructuredLaunchResolverDeps = {
  store: AgentSessionRecordStore
  resolveWorkspacePath: (workspaceId: string) => Promise<string>
  resolveCommand?: (options?: { pathEnv?: string | null; homePath?: string }) => string
  resolveEnvironment?: () => Promise<NodeJS.ProcessEnv>
}

export function createClaudeStructuredLaunchResolver(
  deps: ClaudeStructuredLaunchResolverDeps
): (input: { identity: AgentSessionJournalIdentity }) => Promise<ClaudeStructuredLaunch> {
  return async ({ identity }) => {
    const record = deps.store.getRecord(identity.sessionId)
    if (!record) {
      throw new Error(`no durable agent-session record for ${identity.sessionId}`)
    }
    const { location } = record
    if (record.provider !== 'claude') {
      throw new Error(`session ${identity.sessionId} is a ${record.provider} session`)
    }
    // This adapter spawns on the machine the runtime runs on. A session pinned elsewhere belongs to
    // that host's runtime; starting it here would put a second writer on the same transcript.
    if (location.executionHostId !== LOCAL_EXECUTION_HOST_ID || location.wslDistro !== null) {
      throw new Error(
        `claude structured sessions run on the local host, not ${location.executionHostId}`
      )
    }
    const environment = await deps.resolveEnvironment?.()
    const pathEnv = environment?.PATH ?? environment?.Path ?? null
    const homePath = environment?.HOME ?? environment?.USERPROFILE
    const command = (deps.resolveCommand ?? resolveClaudeCommand)({
      pathEnv,
      ...(homePath ? { homePath } : {})
    })
    const head = agentSessionProviderHandleChainHead(record.providerHandleChain)
    const resumeSessionId = head?.handle.provider === 'claude' ? head.handle.sessionId : null
    return {
      command,
      args: [
        ...(record.launchArgs ?? []),
        ...CLAUDE_STRUCTURED_LAUNCH_ARGS,
        ...CLAUDE_ASK_PERMISSION_ARGS,
        ...(resumeSessionId ? ['--resume', resumeSessionId] : [])
      ],
      cwd: await deps.resolveWorkspacePath(location.workspaceId),
      env: { ...environment } as Record<string, string>,
      resumeSessionId
    }
  }
}
