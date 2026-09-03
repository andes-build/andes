// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SkillsStep } from './SkillsStep'

function setApi(detectNpx: ReturnType<typeof vi.fn>): void {
  ;(
    window as unknown as {
      api: {
        preflight: { detectNpx: typeof detectNpx }
        shell: { openUrl: ReturnType<typeof vi.fn> }
      }
    }
  ).api = {
    preflight: { detectNpx },
    shell: { openUrl: vi.fn() }
  }
}

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

function render(): void {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(<SkillsStep detectedAgents={['claude']} />)
  })
}

describe('spec005#6 SkillsStep npx gate', () => {
  it('offers to install Node.js when npx is unavailable', async () => {
    setApi(vi.fn().mockResolvedValue(false))
    render()
    await act(async () => {
      await Promise.resolve()
    })
    expect(container!.textContent).toContain('Install Node.js')
    expect(container!.querySelector('input')).toBeNull()
  })

  it('shows the repository field once npx is available', async () => {
    setApi(vi.fn().mockResolvedValue(true))
    render()
    await act(async () => {
      await Promise.resolve()
    })
    expect(container!.querySelector('input')).not.toBeNull()
  })
})
