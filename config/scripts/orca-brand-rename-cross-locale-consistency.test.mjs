// spec006#2 — recorre las claves que la spec 006 tocó (las que dicen "Andes" en en.json) y
// verifica que ninguna conserva "Orca" para esa misma clave, salvo las excepciones técnicas del
// criterio 6. Hasta la spec 008 esto se verificaba en los cinco catálogos de idiomas; español,
// japonés, coreano y chino se dieron de baja ahí (specs/done/008-un-solo-idioma.md) y solo queda
// en.json — el chequeo sigue siendo el mismo, sobre el único catálogo que queda.
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { stripLocaleExceptions } from './orca-brand-exceptions.mjs'

const LOCALES_DIR = path.join(process.cwd(), 'src', 'renderer', 'src', 'i18n', 'locales')
const LOCALES = ['en']
const ANDES_WORD = /\bAndes\b/
const ORCA_WORD = /\bOrca\b/

function flattenLeaves(node, keyPath, out) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const [key, value] of Object.entries(node)) {
      flattenLeaves(value, keyPath ? `${keyPath}.${key}` : key, out)
    }
    return out
  }
  out.push([keyPath, node])
  return out
}

async function loadFlatCatalog(locale) {
  const raw = await fs.readFile(path.join(LOCALES_DIR, `${locale}.json`), 'utf8')
  return new Map(flattenLeaves(JSON.parse(raw), '', []))
}

describe('spec 006 rename stays consistent in the remaining locale catalog', () => {
  it('no changed key keeps "Orca" in en.json', async () => {
    const catalogs = Object.fromEntries(
      await Promise.all(LOCALES.map(async (locale) => [locale, await loadFlatCatalog(locale)]))
    )

    const changedKeys = [...catalogs.en.entries()]
      .filter(([, value]) => typeof value === 'string' && ANDES_WORD.test(value))
      .map(([key]) => key)

    expect(changedKeys.length).toBeGreaterThan(500) // sanity: the spec 006 rename touched ~2500+ strings

    const violations = []
    for (const key of changedKeys) {
      for (const locale of LOCALES) {
        const value = catalogs[locale].get(key)
        if (typeof value !== 'string') {
          continue // missing translation: not this test's concern
        }
        if (ORCA_WORD.test(stripLocaleExceptions(value))) {
          violations.push({ locale, key, value })
        }
      }
    }

    expect(violations.slice(0, 10)).toEqual([])
  })
})
