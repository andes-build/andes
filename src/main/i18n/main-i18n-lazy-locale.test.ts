import { beforeEach, describe, expect, it, vi } from 'vitest'

// Why: main-i18n avoids bundling locale catalogs on the cold-start path.
// English comes from translateMain() fallbacks; non-English catalogs load
// through the backend before awaited menu/tray/dialog rendering reads them.

vi.mock('electron', () => ({
  app: {
    getLocale: vi.fn(() => 'en-US')
  }
}))

import { UI_LANGUAGE_ENGLISH } from '../../shared/ui-language'
import {
  ensureMainI18n,
  mainI18n,
  setMainPluginLanguagePacks,
  setMainUiLanguage,
  translateMain
} from './main-i18n'
import { pluginLanguageResourceId } from '../../shared/plugins/plugin-language-pack-artifact'

// Why: main-i18n lazy-loads non-English catalogs through an i18next backend.
// English is the only shipped catalog while the interface keeps changing
// (specs/done/008-un-solo-idioma.md), so LAZY_LOCALE_LOADERS is empty today —
// these tests guard that an unknown locale code degrades to the caller's
// English default instead of throwing, and that a plugin-contributed catalog
// (the one live non-English path left) still loads and unloads correctly.
describe('main-i18n lazy locale loading', () => {
  beforeEach(async () => {
    await ensureMainI18n()
    setMainPluginLanguagePacks([])
    await setMainUiLanguage(UI_LANGUAGE_ENGLISH)
  })

  it('serves English synchronously from caller fallbacks', () => {
    expect(translateMain('missing.main.key', 'Fallback copy')).toBe('Fallback copy')
    expect(translateMain('menu.file', 'File')).toBe('File')
    expect(translateMain('menu.settings', 'Settings')).toBe('Settings')
  })

  it('uses caller English for a locale with no catalog', async () => {
    await mainI18n.changeLanguage('xx')
    expect(translateMain('missing.main.feature', 'English fallback')).toBe('English fallback')
    expect(translateMain('menu.file', 'File')).toBe('File')
  })

  it('returns to English after resolving an unsupported ui language', async () => {
    await mainI18n.changeLanguage('xx')
    const locale = await setMainUiLanguage(UI_LANGUAGE_ENGLISH)
    expect(locale).toBe('en')
    expect(translateMain('menu.file', 'File')).toBe('File')
  })

  it('loads a contributed catalog for native menus and dialogs', async () => {
    const id = 'plugin:orca-samples.portuguese/pt-BR' as const
    setMainPluginLanguagePacks([
      {
        id,
        resourceLanguage: pluginLanguageResourceId(id),
        pluginKey: 'orca-samples.portuguese',
        locale: 'pt-BR',
        catalog: { menu: { file: 'Arquivo Orca' } }
      }
    ])

    await setMainUiLanguage(id)
    expect(translateMain('menu.file', 'File')).toBe('Arquivo Orca')

    setMainPluginLanguagePacks([])
    expect(await setMainUiLanguage(id)).toBe('en')
    expect(translateMain('menu.file', 'File')).toBe('File')
  })
})
