// The wire Andes speaks to the person's own `claude` binary when the thread runs on data instead
// of on a terminal.
//
// Claude Code exposes the same control channel its SDK uses: `--input-format stream-json` in,
// `--output-format stream-json` out, and `--permission-prompt-tool stdio`, which is what turns a
// permission from a drawn prompt into a `control_request` frame addressed to the host. Without
// that flag the CLI answers its own prompts and emits `system/permission_denied` instead — proven
// on 2026-09-04, `docs/research/2026-09-04-permiso-de-claude-como-dato/`.
//
// Only the binary's arguments change here. Nothing packages, patches, wraps or replaces it, and
// the sign-in layer is untouched.

import type { AgentJournalApprovalItem } from '../../shared/agent-session-journal-types'

/** Arguments that open the data channel. The model, the permission mode and the working directory
 *  are appended by the launch resolver; these are the ones the protocol itself requires. */
export const CLAUDE_STRUCTURED_LAUNCH_ARGS: readonly string[] = [
  '--output-format',
  'stream-json',
  '--verbose',
  '--input-format',
  'stream-json',
  '--permission-prompt-tool',
  'stdio'
]

/** Option ids the approval card answers with. They are the wire's own vocabulary, not the PTY
 *  keystrokes the imitation card used to send. */
export const CLAUDE_APPROVAL_ALLOW_OPTION_ID = 'allow'
export const CLAUDE_APPROVAL_DENY_OPTION_ID = 'deny'

export type ClaudeStructuredPermissionRequest = {
  requestId: string
  toolUseId: string
  toolName: string
  input: Record<string, unknown>
  /** Header for the card. The CLI's own `title`, else the tool's display name, else its name. */
  title: string
  /** Second line of the card. The CLI's own `description`; null when it sent none. */
  detail: string | null
  /** Set when the CLI says a one-tap answer is not enough for this ask. */
  requiresUserInteraction: boolean
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

/**
 * Reads a `can_use_tool` control request out of one output frame, or null for every other frame.
 * Every field the card renders comes from here; nothing reads the terminal transcript.
 */
export function readClaudeStructuredPermissionRequest(
  frame: unknown
): ClaudeStructuredPermissionRequest | null {
  const envelope = asRecord(frame)
  if (!envelope || envelope.type !== 'control_request') {
    return null
  }
  const requestId = asString(envelope.request_id)
  const request = asRecord(envelope.request)
  if (!requestId || !request || request.subtype !== 'can_use_tool') {
    return null
  }
  const toolName = asString(request.tool_name)
  const toolUseId = asString(request.tool_use_id)
  if (!toolName || !toolUseId) {
    return null
  }
  return {
    requestId,
    toolUseId,
    toolName,
    input: asRecord(request.input) ?? {},
    title: asString(request.title) ?? asString(request.display_name) ?? toolName,
    detail: asString(request.description),
    requiresUserInteraction: request.requires_user_interaction === true
  }
}

/**
 * The approval item the conversation draws. Title and detail are the request's own fields: a card
 * built from this never has to look at what the agent printed.
 */
export function claudeStructuredApprovalItem(
  request: ClaudeStructuredPermissionRequest
): AgentJournalApprovalItem {
  return {
    kind: 'approval',
    title: request.title,
    detail: request.detail,
    options: [
      { id: CLAUDE_APPROVAL_ALLOW_OPTION_ID, label: 'Allow' },
      { id: CLAUDE_APPROVAL_DENY_OPTION_ID, label: 'Deny' }
    ],
    resolution: { state: 'pending', selectedOptionId: null, resolvedBy: null, resolvedAt: null }
  }
}

/** The handshake that tells the CLI a host is listening on the control channel. */
export function buildClaudeStructuredInitializeRequest(requestId: string): Record<string, unknown> {
  return { type: 'control_request', request_id: requestId, request: { subtype: 'initialize' } }
}

/**
 * The answer that goes back down the same channel. `allow` returns the input unchanged: Andes
 * never edits what the agent asked to run behind the person's back.
 */
export function buildClaudeStructuredPermissionResponse(input: {
  requestId: string
  input: Record<string, unknown>
  decision: 'allow' | 'deny'
  denyMessage?: string
}): Record<string, unknown> {
  const response =
    input.decision === 'allow'
      ? { behavior: 'allow', updatedInput: input.input }
      : { behavior: 'deny', message: input.denyMessage ?? 'Denied' }
  return {
    type: 'control_response',
    response: { subtype: 'success', request_id: input.requestId, response }
  }
}

/** Maps the option the person picked on the card back to the wire's two behaviours. */
export function claudeStructuredDecisionForOption(optionId: string): 'allow' | 'deny' {
  return optionId === CLAUDE_APPROVAL_ALLOW_OPTION_ID ? 'allow' : 'deny'
}

/** The frame that carries one turn of the person's text to the agent. */
export function buildClaudeStructuredUserMessage(text: string): Record<string, unknown> {
  return { type: 'user', message: { role: 'user', content: text } }
}

/**
 * The `request_id` a `control_response` answers, or null for any other frame. Acquisition uses it
 * to tell the answer to its own `initialize` from every other control traffic on the channel.
 */
export function readClaudeStructuredControlResponseRequestId(frame: unknown): string | null {
  const record = asRecord(frame)
  if (record?.type !== 'control_response') {
    return null
  }
  const response = asRecord(record.response)
  return response ? asString(response.request_id) : null
}
