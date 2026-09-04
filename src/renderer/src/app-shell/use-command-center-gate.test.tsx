// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const storeState: Record<string, unknown> = {}

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) => selector(storeState)
}))

const interfaceMode = { current: 'simple' }
vi.mock('@/hooks/useInterfaceMode', () => ({
  useInterfaceMode: () => interfaceMode.current
}))

import { useCommandCenterGate } from './use-command-center-gate'

const FOLDER_KEY = 'folder:fw1'

function setStore(options: { threads: boolean; requested: boolean }): void {
  storeState.folderWorkspaces = [{ id: 'fw1', folderPath: '/brain' }]
  storeState.allWorktrees = () => []
  storeState.tabsByWorktree = {
    [FOLDER_KEY]: options.threads ? [{ id: 't1', launchAgent: 'claude' }] : [{ id: 't1' }]
  }
  storeState.commandCenterRequested = options.requested
}

beforeEach(() => {
  interfaceMode.current = 'simple'
  setStore({ threads: false, requested: false })
})

afterEach(() => {
  vi.clearAllMocks()
})

/** Spec 009, criterion 1 — plus the navigation item spec 010 shipped
 *  pointing at this screen. */
describe('spec009#1 useCommandCenterGate', () => {
  it('takes the view for a folder with no thread yet', () => {
    const { result } = renderHook(() => useCommandCenterGate(FOLDER_KEY))
    expect(result.current).toEqual({ active: true, brainPath: '/brain', worktreeId: FOLDER_KEY })
  })

  it('a plain terminal tab is not a thread', () => {
    storeState.tabsByWorktree = { [FOLDER_KEY]: [{ id: 't1' }, { id: 't2' }] }
    const { result } = renderHook(() => useCommandCenterGate(FOLDER_KEY))
    expect(result.current.active).toBe(true)
  })

  it('steps aside once a thread is open', () => {
    setStore({ threads: true, requested: false })
    const { result } = renderHook(() => useCommandCenterGate(FOLDER_KEY))
    expect(result.current.active).toBe(false)
  })

  it('comes back when the operator asks for it from the navigation', () => {
    setStore({ threads: true, requested: true })
    const { result } = renderHook(() => useCommandCenterGate(FOLDER_KEY))
    expect(result.current.active).toBe(true)
  })

  it('never takes the view in developer mode (criterion 9)', () => {
    interfaceMode.current = 'developer'
    const { result } = renderHook(() => useCommandCenterGate(FOLDER_KEY))
    expect(result.current.active).toBe(false)
  })

  it('never takes the view with no workspace open', () => {
    const { result } = renderHook(() => useCommandCenterGate(null))
    expect(result.current.active).toBe(false)
  })
})
