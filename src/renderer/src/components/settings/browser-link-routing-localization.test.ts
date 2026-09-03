import { afterEach, describe, expect, it } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { getBrowserLinkRoutingDescription } from './browser-link-routing-copy'

// The Link Routing description was a bare template literal, so it stayed English in every
// locale while its own title and the rest of the pane translated. It carries the platform
// shortcut label, so each locale must interpolate it rather than embed a hardcoded modifier.
// English is the only shipped catalog (specs/done/008-un-solo-idioma.md), so a synthetic
// resource bundle stands in for a real second-locale catalog here.
const SYNTHETIC_LOCALE = 'zz'
const SYNTHETIC_CATALOG = {
  auto: {
    components: {
      settings: {
        BrowserLinkRoutingSetting: {
          description: 'Abre enlaces con {{shortcut}} en tu navegador del sistema.',
          descriptionBase: 'Abre enlaces http(s) dentro del navegador integrado.'
        }
      }
    }
  }
}

const SHORTCUT_BY_PLATFORM = {
  mac: '⇧⌘-click',
  other: 'Shift+Ctrl+click'
} as const

describe('Link Routing description localization', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('translates the description in a non-English locale on both platforms', async () => {
    const english = {
      mac: getBrowserLinkRoutingDescription({ isMac: true }),
      other: getBrowserLinkRoutingDescription({ isMac: false })
    }

    i18n.addResourceBundle(SYNTHETIC_LOCALE, 'translation', SYNTHETIC_CATALOG, true, true)
    await i18n.changeLanguage(SYNTHETIC_LOCALE)

    for (const [platform, shortcut] of Object.entries(SHORTCUT_BY_PLATFORM)) {
      const description = getBrowserLinkRoutingDescription({ isMac: platform === 'mac' })

      expect(description, `${platform} fell back to English`).not.toBe(
        english[platform as keyof typeof english]
      )
      // The label is a key symbol, not prose: it stays literal in every locale.
      expect(description, `${platform} lost the shortcut label`).toContain(shortcut)
      expect(description, `${platform} leaked a placeholder`).not.toMatch(/\{\{.+?\}\}/)
    }
  })

  it('keeps each platform label out of the other platform copy', async () => {
    i18n.addResourceBundle(SYNTHETIC_LOCALE, 'translation', SYNTHETIC_CATALOG, true, true)

    for (const locale of ['en', SYNTHETIC_LOCALE]) {
      await i18n.changeLanguage(locale)

      expect(getBrowserLinkRoutingDescription({ isMac: true })).not.toContain(
        SHORTCUT_BY_PLATFORM.other
      )
      expect(getBrowserLinkRoutingDescription({ isMac: false })).not.toContain(
        SHORTCUT_BY_PLATFORM.mac
      )
    }
  })
})
