import type { StateCreator } from 'zustand'
import type { AppState } from '../types'
import type { WorkspaceScopeSummary } from '../../../../shared/workspace-scope-types'

/** The scope Andes shows in simple mode (spec 010): one workspace of the
 *  opened folder, or the folder's root ("My work"). Every simple-mode
 *  surface — the selector, Files, and eventually Command Center and Recent
 *  threads — reads this instead of keeping its own notion of scope. */
export type WorkspaceScope =
  | { kind: 'root' }
  | { kind: 'workspace'; slug: string; name: string; path: string }

export type WorkspaceScopeSlice = {
  /** The folder's workspaces, as last read from disk. Empty until refreshed. */
  workspaceScopeOptions: WorkspaceScopeSummary[]
  workspaceScopeOptionsLoaded: boolean
  /** `null` selects the root scope ("My work"). */
  activeWorkspaceScopeSlug: string | null
  setActiveWorkspaceScope: (slug: string | null) => void
  refreshWorkspaceScopeOptions: (folderPath: string) => Promise<void>
}

export const createWorkspaceScopeSlice: StateCreator<AppState, [], [], WorkspaceScopeSlice> = (
  set
) => ({
  workspaceScopeOptions: [],
  workspaceScopeOptionsLoaded: false,
  activeWorkspaceScopeSlug: null,
  setActiveWorkspaceScope: (slug) => set({ activeWorkspaceScopeSlug: slug }),
  refreshWorkspaceScopeOptions: async (folderPath) => {
    const { workspaces } = await window.api.workspaceScope.list({ folderPath })
    set({ workspaceScopeOptions: workspaces, workspaceScopeOptionsLoaded: true })
  }
})

/** Resolves the active scope object from slug + the loaded options list —
 *  a slug whose workspace disappeared from disk falls back to root rather
 *  than pointing at nothing (spec 010, criterion 3). */
export function resolveActiveWorkspaceScope(
  activeWorkspaceScopeSlug: string | null,
  workspaceScopeOptions: WorkspaceScopeSummary[]
): WorkspaceScope {
  if (activeWorkspaceScopeSlug === null) {
    return { kind: 'root' }
  }
  const match = workspaceScopeOptions.find((option) => option.slug === activeWorkspaceScopeSlug)
  if (!match) {
    return { kind: 'root' }
  }
  return { kind: 'workspace', slug: match.slug, name: match.name, path: match.path }
}
