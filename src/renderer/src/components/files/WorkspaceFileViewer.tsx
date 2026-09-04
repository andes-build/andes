import React, { useMemo } from 'react'
import type { Components } from 'react-markdown'
import { MessageSquarePlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'
import { MarkdownPreviewBody } from '@/components/editor/MarkdownPreviewBody'
import { translateWorkspaceNodeName } from './workspace-node-name'
import { useWorkspaceFileContent } from './use-workspace-file-content'

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

export function WorkspaceFileViewer({
  rootPath,
  filePath,
  fileName,
  onOpenThread
}: WorkspaceFileViewerProps): React.JSX.Element {
  const state = useWorkspaceFileContent(rootPath, filePath)
  const title = useMemo(() => (fileName ? translateWorkspaceNodeName(fileName) : null), [fileName])

  if (!filePath) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {translate('auto.components.files.FilesPage.selectFilePrompt', 'Select a file to read it.')}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <span className="truncate text-sm font-medium text-foreground">{title}</span>
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
      <div className="min-h-0 flex-1 overflow-auto scrollbar-editor">
        {state.status === 'loading' || state.status === 'idle' ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : state.status === 'error' ? (
          <div className="p-4 text-sm text-destructive">
            {translate('auto.components.files.FilesPage.loadError', 'Could not read this file.')}
          </div>
        ) : (
          <div className="markdown-body p-4" translate="no">
            <MarkdownPreviewBody content={state.content} components={VIEWER_MARKDOWN_COMPONENTS} />
          </div>
        )}
      </div>
    </div>
  )
}
