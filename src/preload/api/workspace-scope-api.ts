import type {
  WorkspaceScopeListResult,
  WorkspaceFileTreeResult,
  WorkspaceFileReadResult
} from '../../shared/workspace-scope-types'

export type WorkspaceScopeApi = {
  list: (args: { folderPath: string }) => Promise<WorkspaceScopeListResult>
  fileTree: (args: { rootPath: string }) => Promise<WorkspaceFileTreeResult>
  readFile: (args: { rootPath: string; filePath: string }) => Promise<WorkspaceFileReadResult>
}
