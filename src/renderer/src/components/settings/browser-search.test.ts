import { beforeEach, describe, expect, it } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { getBrowserPaneSearchEntries, getTerminalLinkActionSearchKeywords } from './browser-search'
import {
  getBrowserLinkRoutingDescription,
  getBrowserLinkRoutingShortcutLabel,
  getLinkRoutingModifierDescription,
  getLinkRoutingModifierTitle
} from './browser-link-routing-copy'

describe('browser settings search copy', () => {
  it('uses macOS shortcut symbols for Link Routing copy and search metadata', () => {
    expect(getBrowserLinkRoutingShortcutLabel({ isMac: true })).toBe('⇧⌘-click')

    const description = getBrowserLinkRoutingDescription({ isMac: true })
    expect(description).toContain('⇧⌘-click')
    expect(description).not.toContain('Cmd/Ctrl')
    // The copy is translated: a leaked `{{...}}` means the interpolation name drifted from the catalog.
    expect(description).not.toMatch(/\{\{.+?\}\}/)

    const linkRoutingEntry = getBrowserPaneSearchEntries({ isMac: true }).find(
      (entry) => entry.title === 'Link Routing'
    )
    expect(linkRoutingEntry?.description).toBe(getBrowserLinkRoutingDescription({ isMac: true }))
    expect(linkRoutingEntry?.keywords).toContain('cmd')
    expect(linkRoutingEntry?.keywords).not.toContain('ctrl')

    const defaultZoomEntry = getBrowserPaneSearchEntries({ isMac: true }).find(
      (entry) => entry.title === 'Default Zoom'
    )
    expect(defaultZoomEntry?.keywords).toContain('zoom')
  })

  it('uses Ctrl shortcut text for Link Routing copy and search metadata off macOS', () => {
    expect(getBrowserLinkRoutingShortcutLabel({ isMac: false })).toBe('Shift+Ctrl+click')

    const description = getBrowserLinkRoutingDescription({ isMac: false })
    expect(description).toContain('Shift+Ctrl+click')
    expect(description).not.toContain('Cmd/Ctrl')
    expect(description).not.toMatch(/\{\{.+?\}\}/)

    const linkRoutingEntry = getBrowserPaneSearchEntries({ isMac: false }).find(
      (entry) => entry.title === 'Link Routing'
    )
    expect(linkRoutingEntry?.description).toBe(getBrowserLinkRoutingDescription({ isMac: false }))
    expect(linkRoutingEntry?.keywords).toContain('ctrl')
    expect(linkRoutingEntry?.keywords).not.toContain('cmd')

    const terminalActionsEntry = getBrowserPaneSearchEntries({ isMac: false }).find(
      (entry) => entry.title === 'Show terminal link actions'
    )
    expect(terminalActionsEntry?.description).toContain('Ctrl-click')
    expect(terminalActionsEntry?.description).not.toContain('Cmd/Ctrl')
    expect(terminalActionsEntry?.keywords).toEqual(
      getTerminalLinkActionSearchKeywords({ isMac: false })
    )
    expect(terminalActionsEntry?.keywords).toContain('browser')
    expect(terminalActionsEntry?.keywords).toContain('ctrl')
  })

  // Why: shipping the opt-in must not reword this row for anyone who never enables
  // it, so the default output has to stay byte-identical to the pre-feature copy.
  it('keeps the pre-feature wording while inverting is off', () => {
    expect(getBrowserLinkRoutingDescription({ isMac: true })).toBe(
      "Open http(s) links in Andes's built-in browser — from the terminal, markdown, and the editor. ⇧⌘-click always uses your system browser."
    )
    expect(getBrowserLinkRoutingDescription({ isMac: false })).toContain(
      'Shift+Ctrl+click always uses your system browser.'
    )
  })

  // Why: "always" would be a lie once the chord can land in Andes, so the nested row
  // takes over the claim.
  it('drops the modifier claim once inverting is on', () => {
    const description = getBrowserLinkRoutingDescription({ isMac: true }, true)
    expect(description).not.toContain('click')
    expect(description).not.toContain('system browser')
  })
})

