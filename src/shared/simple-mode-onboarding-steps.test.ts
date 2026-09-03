import { describe, expect, it } from 'vitest'
import { SIMPLE_ONBOARDING_STEPS } from './simple-mode-onboarding-steps'

describe('spec005#1 simple-mode onboarding step list', () => {
  it('has exactly the nine steps, in order (ajuste 2026-09-03)', () => {
    expect(SIMPLE_ONBOARDING_STEPS).toEqual([
      'welcome',
      'agent',
      'session',
      'folder',
      'install',
      'workspace',
      'skills',
      'notifications',
      'star'
    ])
  })
})
