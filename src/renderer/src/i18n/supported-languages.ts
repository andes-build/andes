import { DEFAULT_UI_LOCALE, resolveRendererUiLocale } from '../../../shared/ui-locale'
import {
  UI_LANGUAGE_ENGLISH,
  UI_LANGUAGE_SYSTEM,
  type BuiltInUiLanguage,
  type UiLanguage
} from '../../../shared/ui-language'

export const DEFAULT_LOCALE = DEFAULT_UI_LOCALE

// Why: only English ships while the interface keeps changing — see
// specs/done/008-un-solo-idioma.md. With no plugin language pack installed
// there is only one choice, so the row stays out of Settings; a plugin can
// still contribute a real second language, and then the row (English plus
// whatever packs are enabled) has something to choose between.
export function shouldShowUiLanguageSetting(pluginLanguagePackCount: number): boolean {
  return pluginLanguagePackCount > 0
}

export type UiLanguageChoice = {
  value: BuiltInUiLanguage
  labelKey: string
}

export const UI_LANGUAGE_CHOICES: UiLanguageChoice[] = [
  { value: UI_LANGUAGE_SYSTEM, labelKey: 'settings.appearance.language.system' },
  { value: UI_LANGUAGE_ENGLISH, labelKey: 'settings.appearance.language.english' }
]

const UI_LANGUAGE_CHOICE_FALLBACKS: Record<BuiltInUiLanguage, string> = {
  [UI_LANGUAGE_SYSTEM]: 'System',
  [UI_LANGUAGE_ENGLISH]: 'English'
}

export function getUiLanguageChoiceLabel(
  choice: UiLanguageChoice,
  translateFn: (key: string, fallback: string) => string
): string {
  return translateFn(choice.labelKey, UI_LANGUAGE_CHOICE_FALLBACKS[choice.value])
}

export function resolveUiLocale(language: UiLanguage): string {
  return resolveRendererUiLocale(language)
}
