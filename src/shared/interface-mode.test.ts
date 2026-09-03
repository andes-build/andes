import { describe, expect, it } from 'vitest'
import { normalizeInterfaceMode, readInterfaceModeFromEnv } from './interface-mode'

describe('normalizeInterfaceMode', () => {
  it('falls back to simple for undefined, invalid, or empty values', () => {
    expect(normalizeInterfaceMode(undefined)).toBe('simple')
    expect(normalizeInterfaceMode('god-mode')).toBe('simple')
    expect(normalizeInterfaceMode('')).toBe('simple')
  })

  it('accepts developer as-is', () => {
    expect(normalizeInterfaceMode('developer')).toBe('developer')
  })
})

describe('readInterfaceModeFromEnv', () => {
  it('opens developer mode when ANDES_INTERFACE_MODE=developer at launch', () => {
    expect(readInterfaceModeFromEnv({ ANDES_INTERFACE_MODE: 'developer' })).toBe('developer')
  })

  it('ignores unset or unrecognized values, leaving the persisted preference in charge', () => {
    expect(readInterfaceModeFromEnv({})).toBeNull()
    expect(readInterfaceModeFromEnv({ ANDES_INTERFACE_MODE: 'simple' })).toBeNull()
    expect(readInterfaceModeFromEnv({ ANDES_INTERFACE_MODE: 'nonsense' })).toBeNull()
  })
})
