import React, { useMemo } from 'react'
import type { Components } from 'react-markdown'
import { MessageSquarePlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'
import { MarkdownPreviewBody } from '@/components/editor/MarkdownPreviewBody'
import { isEditableMarkdownFileName } from '../../../../shared/workspace-markdown-file'
import { translateWorkspaceNodeName } from './workspace-node-name'
import { useWorkspaceFileContent } from './use-workspace-file-content'
import { useWorkspaceFileAutosave } from './use-workspace-file-autosave'
import { WorkspaceFileSaveStatus } from './WorkspaceFileSaveStatus'
import { WorkspaceMarkdownEditor } from './WorkspaceMarkdownEditor'

const VIEWER_MARKDOWN_COMPONENTS: Components = {
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
      {children}
    </a>
  )
}

export type WorkspaceFileViewerProps = {
  rootPath: string | null
  filePath: string | null
  fileName: string | null
  onOpenThread: (filePath: string) => void
}

/** The right half of the Files screen: a document the person writes on when it
 *  is markdown (spec 024), and the read-only rendering of before for anything
 *  else (criterion 6). */
export function WorkspaceFileViewer({
  rootPath,
  filePath,
  fileName,
  onOpenThread
}: WorkspaceFileViewerProps): React.JSX.Element {
  const state = useWorkspaceFileContent(rootPath, filePath)
  const title = useMemo(() => (fileName ? translateWorkspaceNodeName(fileName) : null), [fileName])
  const isEditable = fileName !== null && isEditableMarkdownFileName(fileName)
  const autosave = useWorkspaceFileAutosave(
    isEditable ? rootPath : null,
    isEditable ? filePath : null,
    state.status === 'loaded' ? state.modifiedAtMs : null
  )

  if (!filePath) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {translate('auto.components.files.FilesPage.selectFilePrompt', 'Select a file to read it.')}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
        <span className="truncate text-sm font-medium text-foreground">{title}</span>
        <div className="flex shrink-0 items-center gap-3">
          {isEditable && state.status === 'loaded' ? (
            <WorkspaceFileSaveStatus state={autosave.state} />
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onOpenThread(filePath)}
          >
            <MessageSquarePlus className="size-3.5" />
            {translate(
              'auto.components.files.FilesPage.openThreadButton',
              'Open a thread about this file'
            )}
          </Button>
        </div>
      </div>
      {state.status === 'loading' || state.status === 'idle' ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : state.status === 'error' ? (
        <div className="p-4 text-sm text-destructive">
          {translate('auto.components.files.FilesPage.loadError', 'Could not read this file.')}
        </div>
      ) : isEditable ? (
        <WorkspaceMarkdownEditor
          documentKey={filePath}
          initialContent={state.content}
          onContentChange={autosave.onContentChange}
          ariaLabel={title ?? filePath}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto scrollbar-editor">
          <div className="markdown-body p-4" translate="no">
            <MarkdownPreviewBody content={state.content} components={VIEWER_MARKDOWN_COMPONENTS} />
          </div>
        </div>
      )}
    </div>
  )
}
