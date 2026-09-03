// @vitest-environment happy-dom

import type { ReactElement, RefObject } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setRendererPluginLanguagePacks, setRendererUiLanguage } from '@/i18n/i18n'
import { pluginLanguageResourceId } from '../../../../shared/plugins/plugin-language-pack-artifact'
import {
  ContextualTourOverlaySurface,
  handleContextualTourOverlayKeyDown,
  type ActiveTourRenderState
} from './ContextualTourOverlaySurface'

// Why: English is the only shipped catalog (specs/done/008-un-solo-idioma.md), so
// this exercises the same translate()-keyed lookup through a plugin language
// pack instead of a built-in Korean catalog that no longer ships.
const KOREAN_PACK_ID = 'plugin:orca-samples.korean/ko' as const
const KOREAN_RESOURCE_LANGUAGE = pluginLanguageResourceId(KOREAN_PACK_ID)
const KOREAN_CATALOG = {
  auto: {
    components: {
      contextual: {
        tours: {
          ContextualTourOverlaySurface: { complete: '완료' },
          contextual: {
            tour: { overlay: { measurement: { '38b3155418': '다음' } } }
          }
        }
      }
    }
  }
}

afterEach(async () => {
  setRendererPluginLanguagePacks([])
  await setRendererUiLanguage('en')
})

function renderSurface(isLastStep: boolean): ReactElement {
  const panelRef: RefObject<HTMLElement | null> = { current: null }
  const renderState: ActiveTourRenderState = {
    rect: new DOMRect(0, 0, 20, 20),
    targetElement: document.createElement('button'),
    progress: { current: isLastStep ? 2 : 1, total: 2 },
    title: 'Tour title',
    body: 'Tour body',
    isLastStep,
    isFirstStep: !isLastStep,
    panelHost: null
  }
  return (
    <ContextualTourOverlaySurface
      activeTourId="automations"
      renderState={renderState}
      panelRef={panelRef}
      panelHost={null}
      onSkip={vi.fn()}
      onBack={vi.fn()}
      onNext={vi.fn()}
      onStepAction={vi.fn()}
      onOverlayKeyDownCapture={handleContextualTourOverlayKeyDown}
    />
  )
}

describe('ContextualTourOverlaySurface localization', () => {
  it('renders default tour actions in Korean when the UI locale is Korean', async () => {
    setRendererPluginLanguagePacks([
      {
        id: KOREAN_PACK_ID,
        resourceLanguage: KOREAN_RESOURCE_LANGUAGE,
        pluginKey: 'orca-samples.korean',
        locale: 'ko',
        catalog: KOREAN_CATALOG
      }
    ])
    await setRendererUiLanguage(KOREAN_PACK_ID)

    const firstStep = renderToStaticMarkup(renderSurface(false))
    const finalStep = renderToStaticMarkup(renderSurface(true))

    expect(firstStep).toContain('다음')
    expect(firstStep).not.toContain('>Next<')
    expect(finalStep).toContain('완료')
    expect(finalStep).not.toContain('>Done<')
  })
})
