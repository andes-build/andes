import { translate } from '@/i18n/i18n'
import {
  isToolCallBlock,
  isToolResultBlock,
  type NativeChatBlock
} from '../../../../shared/native-chat-types'
import { toolFilePath } from '../../../../shared/native-chat-tool-summary'

/**
 * Spec 013, criterion 7: simple mode's activity line, in person language —
 * never a tool name, a command, or a path. Every branch below returns a
 * fixed, translated phrase; the only thing pulled from the tool call is a
 * humanized noun built from a file's *basename* (never the path itself, and
 * never the raw command or search pattern, which could themselves contain a
 * path). A tool this redactor doesn't recognize falls back to "Working…" —
 * over-filtering on purpose (see `decisions.md`).
 */

function normalizedToolName(name: string): string {
  return name.trim().toLowerCase()
}

const READ_TOOL_NAMES = new Set(['read', 'view', 'cat', 'notebookread'])
const WRITE_TOOL_NAMES = new Set(['write', 'edit', 'notebookedit', 'create', 'apply_patch'])
const SEARCH_TOOL_NAMES = new Set(['grep', 'search', 'glob', 'codesearch'])
const DELEGATE_TOOL_NAMES = new Set(['task', 'agent', 'subagent'])
const COMMAND_TOOL_NAMES = new Set([
  'bash',
  'shell',
  'powershell',
  'terminal',
  'execute',
  'run_command',
  'run_shell_command',
  'shell_command',
  'exec_command',
  'run_terminal_cmd',
  'run_terminal_command'
])

/** A humanized noun from a file's last path segment only — the path itself
 *  never reaches the phrase. "payment-provider-decision.md" → "payment
 *  provider decision". Returns null when nothing usable survives. */
function humanizeFileSubject(path: string): string | null {
  const base = path
    .replace(/[\\/]+$/, '')
    .split(/[\\/]/)
    .pop()
  if (!base) {
    return null
  }
  const withoutExtension = base.replace(/\.[a-zA-Z0-9]+$/, '')
  const spaced = withoutExtension
    .replace(/[-_.]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
  return spaced ? spaced.toLowerCase() : null
}

function describeToolCallActivity(name: string, input: unknown): string {
  const normalizedName = normalizedToolName(name)
  const subject =
    READ_TOOL_NAMES.has(normalizedName) || WRITE_TOOL_NAMES.has(normalizedName)
      ? (() => {
          const path = toolFilePath(input)
          return path ? humanizeFileSubject(path) : null
        })()
      : null

  if (READ_TOOL_NAMES.has(normalizedName)) {
    return subject
      ? translate('components.native-chat.activity.readingSubject', 'Reading the {{value0}}', {
          value0: subject
        })
      : translate('components.native-chat.activity.reading', 'Reading a file')
  }
  if (WRITE_TOOL_NAMES.has(normalizedName)) {
    return subject
      ? translate('components.native-chat.activity.writingSubject', 'Writing the {{value0}}', {
          value0: subject
        })
      : translate('components.native-chat.activity.writing', 'Writing a file')
  }
  if (SEARCH_TOOL_NAMES.has(normalizedName)) {
    return translate('components.native-chat.activity.searching', 'Searching the files')
  }
  if (COMMAND_TOOL_NAMES.has(normalizedName)) {
    return translate('components.native-chat.activity.runningCommand', 'Running a command')
  }
  if (DELEGATE_TOOL_NAMES.has(normalizedName)) {
    return translate('components.native-chat.activity.delegating', 'Delegating a task')
  }
  return translate('components.native-chat.status.working', 'Working…')
}

/** The one line simple mode shows for a run's current (or last) block. */
export function describeToolActivity(block: NativeChatBlock): string {
  if (isToolCallBlock(block)) {
    return describeToolCallActivity(block.name, block.input)
  }
  if (isToolResultBlock(block)) {
    return block.isError
      ? translate('components.native-chat.activity.hitAProblem', 'Ran into a problem')
      : translate('components.native-chat.status.working', 'Working…')
  }
  return translate('components.native-chat.status.working', 'Working…')
}

/** What a permission asks for, in the same person language as the activity line.
 *
 *  Spec 012, criterion 4: the card used to show the provider's own `title` and `description`,
 *  which is where the raw command leaked onto the screen ("Allow Bash?" over
 *  `.os/core/lib/session-start.sh --brain . --root`). This is the same redactor as the activity
 *  line — same tool-name sets, same `humanizeFileSubject`, same over-filtering — read in the
 *  request voice. A tool it does not recognize returns the generic question: showing less is the
 *  rule, leaking the command is not an option.
 */
export function describePermissionRequest(tool: { name: string; input: unknown }): string {
  const normalizedName = normalizedToolName(tool.name)
  const subject =
    READ_TOOL_NAMES.has(normalizedName) || WRITE_TOOL_NAMES.has(normalizedName)
      ? (() => {
          const path = toolFilePath(tool.input)
          return path ? humanizeFileSubject(path) : null
        })()
      : null

  if (READ_TOOL_NAMES.has(normalizedName)) {
    return subject
      ? translate('components.native-chat.permission.readSubject', 'Read the {{value0}}?', {
          value0: subject
        })
      : translate('components.native-chat.permission.read', 'Read a file?')
  }
  if (WRITE_TOOL_NAMES.has(normalizedName)) {
    return subject
      ? translate('components.native-chat.permission.writeSubject', 'Write the {{value0}}?', {
          value0: subject
        })
      : translate('components.native-chat.permission.write', 'Write a file?')
  }
  if (SEARCH_TOOL_NAMES.has(normalizedName)) {
    return translate('components.native-chat.permission.search', 'Search the files?')
  }
  if (COMMAND_TOOL_NAMES.has(normalizedName)) {
    return translate('components.native-chat.permission.runCommand', 'Run a command?')
  }
  if (DELEGATE_TOOL_NAMES.has(normalizedName)) {
    return translate('components.native-chat.permission.delegate', 'Delegate a task?')
  }
  return translate('components.native-chat.permission.generic', 'Allow this action?')
}
