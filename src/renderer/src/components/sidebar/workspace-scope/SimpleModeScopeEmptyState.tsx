import React from 'react'
import { FolderOpen, FolderTree, Inbox } from 'lucide-react'
import { translate } from '@/i18n/i18n'

export type SimpleModeScopeEmptyStateKind = 'no-workspaces' | 'empty-workspace' | 'folder-not-ready'

const ICON_BY_KIND: Record<
  SimpleModeScopeEmptyStateKind,
  React.ComponentType<{ className?: string }>
> = {
  'no-workspaces': FolderTree,
  'empty-workspace': Inbox,
  'folder-not-ready': FolderOpen
}

function copyFor(kind: SimpleModeScopeEmptyStateKind): { title: string; description: string } {
  switch (kind) {
    case 'no-workspaces':
      return {
        title: translate(
          'auto.components.workspaceScope.SimpleModeSidebarEmptyStates.noWorkspacesTitle',
          'No workspaces yet'
        ),
        description: translate(
          'auto.components.workspaceScope.SimpleModeSidebarEmptyStates.noWorkspacesDescription',
          "This folder doesn't have a workspaces folder yet. Create one to start organizing your work."
        )
      }
    case 'empty-workspace':
      return {
        title: translate(
          'auto.components.workspaceScope.SimpleModeSidebarEmptyStates.emptyWorkspaceTitle',
          'This workspace is empty'
        ),
        description: translate(
          'auto.components.workspaceScope.SimpleModeSidebarEmptyStates.emptyWorkspaceDescription',
          'Nothing has been written here yet.'
        )
      }
    case 'folder-not-ready':
      return {
        title: translate(
          'auto.components.workspaceScope.SimpleModeSidebarEmptyStates.folderNotReadyTitle',
          "This folder isn't set up yet"
        ),
        description: translate(
          'auto.components.workspaceScope.SimpleModeSidebarEmptyStates.folderNotReadyDescription',
          'Finish onboarding to prepare this folder before opening a workspace.'
        )
      }
  }
}

/** The three uncomfortable states of the simple-mode scope (spec 010,
 *  criterion 10): a folder with no workspaces, a workspace with no files,
 *  and a folder that was never activated/prepared. */
export function SimpleModeScopeEmptyState({
  kind
}: {
  kind: SimpleModeScopeEmptyStateKind
}): React.JSX.Element {
  const Icon = ICON_BY_KIND[kind]
  const { title, description } = copyFor(kind)
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
      data-testid={`simple-mode-scope-empty-state-${kind}`}
    >
      <Icon className="size-6 text-muted-foreground" />
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="max-w-xs text-xs text-muted-foreground">{description}</div>
    </div>
  )
}
