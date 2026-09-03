import type { AppState } from '../types'
import { INTERFACE_MODE_DEVELOPER, INTERFACE_MODE_SIMPLE } from '../../../../shared/interface-mode'
import type { InterfaceMode } from '../../../../shared/interface-mode'

/** Closes the gap spec 002 left open (2026-09-02, decisions.md): blocking the
 *  surfaces of `SIMPLE_MODE_BLOCKED_SURFACES` only stopped opening *new* ones —
 *  a browser tab, simulator tab, dashboard drawer, or task/PR page already open
 *  when the mode flips stayed open. This closes every one already open.
 *  Never touches terminal or agent-session tabs: the conversation survives. */
export function closeDeveloperOnlySurfacesForSimpleMode(
  get: () => Pick<
    AppState,
    | 'unifiedTabsByWorktree'
    | 'closeUnifiedTab'
    | 'closeBrowserTab'
    | 'activeView'
    | 'setActiveView'
    | 'agentDashboardDrawerOpen'
    | 'setAgentDashboardDrawerOpen'
  >
): void {
  const state = get()
  for (const tabs of Object.values(state.unifiedTabsByWorktree)) {
    for (const tab of tabs) {
      if (tab.contentType === 'browser') {
        // Why closeBrowserTab first: it owns browserTabsByWorktree and the
        // reopen/MRU bookkeeping — the same order useTabGroupTabCloseCommands
        // uses for a locally-closing browser tab (no paired remote host).
        state.closeBrowserTab(tab.entityId)
        state.closeUnifiedTab(tab.id)
      } else if (tab.contentType === 'simulator') {
        state.closeUnifiedTab(tab.id)
      }
    }
  }
  if (
    state.activeView === 'tasks' ||
    state.activeView === 'automations' ||
    state.activeView === 'artifacts'
  ) {
    state.setActiveView('terminal')
  }
  if (state.agentDashboardDrawerOpen) {
    state.setAgentDashboardDrawerOpen(false)
  }
}

/** True only for the developer -> simple transition — the only direction that
 *  can strand a surface simple mode no longer offers. */
export function isSwitchingToSimpleMode(
  previous: InterfaceMode | null | undefined,
  next: InterfaceMode | null | undefined
): boolean {
  return previous === INTERFACE_MODE_DEVELOPER && next === INTERFACE_MODE_SIMPLE
}
