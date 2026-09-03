import { INTERFACE_MODE_SIMPLE, type InterfaceMode } from '../../../../shared/interface-mode'
import type { WorktreeCardProperty } from '../../../../shared/ui-chrome-types'

export type WorktreeCardGitDetailVisibility = {
  showIssue: boolean
  showLinearIssue: boolean
  showJiraIssue: boolean
  showPR: boolean
  showAutomation: boolean
}

/**
 * Spec 002, criterion 6: issue, review (PR), and automation detail sections are
 * git-only surfaces the worktree card drops entirely in simple mode, regardless
 * of the user's own cardProps display preference.
 */
export function computeWorktreeCardGitDetailVisibility(
  cardProps: readonly WorktreeCardProperty[],
  interfaceMode: InterfaceMode
): WorktreeCardGitDetailVisibility {
  if (interfaceMode === INTERFACE_MODE_SIMPLE) {
    return {
      showIssue: false,
      showLinearIssue: false,
      showJiraIssue: false,
      showPR: false,
      showAutomation: false
    }
  }
  return {
    showIssue: cardProps.includes('issue'),
    showLinearIssue: cardProps.includes('linear-issue'),
    showJiraIssue: cardProps.includes('jira-issue'),
    showPR: cardProps.includes('pr'),
    showAutomation: cardProps.includes('automation')
  }
}
