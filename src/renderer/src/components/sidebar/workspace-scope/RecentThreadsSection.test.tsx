// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RecentThreadsSection } from './RecentThreadsSection'

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  if (root && container) {
    act(() => root!.unmount())
    container.remove()
  }
  root = null
  container = null
})

async function render(props: Parameters<typeof RecentThreadsSection>[0]): Promise<void> {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(<RecentThreadsSection {...props} />)
  })
}

describe('RecentThreadsSection', () => {
  it('shows the empty state when there are no threads', async () => {
    await render({ threads: [], onSelectThread: vi.fn(), onViewHistory: vi.fn() })
    expect(container?.textContent).toContain('No recent threads yet')
  })

  it('lists test threads and opens one on click (criterion 5)', async () => {
    const onSelectThread = vi.fn()
    await render({
      threads: [
        { id: 't1', title: 'Reclamale el memo a Mariana Sosa', timestampLabel: '2h' },
        { id: 't2', title: 'Resumen del RFI de seguridad', timestampLabel: '1d' }
      ],
      onSelectThread,
      onViewHistory: vi.fn()
    })

    expect(container?.textContent).toContain('Reclamale el memo a Mariana Sosa')
    expect(container?.textContent).toContain('Resumen del RFI de seguridad')

    const button = [...(container?.querySelectorAll('button') ?? [])].find((candidate) =>
      candidate.textContent?.includes('Reclamale el memo a Mariana Sosa')
    )
    await act(async () => {
      button?.click()
    })
    expect(onSelectThread).toHaveBeenCalledWith('t1')
  })

  it('calls onViewHistory from the "View history" action', async () => {
    const onViewHistory = vi.fn()
    await render({ threads: [], onSelectThread: vi.fn(), onViewHistory })
    const viewHistoryButton = [...(container?.querySelectorAll('button') ?? [])].find(
      (candidate) => candidate.textContent === 'View history'
    )
    await act(async () => {
      viewHistoryButton?.click()
    })
    expect(onViewHistory).toHaveBeenCalled()
  })
})
