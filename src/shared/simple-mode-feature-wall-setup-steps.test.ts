import { describe, expect, it } from 'vitest'
import { SIMPLE_MODE_SETUP_STEP_IDS } from './simple-mode-feature-wall-setup-steps'
import { FEATURE_WALL_SETUP_STEP_IDS } from './feature-wall-setup-steps'

describe('spec005#11 Settings checklist items by interface mode', () => {
  it('simple mode lists exactly agent, session, folder, skills, notifications, star', () => {
    expect(SIMPLE_MODE_SETUP_STEP_IDS).toEqual([
      'agent',
      'session',
      'folder',
      'skills',
      'notifications',
      'star'
    ])
  })

  it('developer mode keeps the Orca checklist unchanged', () => {
    expect(FEATURE_WALL_SETUP_STEP_IDS).toEqual([
      'two-worktrees',
      'browser',
      'notifications',
      'default-agent',
      'agent-capabilities',
      'task-sources',
      'setup-script',
      'add-two-repos'
    ])
  })

  it('the two lists are not the same set', () => {
    expect(new Set(SIMPLE_MODE_SETUP_STEP_IDS)).not.toEqual(new Set(FEATURE_WALL_SETUP_STEP_IDS))
  })
})
