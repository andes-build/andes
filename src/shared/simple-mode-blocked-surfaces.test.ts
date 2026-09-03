import { describe, expect, it } from 'vitest'
import {
  SIMPLE_MODE_BLOCKED_SURFACES,
  isSurfaceAvailableInInterfaceMode
} from './simple-mode-blocked-surfaces'

// Spec 002, criterion 5.
describe('isSurfaceAvailableInInterfaceMode', () => {
  it('reports every listed surface as unavailable in simple mode', () => {
    for (const surface of SIMPLE_MODE_BLOCKED_SURFACES) {
      expect(isSurfaceAvailableInInterfaceMode(surface, 'simple')).toBe(false)
    }
  })

  it('reports every listed surface as available in developer mode', () => {
    for (const surface of SIMPLE_MODE_BLOCKED_SURFACES) {
      expect(isSurfaceAvailableInInterfaceMode(surface, 'developer')).toBe(true)
    }
  })

  it('is exactly the fifteen surfaces criterion 5 names', () => {
    expect([...SIMPLE_MODE_BLOCKED_SURFACES].sort()).toEqual(
      [
        'browser-pane',
        'emulator-pane',
        'pull-request-page',
        'task-page',
        'dashboard',
        'dashboard-popout',
        'artifacts',
        'automations',
        'floating-terminal',
        'terminal-quick-commands',
        'cmd-j',
        'stats',
        'pet',
        'workspace-cleanup',
        'new-workspace'
      ].sort()
    )
  })
})
