// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceFileViewer } from './WorkspaceFileViewer'

let root: Root | null = null
let container: HTMLDivElement | null = null

function setApi(content: string, writeFile = vi.fn()): void {
  ;(window as unknown as { api: Record<string, unknown> }).api = {
    ui: { setMarkdownEditorFocused: vi.fn() },
    workspaceScope: {
      readFile: vi.fn().mockResolvedValue({ content, modifiedAtMs: 1 }),
      writeFile
    }
  }
}

afterEach(() => {
  if (root && container) {
    act(() => root!.unmount())
    container.remove()
  }
  root = null
  container = null
})

async function renderViewer(fileName: string, content: string): Promise<void> {
  setApi(content)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(
      <WorkspaceFileViewer
        rootPath="/brain"
        filePath={`/brain/${fileName}`}
        fileName={fileName}
        onOpenThread={vi.fn()}
      />
    )
  })
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

function buttonLabels(): string[] {
  return Array.from(container?.querySelectorAll('button') ?? []).map(
    (button) => `${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`
  )
}

describe('WorkspaceFileViewer', () => {
  it('opens a markdown document in the editor and says it saves by itself, with no save button (criterion 3)', async () => {
    await renderViewer('decisions.md', '# Decisions\n')

    expect(container?.querySelector('[data-testid="workspace-file-editor"]')).not.toBeNull()
    expect(
      container?.querySelector('[data-testid="workspace-file-save-status"]')?.textContent
    ).toBe('Saves as you write')
    expect(buttonLabels().some((label) => /save/i.test(label))).toBe(false)
  })

  it('leaves a file that is not a document read-only, as it is today (criterion 6)', async () => {
    await renderViewer('orca.yaml', 'key: value\n')

    expect(container?.querySelector('[data-testid="workspace-file-editor"]')).toBeNull()
    expect(container?.querySelector('[data-testid="workspace-file-save-status"]')).toBeNull()
    expect(container?.querySelector('.markdown-body')).not.toBeNull()
    expect(container?.textContent).toContain('key: value')
  })

  it('shows no IDE furniture around the document (criterion 4)', async () => {
    await renderViewer('decisions.md', '# Decisions\n\n```js\nconst a = 1\n```\n')

    expect(container?.querySelectorAll('[role="tab"]').length).toBe(0)
    expect(container?.querySelector('.monaco-editor')).toBeNull()
    expect(container?.querySelector('.line-numbers')).toBeNull()
    expect(container?.querySelectorAll('textarea').length).toBe(0)
    expect(container?.textContent).not.toMatch(/\bline \d+\b/i)
  })
})
