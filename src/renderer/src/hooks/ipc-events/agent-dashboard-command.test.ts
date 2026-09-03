import { describe, expect, it, vi } from 'vitest'
import type { InterfaceMode } from '../../../../shared/interface-mode'
import { toggleAgentDashboardFromShortcut } from './agent-dashboard-command'

function baseState(interfaceMode: InterfaceMode) {
  return {
    activeView: 'terminal' as const,
    settings: {
      experimentalAgentDashboardPopout: true,
      experimentalAgentDashboardMode: 'drawer',
      interfaceMode
    },
    agentDashboardDrawerOpen: false,
    setSidebarOpen: vi.fn(),
    setAgentDashboardDrawerOpen: vi.fn()
  }
}

// Spec 002, criterion 5.
describe('toggleAgentDashboardFromShortcut — interface mode', () => {
  it('does nothing in simple mode even when the popout preference is on', () => {
    const state = baseState('simple')
    const openPopout = vi.fn()

    toggleAgentDashboardFromShortcut(state as never, openPopout)

    expect(state.setAgentDashboardDrawerOpen).not.toHaveBeenCalled()
    expect(openPopout).not.toHaveBeenCalled()
  })

  it('opens the drawer in developer mode as before', () => {
    const state = baseState('developer')
    const openPopout = vi.fn()

    toggleAgentDashboardFromShortcut(state as never, openPopout)

    expect(state.setAgentDashboardDrawerOpen).toHaveBeenCalledWith(true)
  })
})
