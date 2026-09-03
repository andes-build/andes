import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { getDefaultSettings } from '../../../../shared/constants'
import { GeneralPane } from './GeneralPane'
import { TooltipProvider } from '../ui/tooltip'

// Spec 002, criterion 2: no visible control changes interface mode. General is
// the pane the criterion names explicitly.
describe('GeneralPane — no interface mode control', () => {
  it('never renders a mode selector, in simple or developer settings', () => {
    for (const interfaceMode of ['simple', 'developer'] as const) {
      const settings = { ...getDefaultSettings('/tmp/andes-test'), interfaceMode }
      const html = renderToStaticMarkup(
        React.createElement(
          TooltipProvider,
          null,
          React.createElement(GeneralPane, {
            settings,
            updateSettings: vi.fn(),
            fontSuggestions: []
          })
        )
      )

      expect(html.toLowerCase()).not.toMatch(/interface mode/)
      expect(html.toLowerCase()).not.toMatch(/developer mode/)
      expect(html).not.toMatch(/data-interface-mode-control/)
    }
  })
})
