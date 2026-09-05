import type { AnyExtension } from '@tiptap/core'
import Placeholder from '@tiptap/extension-placeholder'
import { createRichMarkdownExtensions } from '@/components/editor/rich-markdown-extensions'
import type { RichMarkdownEditorCodec } from '@/components/editor/rich-markdown-source-transport'
import { translate } from '@/i18n/i18n'

/** The editing behaviour of the Files screen (spec 024): the rich markdown
 *  set inherited from Orca, plus the empty-document hint. Nothing here adds
 *  chrome — a toolbar, a rail or a source pane are components, not
 *  extensions, and this screen mounts none of them. */
export function createWorkspaceMarkdownExtensions(codec: RichMarkdownEditorCodec): AnyExtension[] {
  return [
    ...createRichMarkdownExtensions({ codec }),
    Placeholder.configure({
      placeholder: translate(
        'auto.components.files.WorkspaceMarkdownEditor.placeholder',
        'This document is empty. Start writing.'
      )
    })
  ]
}
