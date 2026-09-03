import { ipcMain } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveVendoredCorePath } from '../onboarding/brain-preparation'
import { runCommandCenterStartup } from '../command-center/run-command-center-startup'
import { resolveCommandCenterScope } from '../command-center/resolve-command-center-scope'
import type {
  CommandCenterRunStartupArgs,
  CommandCenterRunStartupResult
} from '../../shared/command-center-types'

export function registerCommandCenterHandlers(): void {
  ipcMain.removeHandler('commandCenter:runStartup')

  ipcMain.handle(
    'commandCenter:runStartup',
    async (_event, args: CommandCenterRunStartupArgs): Promise<CommandCenterRunStartupResult> => {
      // Why: `.os/core` is the same marker `brain-preparation.ts` checks for
      // "already prepared" — a folder missing it can't run the core's own
      // scan, so this is checked here rather than left to surface as a
      // confusing script error (spec 009, criterion 7).
      if (!existsSync(join(args.brainPath, '.os', 'core'))) {
        return { kind: 'not-prepared' }
      }
      const scope = resolveCommandCenterScope(args.brainPath)
      return runCommandCenterStartup(args.brainPath, resolveVendoredCorePath(), scope)
    }
  )
}
