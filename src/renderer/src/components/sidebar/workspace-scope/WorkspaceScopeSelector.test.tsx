// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'
import { WorkspaceScopeSelector } from './WorkspaceScopeSelector'

vi.mock('@/components/files/use-active-folder-path', () => ({
  useActiveFolderPath: () => '/brain'
}))

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  if (root && container) {
    act(() => root!.unmount())
    container.remove()
  }
  root = null
  container = null
  useAppStore.setState({
    activeWorkspaceScopeSlug: null,
    workspaceScopeOptions: [],
    workspaceScopeOptionsLoaded: false
  })
})

async function renderSelector(): Promise<void> {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(<WorkspaceScopeSelector />)
  })
}

describe('WorkspaceScopeSelector', () => {
  it('shows only the active workspace, never the others, until the selector opens (criterion 1)', async () => {
    ;(window as unknown as { api: { workspaceScope: Record<string, unknown> } }).api = {
      workspaceScope: {
        list: vi.fn().mockResolvedValue({
          workspaces: [
            { slug: 'tandem-pay', name: 'Tandem Pay', path: '/brain/workspaces/tandem-pay' },
            { slug: 'ops', name: 'Ops', path: '/brain/workspaces/ops' }
          ]
        })
      }
    }
    useAppStore.setState({ activeWorkspaceScopeSlug: 'tandem-pay' })
    await renderSelector()
    await act(async () => {
      await Promise.resolve()
    })

    const trigger = container?.querySelector('[data-testid="workspace-scope-selector"]')
    expect(trigger?.textContent).toContain('Tandem Pay')
    expect(container?.querySelector('[data-testid="workspace-scope-option-ops"]')).toBeNull()
  })

  it('opening the selector lists every workspace plus My work and New workspace (criterion 2)', async () => {
    const list = vi.fn().mockResolvedValue({
      workspaces: [
        { slug: 'tandem-pay', name: 'Tandem Pay', path: '/brain/workspaces/tandem-pay' },
        { slug: 'ops', name: 'Ops', path: '/brain/workspaces/ops' },
        { slug: 'growth', name: 'Growth', path: '/brain/workspaces/growth' }
      ]
    })
    ;(window as unknown as { api: { workspaceScope: Record<string, unknown> } }).api = {
      workspaceScope: { list }
    }
    await renderSelector()
    await act(async () => {
      await Promise.resolve()
    })

    const trigger = container?.querySelector<HTMLButtonElement>(
      '[data-testid="workspace-scope-selector"]'
    )
    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
      trigger?.click()
    })
    await act(async () => {
      await Promise.resolve()
    })

    const bodyText = document.body.textContent ?? ''
    expect(bodyText).toContain('Tandem Pay')
    expect(bodyText).toContain('Ops')
    expect(bodyText).toContain('Growth')
    expect(bodyText).toContain('My work')
    expect(bodyText).toContain('New workspace')
  })
})
