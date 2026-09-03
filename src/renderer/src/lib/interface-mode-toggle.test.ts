import { describe, expect, it } from 'vitest'
import { nextInterfaceModeOnAltClick } from './interface-mode-toggle'

describe('nextInterfaceModeOnAltClick', () => {
  it('flips simple to developer', () => {
    expect(nextInterfaceModeOnAltClick('simple')).toBe('developer')
  })

  it('flips developer back to simple', () => {
    expect(nextInterfaceModeOnAltClick('developer')).toBe('simple')
  })
})
