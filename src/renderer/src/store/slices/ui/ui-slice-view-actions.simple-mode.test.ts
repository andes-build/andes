import { afterEach, describe, expect, it } from 'vitest'
import { useAppStore } from '@/store'
import type { AppState } from '@/store/types'

const initialAppState = useAppStore.getInitialState()

afterEach(() => {
  useAppStore.setState(initialAppState, true)
})

// Spec 002, criterion 5: task-page, automations, and artifacts are
// developer-only surfaces regardless of who calls their opener.
describe('view openers — simple mode blocks developer-only views', () => {
  it('does not switch to tasks in simple mode', () => {
    useAppStore.setState({
      settings: { ...initialAppState.settings, interfaceMode: 'simple' }
    } as Partial<AppState>)

    useAppStore.getState().openTaskPage()

    expect(useAppStore.getState().activeView).toBe('terminal')
  })

  it('does not switch to automations in simple mode', () => {
    useAppStore.setState({
      settings: { ...initialAppState.settings, interfaceMode: 'simple' }
    } as Partial<AppState>)

    useAppStore.getState().openAutomationsPage()

    expect(useAppStore.getState().activeView).toBe('terminal')
  })

  it('does not switch to artifacts in simple mode', () => {
    useAppStore.setState({
      settings: { ...initialAppState.settings, interfaceMode: 'simple' }
    } as Partial<AppState>)

    useAppStore.getState().openArtifactsPage()

    expect(useAppStore.getState().activeView).toBe('terminal')
  })

  it('switches views normally in developer mode', () => {
    useAppStore.setState({
      settings: { ...initialAppState.settings, interfaceMode: 'developer' }
    } as Partial<AppState>)

    useAppStore.getState().openAutomationsPage()
    expect(useAppStore.getState().activeView).toBe('automations')

    useAppStore.getState().openArtifactsPage()
    expect(useAppStore.getState().activeView).toBe('artifacts')
  })
})
