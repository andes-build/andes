import { ipcMain } from 'electron'
import { listWorkspaceScopes } from '../workspaces/workspace-scope-discovery'
import { readWorkspaceFileTree } from '../workspaces/workspace-file-tree'
import { readWorkspaceFile } from '../workspaces/workspace-file-read'
import { writeWorkspaceFile } from '../workspaces/workspace-file-write'
import type {
  WorkspaceScopeListResult,
  WorkspaceFileTreeResult,
  WorkspaceFileReadResult,
  WorkspaceFileWriteResult
} from '../../shared/workspace-scope-types'

/** IPC surface for the Files screen and the workspace selector (spec 010).
 *  `writeFile` is the only handler that touches the disk (spec 024): it saves
 *  an already existing document inside the active scope, and never anything
 *  else. */
export function registerWorkspaceScopeHandlers(): void {
  ipcMain.removeHandler('workspaceScope:list')
  ipcMain.removeHandler('workspaceScope:fileTree')
  ipcMain.removeHandler('workspaceScope:readFile')
  ipcMain.removeHandler('workspaceScope:writeFile')

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
      return readWorkspaceFile(args.rootPath, args.filePath)
    }
  )

  ipcMain.handle(
    'workspaceScope:writeFile',
    (
      _event,
      args: {
        rootPath: string
        filePath: string
        content: string
        expectedModifiedAtMs: number | null
      }
    ): WorkspaceFileWriteResult => {
      return writeWorkspaceFile(
        args.rootPath,
        args.filePath,
        args.content,
        args.expectedModifiedAtMs
      )
    }
  )
}
