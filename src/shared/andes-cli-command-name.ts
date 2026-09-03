export function getAndesCliCommandNameForPlatform(platform: NodeJS.Platform): string {
  if (platform === 'linux') {
    // Why: packaged Linux keeps `orca-ide` — GNOME ships /usr/bin/orca, unrelated to this rename.
    return 'orca-ide'
  }
  if (platform === 'win32') {
    // Why not 'andes.cmd': the packaged Windows native launcher is out of scope for spec 007.
    return 'orca.cmd'
  }
  return 'andes'
}
