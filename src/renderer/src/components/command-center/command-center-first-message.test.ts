import { describe, expect, it } from 'vitest'
import {
  buildCheckFindingMessage,
  buildSuggestedActionMessage,
  buildWaitingResolveMessage
} from './command-center-first-message'

describe('spec009#6 command center first-message builders', () => {
  it('names the initiative and what it is waiting on', () => {
    expect(buildWaitingResolveMessage('migracion-kyc — waiting on you')).toBe(
      'Help me resolve "migracion-kyc" — it\'s waiting on you.'
    )
  })

  it('still names the initiative when the row has no waiting label', () => {
    expect(buildWaitingResolveMessage('migracion-kyc')).toBe('Help me resolve "migracion-kyc".')
  })

  it('carries the check finding text verbatim', () => {
    expect(buildCheckFindingMessage('capability not installed: position role "cpo"')).toBe(
      'Help me look at this check finding: capability not installed: position role "cpo"'
    )
  })

  it('carries the suggested action line verbatim', () => {
    expect(
      buildSuggestedActionMessage('Chase Mariana Sosa for the memo blocking migracion-kyc')
    ).toBe('Chase Mariana Sosa for the memo blocking migracion-kyc')
  })
})
