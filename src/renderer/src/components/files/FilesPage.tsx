import React, { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import { SimpleModeScopeEmptyState } from '@/components/sidebar/workspace-scope/SimpleModeScopeEmptyState'
import { resolveActiveWorkspaceScope } from '@/store/slices/workspace-scope'
import type { WorkspaceFileTreeNode } from '../../../../shared/workspace-scope-types'
import { useActiveFolderPath } from './use-active-folder-path'
import { useWorkspaceFileTree } from './use-workspace-file-tree'
import { WorkspaceFileTreePane } from './WorkspaceFileTreePane'
import { WorkspaceFileViewer } from './WorkspaceFileViewer'

function findFirstFile(nodes: WorkspaceFileTreeNode[]): WorkspaceFileTreeNode | null {
  for (const node of nodes) {
    if (!node.isDirectory) {
      return node
    }
    if (node.children) {
      const found = findFirstFile(node.children)
      if (found) {
        return found
      }
    }
  }
  return null
}

/** The Files screen (spec 010, criterion 7): shows the tree of the active
 *  workspace scope only — never the whole opened folder — with node names
 *  translated and a formatted viewer for the selected file. */
export function FilesPage(): React.JSX.Element {
  const folderPath = useActiveFolderPath()
  const activeWorkspaceScopeSlug = useAppStore((s) => s.activeWorkspaceScopeSlug)
  const workspaceScopeOptions = useAppStore((s) => s.workspaceScopeOptions)
  const scope = useMemo(
    () => resolveActiveWorkspaceScope(activeWorkspaceScopeSlug, workspaceScopeOptions),
    [activeWorkspaceScopeSlug, workspaceScopeOptions]
  )
  const rootPath = scope.kind === 'workspace' ? scope.path : folderPath
  const treeState = useWorkspaceFileTree(rootPath)
  const [selectedFile, setSelectedFile] = useState<WorkspaceFileTreeNode | null>(null)

  useEffect(() => {
    setSelectedFile(null)
  }, [rootPath])

  useEffect(() => {
    if (treeState.status === 'loaded' && !selectedFile) {
      setSelectedFile(findFirstFile(treeState.root))
    }
  }, [treeState, selectedFile])

  const subtitle =
    scope.kind === 'workspace'
      ? translate(
          'auto.components.files.FilesPage.subtitleForWorkspace',
          'What lives in {{workspace}}',
          {
            workspace: scope.name
          }
        )
      : translate('auto.components.files.FilesPage.subtitleForRoot', 'What lives in My work')

  if (!rootPath) {
    return <SimpleModeScopeEmptyState kind="folder-not-ready" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h1 className="font-serif text-xl text-foreground">
          {translate('auto.components.files.FilesPage.title', 'Files')}
        </h1>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex min-h-0 flex-1">
        {treeState.status === 'loaded' && treeState.root.length === 0 ? (
          <SimpleModeScopeEmptyState kind="empty-workspace" />
        ) : (
          <>
            <div className="w-64 shrink-0 overflow-auto border-r border-border scrollbar-sleek">
              {treeState.status === 'loaded' ? (
                <WorkspaceFileTreePane
                  root={treeState.root}
                  selectedPath={selectedFile?.path ?? null}
                  onSelectFile={setSelectedFile}
                />
              ) : null}
            </div>
            <WorkspaceFileViewer
              rootPath={rootPath}
              filePath={selectedFile?.path ?? null}
              fileName={selectedFile?.name ?? null}
              onOpenThread={() => {
                useAppStore.getState().setActiveView('terminal')
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

// Exported for tests that want to assert the "first readable file" heuristic
// without duplicating tree traversal.
export { findFirstFile }

export default FilesPage
