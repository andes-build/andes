// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SessionStep } from './SessionStep'

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve
  })
  return { promise, resolve }
}

function setApi(add: ReturnType<typeof vi.fn>): void {
  ;(
    window as unknown as {
      api: {
        claudeAccounts: { add: typeof add; cancelPendingLogin: ReturnType<typeof vi.fn> }
        codexAccounts: { add: typeof add }
      }
    }
  ).api = {
    claudeAccounts: { add, cancelPendingLogin: vi.fn() },
    codexAccounts: { add: vi.fn() }
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

function render(agent: 'claude' | 'codex' | null): void {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(<SessionStep selectedAgent={agent} />)
  })
}

describe('spec005#3 SessionStep', () => {
  it('never mentions a password or token in its visible text', () => {
    render('claude')
    expect(container!.textContent).not.toMatch(/password/i)
    expect(container!.textContent).not.toMatch(/token/i)
  })

  it('goes idle -> pending -> ready across the CLI login session', async () => {
    const deferred = createDeferred<{ accounts: { email: string }[] }>()
    const add = vi.fn().mockReturnValue(deferred.promise)
    setApi(add)
    render('claude')

    expect(container!.textContent).toContain('Sign in with Claude')

    const button = container!.querySelector('button')!
    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(container!.textContent).toContain('Waiting for the browser')

    await act(async () => {
      deferred.resolve({ accounts: [{ email: 'person@example.com' }] })
      await deferred.promise
    })
    expect(container!.textContent).toContain('person@example.com')
    expect(add).toHaveBeenCalledTimes(1)
  })

  it('reports a readable error when the login session fails', async () => {
    const add = vi.fn().mockRejectedValue(new Error('Sign-in timed out'))
    setApi(add)
    render('claude')

    const button = container!.querySelector('button')!
    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(container!.textContent).toContain('Sign-in timed out')
  })
})