describe('browser link routing modifier copy', () => {
  // Why: BrowserPane gates each row on getBrowserPaneSearchEntries()[n], so a
  // reordered or inserted entry silently shows the wrong row for a search.
  it('keeps the search entry order BrowserPane indexes by position', () => {
    expect(getBrowserPaneSearchEntries({ isMac: true }).map((entry) => entry.title)).toEqual([
      'Default Home Page',
      'Default Search Engine',
      'Default Zoom',
      'Link Routing',
      'Hold Shift to open in Andes',
      'Show terminal link actions',
      'Localhost Worktree Labels',
      'Session & Cookies',
      'Remote server workspaces',
      'SSH workspaces'
    ])
  })

  it('names the destination the modifier actually reaches', () => {
    expect(getLinkRoutingModifierTitle(false)).toBe('Hold Shift to open in Andes')
    expect(getLinkRoutingModifierTitle(true)).toBe('Hold Shift to open in your web browser')
  })

  it('describes the modifier with the platform chord', () => {
    expect(getLinkRoutingModifierDescription({ openLinksInApp: false, isMac: true })).toContain(
      '⇧⌘'
    )
    expect(getLinkRoutingModifierDescription({ openLinksInApp: false, isMac: false })).toContain(
      'Shift+Ctrl'
    )
  })

  it('points the description at Andes only when links currently open externally', () => {
    expect(getLinkRoutingModifierDescription({ openLinksInApp: false, isMac: true })).toContain(
      "Andes's built-in browser"
    )
    expect(getLinkRoutingModifierDescription({ openLinksInApp: true, isMac: true })).toContain(
      'system browser'
    )
  })

  // Why: the toggle is off by default, so present-tense "opens one in Andes" would
  // describe behavior the user does not have yet.
  it('phrases the Andes branch as enabled-state copy', () => {
    expect(getLinkRoutingModifierDescription({ openLinksInApp: false, isMac: true })).toContain(
      'When enabled'
    )
  })

  // Why: the entry is built with openLinksInApp false, so without this the row is
  // unfindable by the title it actually renders when Link Routing is on.
  it('indexes both titles so the row is findable in either routing state', () => {
    const entry = getBrowserPaneSearchEntries({ isMac: true })[4]
    expect(entry?.keywords).toContain(getLinkRoutingModifierTitle(true))
  })
})

// The bug this file guards: the Link Routing description was a bare template
// literal, so it stayed English in every locale. Asserting only "no {{...}} leaked"
// cannot catch that — the English literal has no placeholder either. English is
// the only shipped catalog (specs/done/008-un-solo-idioma.md), so a synthetic
// resource bundle stands in for a real second-locale catalog here.
describe('Link Routing description localization', () => {
  const KEY = 'auto.components.settings.BrowserLinkRoutingSetting.description'
  const BASE_KEY = 'auto.components.settings.BrowserLinkRoutingSetting.descriptionBase'
  const SYNTHETIC_LOCALE = 'zz'
  const SYNTHETIC_DESCRIPTION = 'Abre enlaces con {{shortcut}} en tu navegador del sistema.'
  const SYNTHETIC_DESCRIPTION_BASE = 'Abre enlaces http(s) dentro del navegador integrado.'

  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('renders a translated copy with the shortcut interpolated', async () => {
    i18n.addResourceBundle(
      SYNTHETIC_LOCALE,
      'translation',
      {
        auto: {
          components: {
            settings: {
              BrowserLinkRoutingSetting: {
                description: SYNTHETIC_DESCRIPTION,
                descriptionBase: SYNTHETIC_DESCRIPTION_BASE
              }
            }
          }
        }
      },
      true,
      true
    )
    await i18n.changeLanguage(SYNTHETIC_LOCALE)

    const description = getBrowserLinkRoutingDescription({ isMac: true })
    expect(description).toBe(SYNTHETIC_DESCRIPTION.replace('{{shortcut}}', '⇧⌘-click'))
    expect(description).not.toMatch(/\{\{.+?\}\}/)
    // Fails when the copy is a hardcoded English literal.
    expect(description).not.toContain("Andes's built-in browser")

    // The entry title is localized too, so match on the description instead.
    const entry = getBrowserPaneSearchEntries({ isMac: true }).find(
      (item) => item.description === description
    )
    expect(entry).toBeDefined()

    await i18n.changeLanguage('en')
    expect(getBrowserLinkRoutingDescription({ isMac: true })).toContain("Andes's built-in browser")
  })

  it('renders a translated copy for the invert-on variant', async () => {
    i18n.addResourceBundle(
      SYNTHETIC_LOCALE,
      'translation',
      {
        auto: {
          components: {
            settings: {
              BrowserLinkRoutingSetting: { descriptionBase: SYNTHETIC_DESCRIPTION_BASE }
            }
          }
        }
      },
      true,
      true
    )
    await i18n.changeLanguage(SYNTHETIC_LOCALE)

    const description = getBrowserLinkRoutingDescription({ isMac: true }, true)
    expect(description).toBe(SYNTHETIC_DESCRIPTION_BASE)
    // Fails when the invert-on branch regresses to a hardcoded English literal.
    expect(description).not.toContain("Andes's built-in browser")
  })

  it('uses the catalog key rather than an inline literal', () => {
    expect(i18n.exists(KEY)).toBe(true)
    expect(i18n.exists(BASE_KEY)).toBe(true)
  })
})
