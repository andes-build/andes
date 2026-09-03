import { describe, expect, it } from 'vitest'
import type { CommandCenterStartupOutput } from '../../../../shared/command-center-startup-output'
import { deriveSuggestedAction } from './command-center-suggested-action'

function section(rows: string[]) {
  return { rows, isEmpty: rows.length === 0, omittedCount: 0 }
}

function output(overrides: Partial<CommandCenterStartupOutput> = {}): CommandCenterStartupOutput {
  return {
    waiting: section([]),
    inProgress: section([]),
    queue: section(['next 0 · later 0']),
    checks: section(['identity 40/40 · resolver 3 rows']),
    footerLines: ['0 nodes · 0.0s'],
    ...overrides
  }
}

describe('spec009#5 deriveSuggestedAction', () => {
  it('suggests the first waiting row before anything else', () => {
    const suggestion = deriveSuggestedAction(
      output({ waiting: section(['migracion-kyc — waiting on you']) })
    )
    expect(suggestion?.text).toBe('migracion-kyc — waiting on you')
    expect(suggestion?.message).toContain('migracion-kyc')
  })

  it('falls back to the first real check finding, skipping the identity row', () => {
    const suggestion = deriveSuggestedAction(
      output({
        checks: section([
          'identity 9/40 · resolver 4 rows',
          'capability not installed: position role "cpo"'
        ])
      })
    )
    expect(suggestion?.text).toBe('capability not installed: position role "cpo"')
  })

  it('returns null when nothing is waiting and checks has no real finding', () => {
    expect(deriveSuggestedAction(output())).toBeNull()
  })
})
