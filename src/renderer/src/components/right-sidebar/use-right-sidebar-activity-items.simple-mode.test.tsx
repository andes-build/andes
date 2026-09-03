// @vitest-environment happy-dom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { useAppStore } from '@/store'
import type { AppState } from '@/store/types'
import {
  useRightSidebarActivityItems,
  type RightSidebarActivityItems
} from './use-right-sidebar-activity-items'
import type { InterfaceMode } from '../../../../shared/interface-mode'

const initialAppState = useAppStore.getInitialState()

const roots: Root[] = []
let latest: RightSidebarActivityItems | null = null

function HookProbe(): null {
  latest = useRightSidebarActivityItems({ rightSidebarOpen: true })
  return null
}

async function renderWithMode(interfaceMode: InterfaceMode): Promise<RightSidebarActivityItems> {
  useAppStore.setState(initialAppState, true)
  useAppStore.setState({
    settings: { ...initialAppState.settings, interfaceMode }
  } as Partial<AppState>)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  roots.push(root)
  await act(async () => {
    root.render(createElement(HookProbe))
  })
  if (!latest) {
    throw new Error('hook probe did not render')
  }
  return latest
}

afterEach(() => {
  roots.splice(0).forEach((root) => act(() => root.unmount()))
  document.body.replaceChildren()
  useAppStore.setState(initialAppState, true)
  latest = null
})

// Spec 002, criterion 4.
describe('useRightSidebarActivityItems — interface mode', () => {
  it('offers only Explorer, Agents (AI Vault), and Source Control in simple mode', async () => {
    const { visibleItems } = await renderWithMode('simple')
    const ids = visibleItems.map((item) => item.id)

    expect(ids).not.toContain('checks')
    expect(ids).not.toContain('ports')
    expect(ids).not.toContain('workspaces')
    expect(ids).not.toContain('pr-checks')
    expect(ids.some((id) => id.startsWith('plugin:'))).toBe(false)
    expect(ids).toContain('vault')
  })

  it('keeps every developer tab available in developer mode', async () => {
    const { visibleItems } = await renderWithMode('developer')
    const ids = visibleItems.map((item) => item.id)

    expect(ids).toContain('checks')
    expect(ids).toContain('vault')
  })
})
