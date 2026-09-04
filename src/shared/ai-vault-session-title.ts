import type { AiVaultAgent } from './ai-vault-types'
import type { ExecutionHostId } from './execution-host'

export const AI_VAULT_SESSION_TITLE_REQUEST_MAX_COUNT = 64

export type AiVaultSessionTitle = {
  agent: Extract<AiVaultAgent, 'claude' | 'codex'>
  sessionId: string
  title: string
  /** Spec 013: only a title the CLI itself wrote (`custom-title`/`ai-title`),
   *  never a first-prompt or agent-label guess — `null` when the CLI wrote
   *  none. The thread header resolves from this, not from `title`. */
  explicitTitle?: string | null
}

export type AiVaultSessionTitleRequest = {
  agent: AiVaultSessionTitle['agent']
  sessionId: string
  transcriptPath?: string
}

export type AiVaultSessionTitlesArgs = {
  executionHostScope?: ExecutionHostId
  requests: AiVaultSessionTitleRequest[]
}

export type AiVaultSessionTitlesResult = {
  titles: AiVaultSessionTitle[]
}

export function isAiVaultTitleAgent(
  agent: string | null | undefined
): agent is AiVaultSessionTitle['agent'] {
  return agent === 'claude' || agent === 'codex'
}
