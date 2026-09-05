// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Editor } from '@tiptap/core'
import { createRichMarkdownEditorCodec } from '@/components/editor/rich-markdown-source-transport'
import { WorkspaceMarkdownEditor } from './WorkspaceMarkdownEditor'
import { createWorkspaceMarkdownExtensions } from './workspace-markdown-extensions'

/** Types text the way a keyboard does, so the editor's input rules run — which
 *  is what "writing on the formatted text" means. */
function typeInto(editor: Editor, text: string): void {
  for (const character of text) {
    const { view } = editor
    const { from, to } = view.state.selection
    const handled = view.someProp('handleTextInput', (handler) =>
      handler(view, from, to, character, () => view.state.tr)
    )
    if (!handled) {
      editor.commands.insertContent(character)
    }
  }
}

let root: Root | null = null
let container: HTMLDivElement | null = null

function setApi(): void {
  ;(window as unknown as { api: Record<string, unknown> }).api = {
    ui: { setMarkdownEditorFocused: vi.fn() }
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

async function renderEditor(initialContent: string, onContentChange = vi.fn()): Promise<void> {
  setApi()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(
      <WorkspaceMarkdownEditor
        documentKey="/brain/decisions.md"
        initialContent={initialContent}
        onContentChange={onContentChange}
        ariaLabel="Decisions"
      />
    )
  })
  await act(async () => {
    await Promise.resolve()
  })
}

describe('WorkspaceMarkdownEditor', () => {
  it('shows the document formatted, never its markdown source (criterion 2)', async () => {
    await renderEditor('## Decisions\n\nWhat we chose.\n')

    expect(container?.querySelectorAll('h2').length).toBe(1)
    expect(container?.querySelector('h2')?.textContent).toBe('Decisions')
    expect(container?.textContent).not.toContain('##')
  })

  it('turns a heading into a heading while it is being written (criterion 2)', () => {
    // Same extension set the screen mounts, driven with real keystrokes.
    const element = document.createElement('div')
    document.body.appendChild(element)
    const codec = createRichMarkdownEditorCodec()
    const editor = new Editor({
      element,
      extensions: createWorkspaceMarkdownExtensions(codec),
      content: '',
      contentType: 'markdown'
    })
    editor.commands.focus('end')

    typeInto(editor, '## Written now')

    expect(element.querySelectorAll('h2').length).toBe(1)
    expect(element.querySelector('h2')?.textContent).toBe('Written now')
    expect(element.textContent).not.toContain('##')
    expect(editor.getMarkdown()).toContain('## Written now')
    editor.destroy()
    element.remove()
  })

  it('has no IDE furniture: no line numbers, no syntax highlighting, no source pane, no tabs (criterion 4)', async () => {
    await renderEditor('# Title\n\n```js\nconst a = 1\n```\n')

    // No line-number gutter, no editor tab strip, no source/preview split.
    expect(container?.querySelector('.line-numbers')).toBeNull()
    expect(container?.querySelector('[data-testid="editor-tabs"]')).toBeNull()
    expect(container?.querySelector('.monaco-editor')).toBeNull()
    expect(container?.querySelectorAll('[role="tab"]').length).toBe(0)
    expect(container?.querySelectorAll('textarea').length).toBe(0)
    // The raw markdown of the document is never shown as text.
    expect(container?.textContent).not.toContain('```')
  })

  it('lays the text out in a reading column, not the whole window width (criterion 4)', async () => {
    await renderEditor('# Title\n')

    const column = container?.querySelector('[data-testid="workspace-file-editor"] > div')
    expect(column?.className).toContain('max-w-[46rem]')
    expect(column?.className).toContain('mx-auto')
  })
})
