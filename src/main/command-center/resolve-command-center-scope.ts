import { listWorkspaceSlugs } from '../onboarding/brain-preparation'
import type { CommandCenterScope } from '../../shared/command-center-types'

/**
 * Picks the scope the Command Center's scan covers when there is no
 * workspace selector yet (spec 010) to ask the operator — spec 009's
 * delegated decision: a brain with exactly one workspace scans that
 * workspace (the common case: the operator's first, from onboarding);
 * anything else — no workspace yet, or more than one — falls back to the
 * brain's own root ("My work"), never guessing among several.
 */
export function resolveCommandCenterScope(brainPath: string): CommandCenterScope {
  const slugs = listWorkspaceSlugs(brainPath)
  if (slugs.length === 1) {
    return { type: 'workspace', slug: slugs[0] }
  }
  return { type: 'root' }
}
