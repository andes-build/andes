import { beforeEach, describe, expect, it } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { getMrStateFilters, getSmartWorkspaceNameModes } from './smart-workspace-localized-options'

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
          new: {
            workspace: {
              SmartWorkspaceNameField: {
                b3c60c2b7c: 'Inteligente',
                '2e4c7c95fe': 'Rama',
                '6f07a18604': 'Nombre',
                '622864b52a': 'Abierta',
                '2319d87718': 'Fusionada',
                '6fad211c66': 'Cerrada',
                '26824f60dd': 'Todas'
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

describe('smart-workspace-localized-options', () => {
  beforeEach(async () => {
    registerSyntheticBundle()
    await i18n.changeLanguage('en')
  })

  it('refreshes create-workspace source tabs when the UI language changes', async () => {
    expect(getSmartWorkspaceNameModes().map((mode) => mode.label)).toEqual([
      'Smart',
      'GitHub',
      'Linear',
      'Jira',
      'GitLab',
      'Branch',
      'Name'
    ])

    await i18n.changeLanguage(SYNTHETIC_LOCALE)

    expect(getSmartWorkspaceNameModes().map((mode) => mode.label)).toEqual([
      'Inteligente',
      'GitHub',
      'Linear',
      'Jira',
      'GitLab',
      'Rama',
      'Nombre'
    ])

    await i18n.changeLanguage('en')

    expect(getSmartWorkspaceNameModes().map((mode) => mode.label)).toEqual([
      'Smart',
      'GitHub',
      'Linear',
      'Jira',
      'GitLab',
      'Branch',
      'Name'
    ])
  })

  it('refreshes GitLab state filters when the UI language changes', async () => {
    expect(getMrStateFilters().map((filter) => filter.label)).toEqual([
      'Open',
      'Merged',
      'Closed',
      'All'
    ])

    await i18n.changeLanguage(SYNTHETIC_LOCALE)

    expect(getMrStateFilters().map((filter) => filter.label)).toEqual([
      'Abierta',
      'Fusionada',
      'Cerrada',
      'Todas'
    ])
  })
})
