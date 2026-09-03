// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import {
  SimpleModeScopeEmptyState,
  type SimpleModeScopeEmptyStateKind
} from './SimpleModeScopeEmptyState'

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

function render(kind: SimpleModeScopeEmptyStateKind): void {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(<SimpleModeScopeEmptyState kind={kind} />)
  })
}

describe('SimpleModeScopeEmptyState', () => {
  it('renders the no-workspaces state', () => {
    render('no-workspaces')
    expect(container?.textContent).toContain('No workspaces yet')
  })

  it('renders the empty-workspace state', () => {
    render('empty-workspace')
    expect(container?.textContent).toContain('This workspace is empty')
  })

  it('renders the folder-not-ready state', () => {
    render('folder-not-ready')
    expect(container?.textContent).toContain("This folder isn't set up yet")
  })
})
