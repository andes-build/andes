/** A workspace of the open folder, discovered under `workspaces/` (spec 010).
 *  "Folder" here is the folder-workspace the person opened in Andes — the
 *  brain in AI First OS terms, a word this file never uses because it names
 *  no system internals (spec 005 vocabulary rule). */
export type WorkspaceScopeSummary = {
  /** Directory name under `workspaces/` — stable identity for the scope. */
  slug: string
  /** Display name: the first heading of the workspace's head file, or the
   *  slug humanized when no head file is readable. */
  name: string
  /** Absolute path to the workspace's directory. */
  path: string
}

export type WorkspaceScopeListResult = {
  workspaces: WorkspaceScopeSummary[]
}

export type WorkspaceFileTreeNode = {
  name: string
  path: string
  relativePath: string
  isDirectory: boolean
  children?: WorkspaceFileTreeNode[]
}

export type WorkspaceFileTreeResult = {
  root: WorkspaceFileTreeNode[]
}

export type WorkspaceFileReadResult = {
  content: string
}

/** The scope a thread launched with (spec 019): captured once, at launch
 *  time, from the sidebar selector. A thread keeps this value for its whole
 *  life — changing the selector later only changes what the *next* thread
 *  inherits, never an already-open one (see `decisions.md`, spec 019). */
export type ThreadScope = { kind: 'root' } | { kind: 'workspace'; slug: string; name: string }
