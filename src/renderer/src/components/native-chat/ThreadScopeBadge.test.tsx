// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { useAppStore } from '@/store'
import { ThreadScopeBadge } from './ThreadScopeBadge'

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

async function renderBadge(tabId: string | null): Promise<void> {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(<ThreadScopeBadge tabId={tabId} />)
  })
}

/**
 * Spec 019, criterion 3: the thread screen shows what it was born with,
 * reading `TerminalTab.threadScope` — never the sidebar selector's live
 * value, so switching the selector never changes what an open thread shows.
 */
describe('ThreadScopeBadge (spec 019)', () => {
  it('spec019#7 shows "My work" for a thread born at the root', async () => {
    useAppStore.setState({
      tabsByWorktree: {
        'wt-1': [{ id: 'tab-1', threadScope: { kind: 'root' } } as never]
      }
    })

    await renderBadge('tab-1')

    const badge = container?.querySelector('[data-testid="thread-scope-badge"]')
    expect(badge?.textContent).toContain('My work')
  })

  it('spec019#8 shows the workspace name for a thread born in a workspace', async () => {
    useAppStore.setState({
      tabsByWorktree: {
        'wt-1': [
          {
            id: 'tab-1',
            threadScope: { kind: 'workspace', slug: 'tandem-pay', name: 'Tandem Pay' }
          } as never
        ]
      }
    })

    await renderBadge('tab-1')

    const badge = container?.querySelector('[data-testid="thread-scope-badge"]')
    expect(badge?.textContent).toContain('Tandem Pay')
  })

  it('spec019#9 renders nothing for a tab without a captured scope (e.g. developer mode)', async () => {
    useAppStore.setState({
      tabsByWorktree: { 'wt-1': [{ id: 'tab-1' } as never] }
    })

    await renderBadge('tab-1')

    expect(container?.querySelector('[data-testid="thread-scope-badge"]')).toBeNull()
  })

  it('renders nothing without a tab id', async () => {
    await renderBadge(null)

    expect(container?.querySelector('[data-testid="thread-scope-badge"]')).toBeNull()
  })
})
