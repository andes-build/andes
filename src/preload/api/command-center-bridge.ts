import { ipcRenderer } from 'electron'
import type {
  CommandCenterRunStartupArgs,
  CommandCenterRunStartupResult
} from '../../shared/command-center-types'
import type { PreloadApi } from '../api-types'

export const commandCenterApi = {
  runStartup: (args: CommandCenterRunStartupArgs): Promise<CommandCenterRunStartupResult> =>
    ipcRenderer.invoke('commandCenter:runStartup', args)
} satisfies PreloadApi['commandCenter']
