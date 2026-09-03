import { describe, expect, it } from 'vitest'
import { getDefaultSettings } from '../../../../shared/constants'
import { resolveInterfaceSectionSummary } from './appearance-interface-summary'

describe('resolveInterfaceSectionSummary', () => {
  // Why: only English ships while the interface keeps changing
  // (specs/done/008-un-solo-idioma.md) — the language setting is hidden
  // (SHOW_UI_LANGUAGE_SETTING is false), so its summary segment stays out too.
  it('includes theme and font, without a language segment', () => {
    const settings = {
      ...getDefaultSettings('/tmp'),
      theme: 'dark' as const,
      appFontFamily: 'Inter'
    }

    expect(resolveInterfaceSectionSummary(settings)).toBe('Dark · Inter')
  })

  it('falls back to the default font label when app font is empty', () => {
    const settings = {
      ...getDefaultSettings('/tmp'),
      theme: 'light' as const,
      appFontFamily: ''
    }

    expect(resolveInterfaceSectionSummary(settings)).toBe('Light · Default font')
  })
})
