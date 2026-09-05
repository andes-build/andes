import { ipcRenderer } from 'electron'
import type {
  WorkspaceScopeListResult,
  WorkspaceFileTreeResult,
  WorkspaceFileReadResult,
  WorkspaceFileWriteResult
} from '../../shared/workspace-scope-types'
import type { PreloadApi } from '../api-types'

export const workspaceScopeApi = {
  list: (args: { folderPath: string }): Promise<WorkspaceScopeListResult> =>
    ipcRenderer.invoke('workspaceScope:list', args),
  fileTree: (args: { rootPath: string }): Promise<WorkspaceFileTreeResult> =>
    ipcRenderer.invoke('workspaceScope:fileTree', args),
  readFile: (args: { rootPath: string; filePath: string }): Promise<WorkspaceFileReadResult> =>
    ipcRenderer.invoke('workspaceScope:readFile', args),
  writeFile: (args: {
    rootPath: string
    filePath: string
    content: string
    expectedModifiedAtMs: number | null
  }): Promise<WorkspaceFileWriteResult> => ipcRenderer.invoke('workspaceScope:writeFile', args)
} satisfies PreloadApi['workspaceScope']
