import type { ThreadScope } from '../../../shared/workspace-scope-types'

/**
 * Spec 019. The core session contract
 * (`vendor/ai-first-os-core/core/CLAUDE.md`, "When the session starts") says
 * the first message of a session names the scope being worked on — a
 * workspace, or the root — and that the agent has to ask when it isn't
 * named. Simple mode already chose the scope in the sidebar selector before
 * the thread opens, so this message names it explicitly, in the contract's
 * own vocabulary (`--workspace <slug>` / `--root`), so the agent never asks.
 *
 * This text is the thread's very first message, sent before whatever the
 * person types (see `open-new-thread.ts`). It is deliberately explicit about
 * the flag to pass — "don't ask" alone leaves the agent free to guess which
 * scope, which is exactly the failure this spec closes.
 */
export function buildThreadScopeStartupMessage(scope: ThreadScope): string {
  if (scope.kind === 'root') {
    return (
      "This thread's scope is already chosen: my own work, the root — not a workspace. " +
      'Run the startup scan and the startup read with --root. Do not ask which scope to use.'
    )
  }
  return (
    `This thread's scope is already chosen: the workspace "${scope.name}" (slug: ${scope.slug}). ` +
    `Run the startup scan and the startup read with --workspace ${scope.slug}. Do not ask which scope to use.`
  )
}

/**
 * Spec 009. The whole first message of a thread: the scope line above, and —
 * when the thread was opened from a Command Center button — what the person
 * clicked on, appended after a blank line. The scope always comes first: an
 * agent that reads only the opening of the message still learns the scope
 * before anything else asks it to act.
 */
export function buildThreadFirstMessage(scope: ThreadScope, seedMessage?: string): string {
  const scopeMessage = buildThreadScopeStartupMessage(scope)
  const seed = seedMessage?.trim()
  return seed ? `${scopeMessage}\n\n${seed}` : scopeMessage
}
