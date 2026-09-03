// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ANDES_REPO_URL, StarStep } from './StarStep'

function setApi(): {
  openUrl: ReturnType<typeof vi.fn>
  complete: ReturnType<typeof vi.fn>
  later: ReturnType<typeof vi.fn>
} {
  const openUrl = vi.fn()
  const complete = vi.fn()
  const later = vi.fn()
  ;(
    window as unknown as {
      api: {
        shell: { openUrl: typeof openUrl }
        starNag: { complete: typeof complete; later: typeof later }
      }
    }
  ).api = {
    shell: { openUrl },
    starNag: { complete, later }
  }
  return { openUrl, complete, later }
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

function render(onDone: () => void = () => {}): void {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(<StarStep onDone={onDone} />)
  })
}

describe('spec005#8 StarStep', () => {
  it('"Give it a star" opens the Andes repo, marks the star-nag service completed, and finishes onboarding', () => {
    const api = setApi()
    const onDone = vi.fn()
    render(onDone)
    const [starButton] = Array.from(container!.querySelectorAll('button'))
    act(() => {
      starButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(api.openUrl).toHaveBeenCalledWith(ANDES_REPO_URL)
    expect(api.complete).toHaveBeenCalledTimes(1)
    expect(api.later).not.toHaveBeenCalled()
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('"Not now" defers the star-nag service and finishes onboarding', () => {
    const api = setApi()
    const onDone = vi.fn()
    render(onDone)
    const buttons = Array.from(container!.querySelectorAll('button'))
    const laterButton = buttons[1]
    act(() => {
      laterButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(api.later).toHaveBeenCalledTimes(1)
    expect(api.complete).not.toHaveBeenCalled()
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
