// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'
import { SimpleModeNav } from './SimpleModeNav'

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

  it('New thread opens the single agent conversation view', async () => {
    const setActiveView = vi.fn()
    useAppStore.setState({ setActiveView })
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

    expect(setActiveView).toHaveBeenCalledWith('terminal')
  })
})
