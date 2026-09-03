import type { Repo } from '../../../shared/repo-types'
import type { InterfaceMode } from '../../../shared/interface-mode'

export type SettingsNavigationBuildOptions = {
  isMac: boolean
  isWindows: boolean
  isLocalWindowsHost: boolean
  isWindowsTerminalHost: boolean
  isWebClient: boolean
  managedBrowserCreationEnabled: boolean
  mobileEmulatorCreationEnabled: boolean
  isDev: boolean
  isLinearConnected: boolean
  interfaceMode: InterfaceMode
  repos: readonly Repo[]
}
