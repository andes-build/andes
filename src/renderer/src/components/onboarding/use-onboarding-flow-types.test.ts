import { describe, expect, it } from 'vitest'
import { STEPS as DEVELOPER_STEPS } from './use-onboarding-flow-types'

describe('spec005#1 developer-mode onboarding step list', () => {
  it('keeps Orca original steps unchanged', () => {
    expect(DEVELOPER_STEPS.map((step) => step.id)).toEqual([
      'agent',
      'theme',
      'integrations',
      'windows_terminal',
      'notifications'
    ])
  })
})
