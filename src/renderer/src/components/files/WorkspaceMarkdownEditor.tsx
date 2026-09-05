import React, { useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'

import { encodeRawMarkdownHtmlForRichEditor } from '@/components/editor/raw-markdown-html'
import { createRichMarkdownEditorCodec } from '@/components/editor/rich-markdown-source-transport'
import {
  getRichMarkdownSpellcheckAttribute,
  useRichMarkdownSpellcheckAttribute
} from '@/components/editor/rich-markdown-spellcheck'
import { useAppStore } from '@/store'
import { createWorkspaceMarkdownExtensions } from './workspace-markdown-extensions'

export type WorkspaceMarkdownEditorProps = {
  /** The document's text as it was read from disk. Changing it re-creates the
   *  editor, which is what opening another file does. */
  initialContent: string
  /** Identity of the open document: the editor is re-created when it changes,
   *  so text from one document can never land in another. */
  documentKey: string
  onContentChange: (content: string) => void
  ariaLabel: string
}

/** The document surface of the Files screen (spec 024): the person writes on
 *  the formatted text, never on the markdown source. It is the rich editor
 *  inherited from Orca with none of its chrome — no toolbar, no side rail, no
 *  outline panel, no source pane — and the text is laid out in a reading
 *  column instead of the full window width. */
export function WorkspaceMarkdownEditor({
  initialContent,
  documentKey,
  onContentChange,
  ariaLabel
}: WorkspaceMarkdownEditorProps): React.JSX.Element {
  const spellcheckEnabled = useAppStore((s) => s.settings?.richMarkdownSpellcheckEnabled ?? true)
  const onContentChangeRef = useRef(onContentChange)

  useEffect(() => {
    onContentChangeRef.current = onContentChange
  }, [onContentChange])

  // Why: Tiptap freezes the extension options when the editor is created, so
  // a document change must bring a fresh codec with them.
  const codec = useMemo(() => {
    void documentKey
    return createRichMarkdownEditorCodec()
  }, [documentKey])

  const extensions = useMemo(() => createWorkspaceMarkdownExtensions(codec), [codec])

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: encodeRawMarkdownHtmlForRichEditor(initialContent, codec),
      contentType: 'markdown',
      editable: true,
      editorProps: {
        attributes: {
          class: 'rich-markdown-editor',
          spellcheck: getRichMarkdownSpellcheckAttribute(spellcheckEnabled),
          'aria-label': ariaLabel
        }
      },
      onFocus: () => {
        window.api.ui.setMarkdownEditorFocused(true)
      },
      onBlur: () => {
        window.api.ui.setMarkdownEditorFocused(false)
      },
      onUpdate: ({ editor: nextEditor }) => {
        onContentChangeRef.current(nextEditor.getMarkdown())
      }
    },
    [codec, documentKey]
  )
  useRichMarkdownSpellcheckAttribute(editor, spellcheckEnabled)

  return (
    <div
      className="min-h-0 flex-1 overflow-auto scrollbar-editor"
      data-testid="workspace-file-editor"
    >
      <div className="mx-auto w-full max-w-[46rem] px-8 py-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
