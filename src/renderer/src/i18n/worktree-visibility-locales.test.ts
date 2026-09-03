import { describe, expect, it } from 'vitest'
import en from './locales/en.json'

describe('worktree visibility locales', () => {
  it('keeps current fallback-derived keys in the English catalog', () => {
    expect(en.auto.components.sidebar.NewExternalWorktreesInboxLine).toMatchObject({
      '6c07f3a91e': '{{value0}} on {{value1}}'
    })
    expect(en.auto.components.sidebar.WorktreeVisibilityHelpPopover).toMatchObject({
      ec1e6a10fb: 'Other worktrees start hidden to avoid unexpected sidebar clutter.',
      '1c68c9cf77':
        'Enable a source for all current and future worktrees, or show individual worktrees below.'
    })
    expect(en.auto.components.sidebar.HiddenWorktreeRecoveryList).toMatchObject({
      '64e6f53f05': 'Show one without enabling its source.'
    })
  })
})
