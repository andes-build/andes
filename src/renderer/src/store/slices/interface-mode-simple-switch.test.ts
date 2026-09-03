import { describe, expect, it, vi } from 'vitest'
import {
  closeDeveloperOnlySurfacesForSimpleMode,
  isSwitchingToSimpleMode
} from './interface-mode-simple-switch'
import type { Tab } from '../../../../shared/tab-types'
import type { TopLevelView } from '../../../../shared/ui-chrome-types'

function makeTab(id: string, contentType: Tab['contentType']): Tab {
  return { id, entityId: id, contentType } as Tab
}

function activeView(view: TopLevelView): TopLevelView {
  return view
}

describe('isSwitchingToSimpleMode', () => {
  it('is true only for developer -> simple', () => {
    expect(isSwitchingToSimpleMode('developer', 'simple')).toBe(true)
  })

  it('is false for simple -> developer', () => {
    expect(isSwitchingToSimpleMode('simple', 'developer')).toBe(false)
  })

  it('is false when the mode does not change', () => {
    expect(isSwitchingToSimpleMode('developer', 'developer')).toBe(false)
    expect(isSwitchingToSimpleMode('simple', 'simple')).toBe(false)
  })

  it('is false when next is undefined (an unrelated settings update)', () => {
    expect(isSwitchingToSimpleMode('developer', undefined)).toBe(false)
  })
})

// spec006#7 — closes the gap spec 002 left open: switching to simple mode with
// a browser tab, a dashboard drawer, and a PR page already open closes all
// three and leaves the terminal/agent-session tabs (the conversation) intact.
describe('closeDeveloperOnlySurfacesForSimpleMode', () => {
  it('closes browser and simulator tabs, but never terminal or agent-session tabs', () => {
    const closeUnifiedTab = vi.fn()
    const state = {
      unifiedTabsByWorktree: {
        wt1: [
          makeTab('term-1', 'terminal'),
          makeTab('browser-1', 'browser'),
          makeTab('agent-1', 'agent-session')
        ],
        wt2: [makeTab('sim-1', 'simulator')]
      },
      closeUnifiedTab,
      closeBrowserTab: vi.fn(),
      activeView: activeView('terminal'),
      setActiveView: vi.fn(),
      agentDashboardDrawerOpen: false,
      setAgentDashboardDrawerOpen: vi.fn()
    }

    closeDeveloperOnlySurfacesForSimpleMode(() => state)

    expect(closeUnifiedTab).toHaveBeenCalledTimes(2)
    expect(closeUnifiedTab).toHaveBeenCalledWith('browser-1')
    expect(closeUnifiedTab).toHaveBeenCalledWith('sim-1')
    expect(closeUnifiedTab).not.toHaveBeenCalledWith('term-1')
    expect(closeUnifiedTab).not.toHaveBeenCalledWith('agent-1')
    // Browser tabs also need closeBrowserTab — it owns browserTabsByWorktree,
    // which closeUnifiedTab alone does not clean up.
    expect(state.closeBrowserTab).toHaveBeenCalledWith('browser-1')
    expect(state.closeBrowserTab).not.toHaveBeenCalledWith('sim-1')
  })

  it('sends the PR/task page, automations, and artifacts views back to terminal', () => {
    for (const view of ['tasks', 'automations', 'artifacts'] as const) {
      const setActiveView = vi.fn()
      const state = {
        unifiedTabsByWorktree: {},
        closeUnifiedTab: vi.fn(),
        closeBrowserTab: vi.fn(),
        activeView: activeView(view),
        setActiveView,
        agentDashboardDrawerOpen: false,
        setAgentDashboardDrawerOpen: vi.fn()
      }
      closeDeveloperOnlySurfacesForSimpleMode(() => state)
      expect(setActiveView).toHaveBeenCalledWith('terminal')
    }
  })

  it('leaves the terminal view alone', () => {
    const setActiveView = vi.fn()
    const state = {
      unifiedTabsByWorktree: {},
      closeUnifiedTab: vi.fn(),
      closeBrowserTab: vi.fn(),
      activeView: activeView('terminal'),
      setActiveView,
      agentDashboardDrawerOpen: false,
      setAgentDashboardDrawerOpen: vi.fn()
    }
    closeDeveloperOnlySurfacesForSimpleMode(() => state)
    expect(setActiveView).not.toHaveBeenCalled()
  })

  it('closes the agent dashboard drawer', () => {
    const setAgentDashboardDrawerOpen = vi.fn()
    const state = {
      unifiedTabsByWorktree: {},
      closeUnifiedTab: vi.fn(),
      closeBrowserTab: vi.fn(),
      activeView: activeView('terminal'),
      setActiveView: vi.fn(),
      agentDashboardDrawerOpen: true,
      setAgentDashboardDrawerOpen
    }
    closeDeveloperOnlySurfacesForSimpleMode(() => state)
    expect(setAgentDashboardDrawerOpen).toHaveBeenCalledWith(false)
  })
})
