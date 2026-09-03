import { afterEach, describe, expect, it } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { getDeveloperPermissionsPaneSearchEntries } from './developer-permissions-search'
import { matchesSettingsSearch } from './settings-search'

// Why: English is the only shipped catalog (specs/done/008-un-solo-idioma.md), so
// a synthetic resource bundle stands in for the macOS-wording catalogs here —
// these tests exercise translateSearchKeyword's generic behavior, not a
// particular language's macOS wording.
const SYNTHETIC_LOCALE = 'zz'
const SYNTHETIC_LAN_LABEL = 'red'
const SYNTHETIC_LOCAL_NETWORK_LABEL = 'red local'

function registerSyntheticBundle(): void {
  i18n.addResourceBundle(
    SYNTHETIC_LOCALE,
    'translation',
    {
      auto: {
        components: {
          settings: {
            developer: {
              permissions: {
                search: {
                  '87620e6416': SYNTHETIC_LAN_LABEL,
                  fa3239cd42: SYNTHETIC_LOCAL_NETWORK_LABEL
                }
              }
            }
          }
        }
      }
    },
    true,
    true
  )
}

function getLanEntry() {
  const entry = getDeveloperPermissionsPaneSearchEntries().find((candidate) =>
    candidate.keywords?.includes('usb')
  )
  if (!entry) {
    throw new Error('LAN, USB, and Bluetooth search entry is missing')
  }
  return entry
}

async function searchInLocale(locale: string, query: string): Promise<boolean> {
  await i18n.changeLanguage(locale)
  return matchesSettingsSearch(query, getLanEntry())
}

describe('developer permissions LAN search', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('finds the LAN row from the macOS Local Network wording in a non-English locale', async () => {
    registerSyntheticBundle()
    expect(await searchInLocale(SYNTHETIC_LOCALE, SYNTHETIC_LOCAL_NETWORK_LABEL)).toBe(true)
  })

  it('keeps the English LAN aliases findable in a non-English locale', async () => {
    registerSyntheticBundle()
    for (const query of ['lan', 'local network', 'local-network']) {
      expect(await searchInLocale(SYNTHETIC_LOCALE, query)).toBe(true)
    }
  })

  it('keeps the localized LAN wording findable', async () => {
    registerSyntheticBundle()
    expect(await searchInLocale(SYNTHETIC_LOCALE, SYNTHETIC_LAN_LABEL)).toBe(true)
  })

  it('indexes both wordings as distinct keywords', async () => {
    registerSyntheticBundle()
    await i18n.changeLanguage(SYNTHETIC_LOCALE)
    expect(getLanEntry().keywords).toEqual(
      expect.arrayContaining([SYNTHETIC_LAN_LABEL, SYNTHETIC_LOCAL_NETWORK_LABEL])
    )
  })
})
