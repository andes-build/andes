import type {
  WorkspaceScopeListResult,
  WorkspaceFileTreeResult,
  WorkspaceFileReadResult,
  WorkspaceFileWriteResult
} from '../../shared/workspace-scope-types'

export type WorkspaceScopeApi = {
  list: (args: { folderPath: string }) => Promise<WorkspaceScopeListResult>
  fileTree: (args: { rootPath: string }) => Promise<WorkspaceFileTreeResult>
  readFile: (args: { rootPath: string; filePath: string }) => Promise<WorkspaceFileReadResult>
  writeFile: (args: {
    rootPath: string
    filePath: string
    content: string
    expectedModifiedAtMs: number | null
  }) => Promise<WorkspaceFileWriteResult>
}
