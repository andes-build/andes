import type { TerminalTab } from './terminal-tab-types'

/**
 * Spec 013, criteria 5 and 6: the title shown above a simple-mode thread.
 *
 * Precedence: a manual rename in Andes (`customTitle`) beats anything the
 * CLI wrote; failing that, the CLI's own explicit title
 * (`tab.aiVaultTitle.explicitTitle` — already resolved so `custom-title`
 * beats `ai-title` inside the CLI's own session file, see
 * `session-scanner-primary-parsers.ts`); failing both, `fallback`.
 *
 * Deliberately never reads `tab.aiVaultTitle.title` (which falls back to the
 * first prompt, then an agent-label guess) or `tab.generatedTitle` (Andes's
 * own prompt-derived label) — criterion 6 says a CLI that wrote no title
 * degrades to declaring so, not to a guessed one.
 */
export function resolveThreadHeaderTitle(
  tab: Pick<TerminalTab, 'customTitle' | 'aiVaultTitle'>,
  fallback: string
): string {
  return tab.customTitle?.trim() || tab.aiVaultTitle?.explicitTitle?.trim() || fallback
}
