import { describe, expect, it } from 'vitest'

import { UI_LANGUAGE_ENGLISH, UI_LANGUAGE_SYSTEM, normalizeUiLanguage } from './ui-language'

describe('normalizeUiLanguage', () => {
  it('accepts supported language settings', () => {
    expect(normalizeUiLanguage(UI_LANGUAGE_SYSTEM)).toBe('system')
    expect(normalizeUiLanguage(UI_LANGUAGE_ENGLISH)).toBe('en')
  })

  it('accepts a plugin language pack id', () => {
    expect(normalizeUiLanguage('plugin:orca-samples.portuguese/pt-BR')).toBe(
      'plugin:orca-samples.portuguese/pt-BR'
    )
  })

  it('falls back a retired built-in language to English, not to a blank UI', () => {
    expect(normalizeUiLanguage('es')).toBe('en')
    expect(normalizeUiLanguage('zh')).toBe('en')
    expect(normalizeUiLanguage('ko')).toBe('en')
    expect(normalizeUiLanguage('ja')).toBe('en')
  })

  it('falls back unknown values to English', () => {
    expect(normalizeUiLanguage('fr')).toBe('en')
    expect(normalizeUiLanguage(null)).toBe('en')
  })
})
