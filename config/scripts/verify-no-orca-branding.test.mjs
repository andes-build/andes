import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { findOrcaMatches } from './verify-no-orca-branding.mjs'
import { localeValuePatterns, stripLocaleExceptions } from './orca-brand-exceptions.mjs'

function makeLocalesDir(catalogsByLocale) {
  const root = mkdtempSync(path.join(tmpdir(), 'orca-brand-check-'))
  const localesDir = path.join(root, 'locales')
  mkdirSync(localesDir, { recursive: true })
  for (const [locale, catalog] of Object.entries(catalogsByLocale)) {
    writeFileSync(path.join(localesDir, `${locale}.json`), JSON.stringify(catalog, null, 2), 'utf8')
  }
  return localesDir
}

describe('findOrcaMatches (spec006#1, spec006#6)', () => {
  it('flags a plain brand mention', async () => {
    const dir = makeLocalesDir({ en: { title: 'Orca could not fast-forward.' } })
    const matches = await findOrcaMatches(dir)
    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject({ file: 'en.json', key: 'title' })
  })

  it('does not flag "Andes" after the rename', async () => {
    const dir = makeLocalesDir({ en: { title: 'Andes could not fast-forward.' } })
    expect(await findOrcaMatches(dir)).toHaveLength(0)
  })

  it('does not flag a literal `orca` command example', async () => {
    const dir = makeLocalesDir({
      en: { hint: 'Created via `orca worktree create`' }
    })
    expect(await findOrcaMatches(dir)).toHaveLength(0)
  })

  it('does not flag orca.yaml', async () => {
    const dir = makeLocalesDir({ en: { hint: 'Add an `orca.yaml` file to enable shared setup.' } })
    expect(await findOrcaMatches(dir)).toHaveLength(0)
  })

  it('does not flag camelCase identifiers with no word boundary after "Orca"', async () => {
    // "OrcaServer" as a value (not a key) should not match \bOrca\b either —
    // regression guard for the criterion 1 eval's exact grep pattern.
    const dir = makeLocalesDir({ en: { hint: 'OrcaServerHint' } })
    expect(await findOrcaMatches(dir)).toHaveLength(0)
  })

  it('still flags "Orca" that sits right next to an excepted command', async () => {
    const dir = makeLocalesDir({
      en: { hint: 'Orca kept the branch after running `orca worktree create`.' }
    })
    const matches = await findOrcaMatches(dir)
    expect(matches).toHaveLength(1)
  })

  it('scans every locale file in the directory, not just en.json', async () => {
    const dir = makeLocalesDir({
      en: { title: 'Andes' },
      es: { title: 'Orca' }
    })
    const matches = await findOrcaMatches(dir)
    expect(matches).toHaveLength(1)
    expect(matches[0].file).toBe('es.json')
  })
})

describe('stripLocaleExceptions (spec006#6 — single source of truth)', () => {
  it('has a reason for every declared exception pattern', () => {
    expect(localeValuePatterns.length).toBeGreaterThan(0)
    for (const entry of localeValuePatterns) {
      expect(entry.pattern).toBeInstanceOf(RegExp)
      expect(entry.reason.length).toBeGreaterThan(0)
    }
  })

  it('strips orca.yaml but leaves the rest of the sentence intact', () => {
    const stripped = stripLocaleExceptions('Add an `orca.yaml` file to enable shared setup.')
    expect(stripped).not.toContain('orca.yaml')
    expect(stripped).toContain('Add an')
  })
})
