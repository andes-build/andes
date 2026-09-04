import { parseWaitingRow } from '../../../../shared/command-center-startup-output'

// Every button on the Command Center opens an agent thread with a first
// message that already names what it is about — never a blank terminal
// (spec 009, criterion 6). These three builders cover the three places a
// button appears: a row in "Waiting for your decision", a row in "Checks",
// and the single suggested action line above the cards.

export function buildWaitingResolveMessage(row: string): string {
  const { name, waitingOn } = parseWaitingRow(row)
  const trimmedWaitingOn = waitingOn.trim()
  return trimmedWaitingOn.length > 0
    ? `Help me resolve "${name}" — it's ${trimmedWaitingOn}.`
    : `Help me resolve "${name}".`
}

export function buildCheckFindingMessage(row: string): string {
  return `Help me look at this check finding: ${row}`
}

export function buildSuggestedActionMessage(actionLine: string): string {
  return actionLine
}
