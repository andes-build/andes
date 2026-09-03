import { ipcMain } from 'electron'
import { listWorkspaceScopes } from '../workspaces/workspace-scope-discovery'
import { readWorkspaceFileTree } from '../workspaces/workspace-file-tree'
import { readWorkspaceFile } from '../workspaces/workspace-file-read'
import type {
  WorkspaceScopeListResult,
  WorkspaceFileTreeResult,
  WorkspaceFileReadResult
} from '../../shared/workspace-scope-types'

/** IPC surface for the Files screen and the workspace selector (spec 010).
 *  Read-only: nothing here writes to the opened folder. */
export function registerWorkspaceScopeHandlers(): void {
  ipcMain.removeHandler('workspaceScope:list')
  ipcMain.removeHandler('workspaceScope:fileTree')
  ipcMain.removeHandler('workspaceScope:readFile')

  ipcMain.handle(
    'workspaceScope:list',
    (_event, args: { folderPath: string }): WorkspaceScopeListResult => {
      return { workspaces: listWorkspaceScopes(args.folderPath) }
    }
  )

  ipcMain.handle(
    'workspaceScope:fileTree',
    (_event, args: { rootPath: string }): WorkspaceFileTreeResult => {
      return { root: readWorkspaceFileTree(args.rootPath) }
    }
  )

  ipcMain.handle(
    'workspaceScope:readFile',
    (_event, args: { rootPath: string; filePath: string }): WorkspaceFileReadResult => {
      return { content: readWorkspaceFile(args.rootPath, args.filePath) }
    }
  )
}
