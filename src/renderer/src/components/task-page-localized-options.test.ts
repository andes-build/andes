import { beforeEach, describe, expect, it } from 'vitest'

import { i18n } from '@/i18n/i18n'
import {
  getGitHubModeButtons,
  getGitHubTaskKindPresets,
  getLinearPriorityLabel
} from './task-page-localized-options'

// Why: English is the only shipped catalog (specs/done/008-un-solo-idioma.md), so
// a synthetic resource bundle stands in for a real second-locale catalog here.
const SYNTHETIC_LOCALE = 'zz'

function registerSyntheticBundle(): void {
  i18n.addResourceBundle(
    SYNTHETIC_LOCALE,
    'translation',
    {
      auto: {
        components: {
          TaskPage: {
            '606a85c774': 'Abierto',
            '94f0339621': 'Asignado a mí',
            dfc0c79bd8: 'Incidencias',
            '137e2a8a01': 'PRs',
            '727069bee5': 'Proyectos',
            '713179dfdc': 'Sin prioridad'
          }
        }
      }
    },
    true,
    true
  )
}

describe('task-page-localized-options', () => {
  beforeEach(async () => {
    registerSyntheticBundle()
    await i18n.changeLanguage('en')
  })

  it('refreshes GitHub task labels when the UI language changes', async () => {
    expect(getGitHubTaskKindPresets('issues').map((preset) => preset.label)).toEqual([
      'Open',
      'Assigned to me'
    ])
    expect(getGitHubModeButtons().map((button) => button.label)).toEqual([
      'Issues',
      'PRs',
      'Projects'
    ])

    await i18n.changeLanguage(SYNTHETIC_LOCALE)

    expect(getGitHubTaskKindPresets('issues').map((preset) => preset.label)).toEqual([
      'Abierto',
      'Asignado a mí'
    ])
    expect(getGitHubModeButtons().map((button) => button.label)).toEqual([
      'Incidencias',
      'PRs',
      'Proyectos'
    ])

    await i18n.changeLanguage('en')

    expect(getGitHubTaskKindPresets('issues').map((preset) => preset.label)).toEqual([
      'Open',
      'Assigned to me'
    ])
    expect(getGitHubModeButtons().map((button) => button.label)).toEqual([
      'Issues',
      'PRs',
      'Projects'
    ])
  })

  it('refreshes Linear priority labels when the UI language changes', async () => {
    expect(getLinearPriorityLabel(0)).toBe('No priority')

    await i18n.changeLanguage(SYNTHETIC_LOCALE)

    expect(getLinearPriorityLabel(0)).toBe('Sin prioridad')

    await i18n.changeLanguage('en')

    expect(getLinearPriorityLabel(0)).toBe('No priority')
  })
})
