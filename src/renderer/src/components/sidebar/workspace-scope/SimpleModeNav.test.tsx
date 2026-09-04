// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'
import { SimpleModeNav } from './SimpleModeNav'
import { openNewThread } from './open-new-thread'

// Spec 015: the launch path itself is evaluated in open-new-thread.test.ts;
// here the only question is that the button reaches it.
vi.mock('./open-new-thread', () => ({ openNewThread: vi.fn(() => Promise.resolve()) }))

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

describe('SimpleModeNav', () => {
  it('is exactly New thread, Command Center, Files, Agents & skills, More (criterion 4)', async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root!.render(<SimpleModeNav />)
    })

    const nav = container.querySelector('[data-testid="simple-mode-nav"]')
    const labels = [...(nav?.querySelectorAll('button') ?? [])].map((button) =>
      button.textContent?.trim()
    )
    expect(labels).toEqual(['New thread', 'Command Center', 'Files', 'Agents & skills', 'More'])
  })

  it('spec015#6 New thread delegates to the thread launcher, never to a bare createTab', async () => {
    const createTab = vi.fn()
    useAppStore.setState({ createTab, activeWorktreeId: 'wt-1' })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root!.render(<SimpleModeNav />)
    })

    const button = container.querySelector<HTMLButtonElement>(
      '[data-testid="simple-mode-nav-new-thread"]'
    )
    await act(async () => {
      button?.click()
    })

    expect(openNewThread).toHaveBeenCalledTimes(1)
    expect(createTab).not.toHaveBeenCalled()
  })
})
