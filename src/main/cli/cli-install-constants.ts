export const DEFAULT_MAC_COMMAND_PATH = '/usr/local/bin/andes'
export const DEV_COMMAND_NAME = 'andes-dev'
// Why the legacy value below: cleans up installs from before the rename to `andes` (spec 007).
// Only ever used to find and remove a previous symlink, never to install a new one.
export const LEGACY_LINUX_COMMAND_NAME = 'orca'
// Why the legacy value below: same cleanup, for the macOS default command path. Only ever used to
// find and remove a previous symlink, never to install a new one.
export const LEGACY_MAC_COMMAND_NAME = 'orca'
export const DEV_LAUNCHER_DIR = ['cli', 'bin'] as const
export const WINDOWS_PATH_WRITE_TIMEOUT_MS = 5_000
