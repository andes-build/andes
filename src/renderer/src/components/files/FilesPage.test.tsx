// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'
import { FilesPage } from './FilesPage'

vi.mock('./use-active-folder-path', () => ({
  useActiveFolderPath: () => '/brain'
}))

function setApi(overrides: {
  fileTree?: ReturnType<typeof vi.fn>
  readFile?: ReturnType<typeof vi.fn>
}): void {
  ;(window as unknown as { api: { workspaceScope: Record<string, unknown> } }).api = {
    workspaceScope: {
      fileTree:
        overrides.fileTree ??
        vi.fn().mockResolvedValue({
          root: [
            {
              name: 'README.md',
              path: '/brain/README.md',
              relativePath: 'README.md',
              isDirectory: false
            }
          ]
        }),
      readFile: overrides.readFile ?? vi.fn().mockResolvedValue({ content: '# Hello' }),
      list: vi.fn().mockResolvedValue({ workspaces: [] })
    }
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

async function renderFilesPage(): Promise<void> {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(<FilesPage />)
  })
}

describe('FilesPage', () => {
  it('shows the root scope tree and opens a file with its content and thread button (criterion 9)', async () => {
    setApi({})
    useAppStore.setState({ activeWorkspaceScopeSlug: null, workspaceScopeOptions: [] })
    await renderFilesPage()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container?.textContent).toContain('What lives in My work')
    expect(container?.textContent).toContain('What this is')
    expect(container?.textContent).toContain('Hello')
    expect(container?.textContent).toContain('Open a thread about this file')
  })

  it('shows the empty-workspace state when the scoped tree has no files (criterion 10)', async () => {
    setApi({ fileTree: vi.fn().mockResolvedValue({ root: [] }) })
    useAppStore.setState({ activeWorkspaceScopeSlug: null, workspaceScopeOptions: [] })
    await renderFilesPage()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container?.textContent).toContain('This workspace is empty')
  })
})
