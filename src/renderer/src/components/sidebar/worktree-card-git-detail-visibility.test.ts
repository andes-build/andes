import { describe, expect, it } from 'vitest'
import { computeWorktreeCardGitDetailVisibility } from './worktree-card-git-detail-visibility'

const ALL_GIT_CARD_PROPS = [
  'status',
  'issue',
  'linear-issue',
  'jira-issue',
  'pr',
  'automation'
] as const

// Spec 002, criterion 6.
describe('computeWorktreeCardGitDetailVisibility', () => {
  it('hides issue, review, and automation in simple mode even when the user turned them all on', () => {
    expect(computeWorktreeCardGitDetailVisibility(ALL_GIT_CARD_PROPS, 'simple')).toEqual({
      showIssue: false,
      showLinearIssue: false,
      showJiraIssue: false,
      showPR: false,
      showAutomation: false
    })
  })

  it('respects the user cardProps preference in developer mode', () => {
    expect(computeWorktreeCardGitDetailVisibility(ALL_GIT_CARD_PROPS, 'developer')).toEqual({
      showIssue: true,
      showLinearIssue: true,
      showJiraIssue: true,
      showPR: true,
      showAutomation: true
    })
    expect(computeWorktreeCardGitDetailVisibility([], 'developer')).toEqual({
      showIssue: false,
      showLinearIssue: false,
      showJiraIssue: false,
      showPR: false,
      showAutomation: false
    })
  })
})
