import type { CommandCenterStartupOutput } from '../../../../shared/command-center-startup-output'

/**
 * True when the scan ran fine and found nothing worth showing anywhere — the
 * third uncomfortable state of spec 009's criterion 7 (a freshly prepared
 * folder is the common case).
 *
 * "Checks" is never literally empty: `session-start.sh` always prints one
 * identity/bookkeeping row. That row is not a finding, so it does not make a
 * folder non-empty — the same rule `deriveSuggestedAction` already applies.
 */
export function isCommandCenterScanEmpty(output: CommandCenterStartupOutput): boolean {
  const realCheckRows = output.checks.rows.filter(
    (row) => !/^identity \d+\/\d+/.test(row) && row !== 'no findings'
  )
  return (
    output.waiting.rows.length === 0 &&
    output.inProgress.rows.length === 0 &&
    output.queue.rows.length === 0 &&
    realCheckRows.length === 0
  )
}
