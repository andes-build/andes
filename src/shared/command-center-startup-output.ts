// The Command Center (spec 009) shows the core's own startup scan verbatim —
// four fixed sections, never recalculated or summarized (decisions.md,
// 2026-08-29). This module only *splits* the raw stdout of
// `vendor/ai-first-os-core/core/lib/session-start.sh` into those sections; it
// never re-derives their content from source files.
//
// The core always runs in English for a brain Andes prepared (onboarding never
// writes `language:` into `operator.md`, and the core defaults to English —
// spec 008's single-language decision holds transitively). The section titles
// and empty-state text below are the literal English strings from
// `vendor/ai-first-os-core/core/templates/strings.md` — matching on them is
// this parser's whole strategy, not a partial re-implementation of the script.

export type CommandCenterSection = {
  /** Rows as printed by the core, trimmed, with the empty-state line and the
   *  "and N more" line removed — those become `isEmpty` / `omittedCount`. */
  rows: string[]
  isEmpty: boolean
  /** How many rows the core's own per-section cap left out of `rows`. */
  omittedCount: number
}

export type CommandCenterStartupOutput = {
  waiting: CommandCenterSection
  inProgress: CommandCenterSection
  queue: CommandCenterSection
  checks: CommandCenterSection
  /** Trailing meta lines (an optional `active-role: ...` line, then the node
   *  count/time/version line) — shown small and gray at the foot, never as a
   *  card (spec 009 decision: "al pie, en gris y chico, o no mostrarlo"). */
  footerLines: string[]
}

export type CommandCenterStartupParseError = {
  reason: 'missing-sections'
  raw: string
}

const SECTION_TITLES = {
  waiting: 'Waiting for your decision',
  inProgress: 'In progress',
  queue: 'Queued',
  checks: 'Checks'
} as const

type SectionKey = keyof typeof SECTION_TITLES

const SECTION_ORDER: SectionKey[] = ['waiting', 'inProgress', 'queue', 'checks']

const EMPTY_TEXT: Partial<Record<SectionKey, string>> = {
  waiting: 'nothing is waiting on you',
  inProgress: 'nothing in progress',
  checks: 'no findings'
}

const MORE_RE = /^and (\d+) more$/
const NODE_COUNT_RE = /^\d+ nodes · /
const ACTIVE_ROLE_RE = /^active-role: /

function buildSection(rawRows: string[], emptyText?: string): CommandCenterSection {
  const trimmed = rawRows.map((row) => row.trim()).filter((row) => row.length > 0)
  if (emptyText && trimmed.length === 1 && trimmed[0] === emptyText) {
    return { rows: [], isEmpty: true, omittedCount: 0 }
  }
  const last = trimmed.at(-1)
  const moreMatch = last ? MORE_RE.exec(last) : null
  const rows = moreMatch ? trimmed.slice(0, -1) : trimmed
  return { rows, isEmpty: rows.length === 0, omittedCount: moreMatch ? Number(moreMatch[1]) : 0 }
}

/**
 * Parses the raw stdout of `session-start.sh` into its four fixed sections
 * plus the trailing footer meta. Returns a `missing-sections` error — never a
 * guess — when any of the four titles is absent or out of order: decisions.md
 * (2026-08-29) and the spec's stop condition both say to report the raw
 * output rather than invent a section.
 */
export function parseCommandCenterStartupOutput(
  raw: string
): CommandCenterStartupOutput | CommandCenterStartupParseError {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const titleIndex: Record<SectionKey, number> = {
    waiting: -1,
    inProgress: -1,
    queue: -1,
    checks: -1
  }
  lines.forEach((line, index) => {
    for (const key of SECTION_ORDER) {
      if (titleIndex[key] === -1 && line === SECTION_TITLES[key]) {
        titleIndex[key] = index
      }
    }
  })
  if (SECTION_ORDER.some((key) => titleIndex[key] === -1)) {
    return { reason: 'missing-sections', raw }
  }
  for (let i = 1; i < SECTION_ORDER.length; i++) {
    if (titleIndex[SECTION_ORDER[i]] <= titleIndex[SECTION_ORDER[i - 1]]) {
      return { reason: 'missing-sections', raw }
    }
  }

  const waitingRows = lines.slice(titleIndex.waiting + 1, titleIndex.inProgress)
  const inProgressRows = lines.slice(titleIndex.inProgress + 1, titleIndex.queue)
  const queueRows = lines.slice(titleIndex.queue + 1, titleIndex.checks)
  const tail = lines.slice(titleIndex.checks + 1)

  // The footer (an optional `active-role:` line, then the node-count line) has
  // no reliable blank-line separator from Checks — session-start.sh emits it
  // right after the checks rows. Peel it off from the end instead.
  const footerLines: string[] = []
  let checksEnd = tail.length
  for (let i = tail.length - 1; i >= 0; i--) {
    const trimmedLine = tail[i].trim()
    if (trimmedLine.length === 0) {
      continue
    }
    if (NODE_COUNT_RE.test(trimmedLine) || ACTIVE_ROLE_RE.test(trimmedLine)) {
      footerLines.unshift(trimmedLine)
      checksEnd = i
      continue
    }
    break
  }
  const checksRows = tail.slice(0, checksEnd)

  return {
    waiting: buildSection(waitingRows, EMPTY_TEXT.waiting),
    inProgress: buildSection(inProgressRows, EMPTY_TEXT.inProgress),
    queue: buildSection(queueRows),
    checks: buildSection(checksRows, EMPTY_TEXT.checks),
    footerLines
  }
}

export function isCommandCenterStartupParseError(
  value: CommandCenterStartupOutput | CommandCenterStartupParseError
): value is CommandCenterStartupParseError {
  return 'reason' in value
}

/** Splits a "Waiting for your decision" row ("name — waiting on you") into its
 *  initiative name and what it is waiting on. Falls back to the whole row as
 *  the name when the separator is absent — malformed input never throws. */
export function parseWaitingRow(row: string): { name: string; waitingOn: string } {
  const separatorIndex = row.indexOf(' — ')
  if (separatorIndex === -1) {
    return { name: row, waitingOn: '' }
  }
  return {
    name: row.slice(0, separatorIndex).trim(),
    waitingOn: row.slice(separatorIndex + 3).trim()
  }
}
