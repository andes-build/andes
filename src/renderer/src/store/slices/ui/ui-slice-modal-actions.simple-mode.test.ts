import { afterEach, describe, expect, it } from 'vitest'
import { useAppStore } from '@/store'
import type { AppState } from '@/store/types'

const initialAppState = useAppStore.getInitialState()

afterEach(() => {
  useAppStore.setState(initialAppState, true)
})

// Spec 002, criterion 5: cmd-j, workspace-cleanup, and new-workspace are
// developer-only modals — openModal must refuse them in simple mode regardless
// of who calls it (button, shortcut bridge, cmd-j quick action, contextual tour).
describe('openModal — simple mode blocks developer-only modals', () => {
  it.each(['worktree-palette', 'workspace-cleanup', 'new-workspace-composer'] as const)(
    'refuses to open %s in simple mode',
    (modal) => {
      useAppStore.setState({
        settings: { ...initialAppState.settings, interfaceMode: 'simple' }
      } as Partial<AppState>)

      useAppStore.getState().openModal(modal)

      expect(useAppStore.getState().activeModal).toBe('none')
    }
  )

  it.each(['worktree-palette', 'workspace-cleanup', 'new-workspace-composer'] as const)(
    'opens %s normally in developer mode',
    (modal) => {
      useAppStore.setState({
        settings: { ...initialAppState.settings, interfaceMode: 'developer' }
      } as Partial<AppState>)

      useAppStore.getState().openModal(modal)

      expect(useAppStore.getState().activeModal).toBe(modal)
    }
  )

  it('leaves unrelated modals unaffected by simple mode', () => {
    useAppStore.setState({
      settings: { ...initialAppState.settings, interfaceMode: 'simple' }
    } as Partial<AppState>)

    useAppStore.getState().openModal('add-repo')

    expect(useAppStore.getState().activeModal).toBe('add-repo')
  })
})
