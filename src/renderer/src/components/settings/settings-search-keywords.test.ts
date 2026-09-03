import { beforeEach, describe, expect, it } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { searchKeywords, translateSearchKeyword } from './settings-search-keywords'

// Why: English is the only shipped catalog (specs/done/008-un-solo-idioma.md), so
// a synthetic 'ko' resource bundle stands in for a real Korean catalog here —
// these tests exercise the generic translate()-keyed keyword lookup, not
// Korean specifically.
function registerSyntheticKoreanBundle(): void {
  i18n.addResourceBundle(
    'ko',
    'translation',
    {
      settings: { appearance: { language: { title: '언어' } } },
      auto: {
        components: {
          settings: {
            agents: {
              search: { '66b6b82eb4': '깨어 있음', '2afd3b5858': '활성화' }
            }
          }
        }
      }
    },
    true,
    true
  )
}

describe('settings-search-keywords', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('returns only localized text in English UI', async () => {
    await i18n.changeLanguage('en')
    expect(translateSearchKeyword('settings.appearance.language.title', 'Language')).toEqual([
      'Language'
    ])
  })

  it('keeps English fallback and aliases in localized UI', async () => {
    registerSyntheticKoreanBundle()
    await i18n.changeLanguage('ko')
    expect(
      translateSearchKeyword('settings.appearance.language.title', 'Language', {
        aliases: ['locale']
      })
    ).toEqual(['언어', 'Language', 'locale'])
  })

  it('supports english-only keyword specs for brands', async () => {
    await i18n.changeLanguage('ko')
    expect(searchKeywords([{ key: 'unused', fallback: 'github', englishOnly: true }])).toEqual([
      'github'
    ])
  })

  it('deduplicates repeated keyword variants', () => {
    expect(searchKeywords(['terminal', 'terminal', { key: 'k', fallback: 'terminal' }])).toEqual([
      'terminal'
    ])
  })

  it('indexes localized agent search synonyms in Korean UI', async () => {
    registerSyntheticKoreanBundle()
    await i18n.changeLanguage('ko')
    expect(
      searchKeywords([
        { key: 'auto.components.settings.agents.search.66b6b82eb4', fallback: 'awake' }
      ])
    ).toEqual(['깨어 있음', 'awake'])
    expect(
      searchKeywords([
        { key: 'auto.components.settings.agents.search.2afd3b5858', fallback: 'enable' }
      ])
    ).toEqual(['활성화', 'enable'])
  })
})
