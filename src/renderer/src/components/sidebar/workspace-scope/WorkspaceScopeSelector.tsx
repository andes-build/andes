import React, { useEffect } from 'react'
import { ChevronsUpDown, FolderPlus } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import { resolveActiveWorkspaceScope } from '@/store/slices/workspace-scope'
import { useActiveFolderPath } from '@/components/files/use-active-folder-path'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

function initialOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

/** The top-of-sidebar workspace selector (spec 010, criteria 1-2): shows the
 *  one active scope, and opens to the folder's workspaces plus "My work" and
 *  "New workspace". Loads the workspace list once a folder is active. */
export function WorkspaceScopeSelector(): React.JSX.Element {
  const folderPath = useActiveFolderPath()
  const activeWorkspaceScopeSlug = useAppStore((s) => s.activeWorkspaceScopeSlug)
  const workspaceScopeOptions = useAppStore((s) => s.workspaceScopeOptions)
  const setActiveWorkspaceScope = useAppStore((s) => s.setActiveWorkspaceScope)
  const refreshWorkspaceScopeOptions = useAppStore((s) => s.refreshWorkspaceScopeOptions)

  useEffect(() => {
    if (folderPath) {
      void refreshWorkspaceScopeOptions(folderPath)
    }
  }, [folderPath, refreshWorkspaceScopeOptions])

  const scope = resolveActiveWorkspaceScope(activeWorkspaceScopeSlug, workspaceScopeOptions)
  const rootLabel = translate(
    'auto.components.workspaceScope.WorkspaceScopeSelector.rootLabel',
    'My work'
  )
  const activeName = scope.kind === 'root' ? rootLabel : scope.name

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="workspace-scope-selector"
          className="mx-2 mt-2 flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2 py-1.5 text-left hover:bg-sidebar-accent"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-[11px] font-semibold text-sidebar-primary-foreground">
            {initialOf(activeName)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-medium text-sidebar-foreground">
              {activeName}
            </span>
            <span className="truncate text-[11px] text-sidebar-foreground/60">
              {translate(
                'auto.components.workspaceScope.WorkspaceScopeSelector.changeLabel',
                'Workspace · change'
              )}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground/50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>
          {translate(
            'auto.components.workspaceScope.WorkspaceScopeSelector.menuTitle',
            'Switch workspace'
          )}
        </DropdownMenuLabel>
        <DropdownMenuItem
          data-testid="workspace-scope-option-root"
          onSelect={() => setActiveWorkspaceScope(null)}
        >
          {rootLabel}
        </DropdownMenuItem>
        {workspaceScopeOptions.length > 0 ? <DropdownMenuSeparator /> : null}
        {workspaceScopeOptions.map((option) => (
          <DropdownMenuItem
            key={option.slug}
            data-testid={`workspace-scope-option-${option.slug}`}
            onSelect={() => setActiveWorkspaceScope(option.slug)}
          >
            {option.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem data-testid="workspace-scope-option-new" disabled>
          <FolderPlus className="size-3.5" />
          {translate(
            'auto.components.workspaceScope.WorkspaceScopeSelector.newWorkspaceLabel',
            'New workspace'
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
