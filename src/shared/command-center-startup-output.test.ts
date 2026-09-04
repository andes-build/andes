import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isCommandCenterStartupParseError,
  parseCommandCenterStartupOutput,
  parseWaitingRow
} from './command-center-startup-output'

const FIXTURES_DIR = join(__dirname, '__fixtures__', 'command-center-startup-output')

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), 'utf8')
}

describe('parseCommandCenterStartupOutput', () => {
  it('splits a full startup into its four sections and the footer, unmodified', () => {
    const result = parseCommandCenterStartupOutput(readFixture('full.txt'))
    if (isCommandCenterStartupParseError(result)) {
      throw new Error('expected a parsed result')
    }
    expect(result.waiting).toEqual({
      rows: ['migracion-kyc — waiting on you'],
      isEmpty: false,
      omittedCount: 0
    })
    expect(result.inProgress.rows).toEqual([
      'checkout-link · now · active',
      'migracion-kyc · now · blocked · blocked: la definición del nuevo umbral de verificación es de Legal — Mariana Sosa debe el memo desde el 2026-08-01'
    ])
    expect(result.inProgress.isEmpty).toBe(false)
    expect(result.queue.rows).toEqual(['next 1 · later 0', 'backlog: 1 ready of 1 pending'])
    expect(result.checks.rows).toEqual([
      'identity 9/40 · resolver 4 rows',
      'capability not installed: position role "cpo"'
    ])
    expect(result.checks.omittedCount).toBe(0)
    expect(result.footerLines).toEqual([
      'active-role: cpo · roles/cpo.md',
      '8 nodes · 0.3s · v1.3.0'
    ])
  })

  it('reads every section as empty when the scan finds nothing', () => {
    const result = parseCommandCenterStartupOutput(readFixture('empty.txt'))
    if (isCommandCenterStartupParseError(result)) {
      throw new Error('expected a parsed result')
    }
    expect(result.waiting).toEqual({ rows: [], isEmpty: true, omittedCount: 0 })
    expect(result.inProgress).toEqual({ rows: [], isEmpty: true, omittedCount: 0 })
    // Queued never declares an empty state of its own — it always prints the counts line.
    expect(result.queue.rows).toEqual(['next 0 · later 0'])
    // Checks always carries the identity diagnostic row ahead of "no findings".
    expect(result.checks.rows).toEqual(['identity 40/40 · resolver 3 rows', 'no findings'])
    expect(result.footerLines).toEqual(['2 nodes · 0.1s · v1.3.0'])
  })

  it('keeps the capped rows and reports the omitted count from "and N more"', () => {
    const result = parseCommandCenterStartupOutput(readFixture('truncated.txt'))
    if (isCommandCenterStartupParseError(result)) {
      throw new Error('expected a parsed result')
    }
    expect(result.waiting.rows).toHaveLength(5)
    expect(result.waiting.omittedCount).toBe(3)
    expect(result.inProgress.rows).toHaveLength(10)
    expect(result.inProgress.omittedCount).toBe(4)
    expect(result.checks.omittedCount).toBe(2)
    expect(result.checks.rows).not.toContain('and 2 more')
  })

  it('reports missing-sections instead of guessing when a title is absent', () => {
    const result = parseCommandCenterStartupOutput('Waiting for your decision\n  nothing\n')
    expect(isCommandCenterStartupParseError(result)).toBe(true)
    if (isCommandCenterStartupParseError(result)) {
      expect(result.reason).toBe('missing-sections')
    }
  })

  it('reports missing-sections when the titles are out of order', () => {
    const scrambled = [
      'Checks',
      '  no findings',
      'Waiting for your decision',
      '  nothing is waiting on you',
      'In progress',
      '  nothing in progress',
      'Queued',
      '  next 0 · later 0',
      '0 nodes · 0.0s'
    ].join('\n')
    const result = parseCommandCenterStartupOutput(scrambled)
    expect(isCommandCenterStartupParseError(result)).toBe(true)
  })
})

describe('parseWaitingRow', () => {
  it('splits the initiative name from what it is waiting on', () => {
    expect(parseWaitingRow('migracion-kyc — waiting on you')).toEqual({
      name: 'migracion-kyc',
      waitingOn: 'waiting on you'
    })
  })

  it('falls back to the whole row as the name when there is no separator', () => {
    expect(parseWaitingRow('nothing is waiting on you')).toEqual({
      name: 'nothing is waiting on you',
      waitingOn: ''
    })
  })
})
