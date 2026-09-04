import type {
  CommandCenterRunStartupArgs,
  CommandCenterRunStartupResult
} from '../../shared/command-center-types'

export type CommandCenterApi = {
  runStartup: (args: CommandCenterRunStartupArgs) => Promise<CommandCenterRunStartupResult>
}
