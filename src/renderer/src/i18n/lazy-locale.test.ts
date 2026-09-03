import { beforeEach, describe, expect, it } from 'vitest'

import { UI_LANGUAGE_ENGLISH } from '../../../shared/ui-language'
import { i18n, setRendererPluginLanguagePacks, setRendererUiLanguage } from './i18n'
import { pluginLanguageResourceId } from '../../../shared/plugins/plugin-language-pack-artifact'

// Why: the renderer lazy-loads non-English catalogs through an i18next backend
// instead of bundling them into the startup chunk. English is the only shipped
// catalog while the interface keeps changing (specs/done/008-un-solo-idioma.md),
// so NON_DEFAULT_LOCALE_LOADERS is empty today — these tests guard that an
// unknown locale code degrades to the inline English default instead of
// throwing, and that a plugin-contributed catalog (the one live non-English
// path left) still loads and unloads correctly.

describe('renderer i18n lazy locale loading', () => {
  beforeEach(async () => {
    setRendererPluginLanguagePacks([])
    await i18n.changeLanguage('en')
  })

  it('serves English synchronously from the eager bundle', () => {
    expect(i18n.t('menu.file', { defaultValue: 'File' })).toBe('File')
  })

  it('falls back to the inline English default for a locale with no catalog', async () => {
    await i18n.changeLanguage('xx')
    expect(i18n.t('missing.renderer.feature', { defaultValue: 'English fallback' })).toBe(
      'English fallback'
    )
  })

  it('resolves the English UI language back to the bundled catalog', async () => {
    await i18n.changeLanguage('xx')
    await setRendererUiLanguage(UI_LANGUAGE_ENGLISH)
    expect(i18n.language).toBe('en')
    expect(i18n.t('menu.file', { defaultValue: 'File' })).toBe('File')
  })

  it('loads an isolated catalog contributed by an enabled plugin', async () => {
    const id = 'plugin:orca-samples.portuguese/pt-BR' as const
    setRendererPluginLanguagePacks([
      {
        id,
        resourceLanguage: pluginLanguageResourceId(id),
        pluginKey: 'orca-samples.portuguese',
        locale: 'pt-BR',
        catalog: { menu: { file: 'Arquivo Orca' } }
      }
    ])

    await setRendererUiLanguage(id)
    expect(i18n.language).toBe(pluginLanguageResourceId(id))
    expect(i18n.t('menu.file', { defaultValue: 'File' })).toBe('Arquivo Orca')

    setRendererPluginLanguagePacks([])
    await setRendererUiLanguage(id)
    expect(i18n.language).toBe('en')
  })
})
