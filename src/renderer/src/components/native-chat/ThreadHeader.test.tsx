// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { useAppStore } from '@/store'
import { ThreadHeader } from './ThreadHeader'

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  if (root && container) {
    act(() => root!.unmount())
    container.remove()
  }
  root = null
  container = null
  useAppStore.setState({ tabsByWorktree: {} })
})

async function renderHeader(tabId: string | null): Promise<void> {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(<ThreadHeader tabId={tabId} />)
  })
}

/**
 * Spec 013, criterion 4: the title above the conversation and, below it, the
 * scope the thread was born with — "My work" at the root, "Workspace ·
 * Focus: <name>" inside a workspace (spec 019's scope logic, unchanged).
 */
describe('ThreadHeader (spec 013)', () => {
  it('shows "My work" for a thread born at the root', async () => {
    useAppStore.setState({
      tabsByWorktree: {
        'wt-1': [
          {
            id: 'tab-1',
            threadScope: { kind: 'root' },
            customTitle: null,
            aiVaultTitle: null
          } as never
        ]
      }
    })

    await renderHeader('tab-1')

    const scope = container?.querySelector('[data-testid="thread-scope-badge"]')
    expect(scope?.textContent).toContain('My work')
  })

  it('shows the workspace name for a thread born in a workspace', async () => {
    useAppStore.setState({
      tabsByWorktree: {
        'wt-1': [
          {
            id: 'tab-1',
            threadScope: { kind: 'workspace', slug: 'tandem-pay', name: 'Tandem Pay' },
            customTitle: null,
            aiVaultTitle: null
          } as never
        ]
      }
    })

    await renderHeader('tab-1')

    const scope = container?.querySelector('[data-testid="thread-scope-badge"]')
    expect(scope?.textContent).toContain('Tandem Pay')
  })

  it('renders nothing for a tab without a captured scope (e.g. developer mode)', async () => {
    useAppStore.setState({
      tabsByWorktree: { 'wt-1': [{ id: 'tab-1' } as never] }
    })

    await renderHeader('tab-1')

    expect(container?.querySelector('[data-testid="thread-header"]')).toBeNull()
  })

  it('renders nothing without a tab id', async () => {
    await renderHeader(null)

    expect(container?.querySelector('[data-testid="thread-header"]')).toBeNull()
  })

  it('shows the CLI ai-title when there is no custom-title or manual rename', async () => {
    useAppStore.setState({
      tabsByWorktree: {
        'wt-1': [
          {
            id: 'tab-1',
            threadScope: { kind: 'root' },
            customTitle: null,
            aiVaultTitle: {
              agent: 'claude',
              sessionId: 's1',
              title: 'x',
              explicitTitle: 'Fix the login bug'
            }
          } as never
        ]
      }
    })

    await renderHeader('tab-1')

    const title = container?.querySelector('[data-testid="thread-header-title"]')
    expect(title?.textContent).toBe('Fix the login bug')
  })

  it('shows "New thread" when the CLI wrote no title at all', async () => {
    useAppStore.setState({
      tabsByWorktree: {
        'wt-1': [
          {
            id: 'tab-1',
            threadScope: { kind: 'root' },
            customTitle: null,
            aiVaultTitle: null
          } as never
        ]
      }
    })

    await renderHeader('tab-1')

    const title = container?.querySelector('[data-testid="thread-header-title"]')
    expect(title?.textContent).toBe('New thread')
  })

  it('a manual rename in Andes wins over the CLI title', async () => {
    useAppStore.setState({
      tabsByWorktree: {
        'wt-1': [
          {
            id: 'tab-1',
            threadScope: { kind: 'root' },
            customTitle: 'My own name',
            aiVaultTitle: {
              agent: 'claude',
              sessionId: 's1',
              title: 'x',
              explicitTitle: 'Fix the login bug'
            }
          } as never
        ]
      }
    })

    await renderHeader('tab-1')

    const title = container?.querySelector('[data-testid="thread-header-title"]')
    expect(title?.textContent).toBe('My own name')
  })
})
