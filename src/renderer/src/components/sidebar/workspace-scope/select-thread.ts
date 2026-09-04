import { useAppStore } from '@/store'

/**
 * Spec 013, criterion 3: clicking a "Recent threads" row opens that thread —
 * same activation the tab bar itself does (`useTerminalActivationActions`),
 * plus leaving the Command Center home screen the way `openNewThread` does,
 * since a click on a row is picking a thread to work in.
 */
export function selectThread(tabId: string): void {
  const store = useAppStore.getState()
  store.leaveCommandCenter()
  store.setActiveTab(tabId)
  store.setActiveTabType('terminal')
  store.setActiveView('terminal')
}
