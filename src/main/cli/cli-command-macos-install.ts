import { dirname, join, resolve } from 'node:path'
import { readlink } from 'node:fs/promises'
import type { CliInstallStatus } from '../../shared/cli-install-types'
import {
  buildMacPrivilegedSymlinkTransaction,
  capturedExpectedEntry,
  inspectStableCommand,
  readEntrySnapshot,
  type CommandQuarantine,
  type StableCommandInspection
} from './cli-command-filesystem-transaction'
import { LEGACY_MAC_COMMAND_NAME } from './cli-install-constants'

/** Dependencies `removeLegacyMacCommandIfManaged` needs from `CliCommandInstallation`, kept as a
 *  standalone module so that class stays under the file's line ratchet. */
export type LegacyMacCleanupDeps = {
  platform: NodeJS.Platform
  commandPathOverride: string | null
  macCommandPath: string
  launcherPath: string | null
  isManagedSymlinkTarget: (resolvedTarget: string, launcherPath: string, expectedName: string) => boolean
  buildStatus: (args: {
    commandPath: string
    launcherPath: string
    installMethod: 'symlink'
    supported: true
    state: CliInstallStatus['state']
    currentTarget: string | null
    detail: string | null
  }) => CliInstallStatus
  quarantineCommandPath: (commandPath: string) => Promise<CommandQuarantine>
  restoreQuarantinedCommand: (quarantine: CommandQuarantine, commandPath: string) => Promise<void>
  discardQuarantinedCommand: (quarantine: CommandQuarantine) => Promise<void>
}

/** Cleans up a pre-rename `orca` symlink left at the macOS default command path (spec 007), so a
 *  machine that already had it registered does not end up with two commands pointing at the same
 *  app. Only reclaims a symlink into an `.app` bundle's own Resources/bin — never an arbitrary
 *  third-party `orca` a user installed themselves. */
export async function removeLegacyMacCommandIfManaged(deps: LegacyMacCleanupDeps): Promise<void> {
  const { platform, commandPathOverride, macCommandPath, launcherPath } = deps
  if (platform !== 'darwin' || commandPathOverride || !launcherPath) {
    return
  }

  const commandPath = join(dirname(macCommandPath), LEGACY_MAC_COMMAND_NAME)
  if (commandPath === macCommandPath) {
    return
  }
  try {
    const inspected = await inspectStableCommand(commandPath, () =>
      inspectLegacyMacSymlink(commandPath, launcherPath, deps)
    )
    if (!inspected.snapshot || inspected.status.state !== 'stale') {
      return
    }
    const quarantine = await deps.quarantineCommandPath(commandPath)
    if (!(await capturedExpectedEntry(quarantine, inspected))) {
      await deps.restoreQuarantinedCommand(quarantine, commandPath)
      return
    }
    await deps.discardQuarantinedCommand(quarantine)
  } catch (error) {
    // Why: the new command is already registered; leave legacy cleanup for a later attempt.
    console.warn(
      `[cli] Could not remove the legacy command at ${commandPath}:`,
      error instanceof Error ? error.message : String(error)
    )
  }
}

async function inspectLegacyMacSymlink(
  commandPath: string,
  launcherPath: string,
  deps: Pick<LegacyMacCleanupDeps, 'isManagedSymlinkTarget' | 'buildStatus'>
): Promise<CliInstallStatus> {
  const snapshot = await readEntrySnapshot(commandPath)
  if (!snapshot) {
    return buildLegacyMacStatus(commandPath, launcherPath, 'not_installed', null, deps.buildStatus)
  }
  if (!snapshot.isSymbolicLink) {
    return buildLegacyMacStatus(commandPath, launcherPath, 'conflict', null, deps.buildStatus)
  }
  const rawTarget = await readlink(commandPath)
  const resolvedTarget = resolve(dirname(commandPath), rawTarget)
  const managed = deps.isManagedSymlinkTarget(resolvedTarget, launcherPath, LEGACY_MAC_COMMAND_NAME)
  return buildLegacyMacStatus(
    commandPath,
    launcherPath,
    managed ? 'stale' : 'conflict',
    resolvedTarget,
    deps.buildStatus
  )
}

function buildLegacyMacStatus(
  commandPath: string,
  launcherPath: string,
  state: CliInstallStatus['state'],
  currentTarget: string | null,
  buildStatus: LegacyMacCleanupDeps['buildStatus']
): CliInstallStatus {
  return buildStatus({
    commandPath,
    launcherPath,
    installMethod: 'symlink',
    supported: true,
    state,
    currentTarget,
    detail: null
  })
}

export async function installSymlinkWithPrivileges(deps: {
  commandPath: string
  launcherPath: string
  inspected: StableCommandInspection
  privilegedRunner: (command: string) => Promise<void>
  inspectStableSymlink: (commandPath: string, launcherPath: string) => Promise<StableCommandInspection>
}): Promise<void> {
  const { commandPath, launcherPath, inspected } = deps
  await deps.privilegedRunner(
    buildMacPrivilegedSymlinkTransaction({
      action: 'install',
      commandPath,
      launcherPath,
      expected: inspected.snapshot?.identity ?? null,
      expectedFileSha256: inspected.fileSha256,
      expectedRawSymlinkTarget: inspected.rawSymlinkTarget
    })
  )
  const installed = await deps.inspectStableSymlink(commandPath, launcherPath)
  if (installed.status.state !== 'installed') {
    throw new Error(`Could not register the Orca command at ${commandPath}.`)
  }
}

export async function removeSymlinkWithPrivileges(deps: {
  commandPath: string
  inspected: StableCommandInspection
  privilegedRunner: (command: string) => Promise<void>
}): Promise<void> {
  const { commandPath, inspected } = deps
  await deps.privilegedRunner(
    buildMacPrivilegedSymlinkTransaction({
      action: 'remove',
      commandPath,
      expected: inspected.snapshot?.identity ?? null,
      expectedFileSha256: inspected.fileSha256,
      expectedRawSymlinkTarget: inspected.rawSymlinkTarget
    })
  )
}

export type { StableCommandInspection }
