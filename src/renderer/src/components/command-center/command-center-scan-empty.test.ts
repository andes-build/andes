import { describe, expect, it } from 'vitest'
import { parseCommandCenterStartupOutput } from '../../../../shared/command-center-startup-output'
import type { CommandCenterStartupOutput } from '../../../../shared/command-center-startup-output'
import { isCommandCenterScanEmpty } from './command-center-scan-empty'

function parse(lines: string[]): CommandCenterStartupOutput {
  const parsed = parseCommandCenterStartupOutput(lines.join('\n'))
  if ('reason' in parsed) {
    throw new Error('fixture did not parse')
  }
  return parsed
}

const EMPTY = [
  'Waiting for your decision',
  '  nothing is waiting on you',
  '',
  'In progress',
  '  nothing in progress',
  '',
  'Queued',
  '',
  'Checks',
  '  identity 1/1',
  '0 nodes · 0.1s'
]

/** Spec 009, criterion 7: the third uncomfortable state — a scan that ran
 *  fine and found nothing. */
describe('spec009#7 isCommandCenterScanEmpty', () => {
  it('is true for a freshly prepared folder', () => {
    expect(isCommandCenterScanEmpty(parse(EMPTY))).toBe(true)
  })

  it('is still true when Checks only carries its identity bookkeeping row', () => {
    const output = parse(EMPTY)
    expect(output.checks.rows.length).toBeGreaterThan(0)
    expect(isCommandCenterScanEmpty(output)).toBe(true)
  })

  it('is false as soon as one initiative is waiting', () => {
    const withWaiting = [...EMPTY]
    withWaiting[1] = '  migracion-kyc — waiting on you'
    expect(isCommandCenterScanEmpty(parse(withWaiting))).toBe(false)
  })

  it('is false as soon as Checks carries a real finding', () => {
    const withFinding = [...EMPTY]
    withFinding[9] = '  a head names a workspace that does not exist'
    expect(isCommandCenterScanEmpty(parse(withFinding))).toBe(false)
  })
})
