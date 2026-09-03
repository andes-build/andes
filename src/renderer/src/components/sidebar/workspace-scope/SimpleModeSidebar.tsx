import React from 'react'
import { useAppStore } from '@/store'
import { WorkspaceScopeSelector } from './WorkspaceScopeSelector'
import { SimpleModeNav } from './SimpleModeNav'
import { RecentThreadsSection } from './RecentThreadsSection'
import { SimpleModeScopeEmptyState } from './SimpleModeScopeEmptyState'

/** The whole simple-mode sidebar body (spec 010, criteria 1, 4, 5, 6):
 *  workspace selector on top, simple nav, and Recent threads for the active
 *  scope. Never renders projects/repos/worktrees or their git actions. */
export function SimpleModeSidebar(): React.JSX.Element {
  const workspaceScopeOptions = useAppStore((s) => s.workspaceScopeOptions)
  const workspaceScopeOptionsLoaded = useAppStore((s) => s.workspaceScopeOptionsLoaded)
  const noWorkspacesYet = workspaceScopeOptionsLoaded && workspaceScopeOptions.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="simple-mode-sidebar">
      <WorkspaceScopeSelector />
      <SimpleModeNav />
      {noWorkspacesYet ? (
        <SimpleModeScopeEmptyState kind="no-workspaces" />
      ) : (
        <RecentThreadsSection threads={[]} onSelectThread={() => {}} onViewHistory={() => {}} />
      )}
    </div>
  )
}
