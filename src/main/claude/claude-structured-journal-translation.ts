// Turns Claude's output frames into journal items.
//
// The journal is what the conversation draws, so this is the only place that decides what a frame
// looks like on screen. What this file has no shape for is written as a bounded provider frame with
// its kind named — never invented and never quietly dropped. Spec 012 criterion 7 lists what stays
// declared rather than simulated.

import { agentJournalItemKey } from '../../shared/agent-session-journal-item-key'
import type {
  AgentJournalItemBody,
  AgentJournalItemIdentity
} from '../../shared/agent-session-journal-types'
import type { NativeChatBlock } from '../../shared/native-chat-types'
import type { StructuredAgentSessionEventSink } from '../native-chat/agent-session-wire/structured-agent-session-event-sink'
import {
  claudeStructuredApprovalItem,
  readClaudeStructuredPermissionRequest,
  type ClaudeStructuredPermissionRequest
} from './claude-structured-stream-protocol'

/** Head kept for a frame this host has no item shape for. Bounded so one frame cannot grow a row
 *  without limit. */
const PROVIDER_FRAME_HEAD_BYTES = 2048

export type ClaudeJournalTranslatorDeps = {
  sink: StructuredAgentSessionEventSink
  /** Claude's own session id, once `system/init` announced it. */
  sessionId: () => string | null
  /** Remembers which journal item a pending permission belongs to, so the answer finds it. */
  bindPermission: (itemId: string, request: ClaudeStructuredPermissionRequest) => void
  digest?: (payload: string) => string
}

export type ClaudeJournalTranslator = {
  handle(frame: Record<string, unknown>): void
  /** Marks one approval item answered. The wire calls it only after the durable compare-and-set. */
  resolvePermission(itemId: string, optionId: string, resolvedAt: number): void
  dispose(): void
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function boundedPayload(
  payload: string,
  digest: (value: string) => string
): { head: string; byteLength: number; digest: string; truncated: boolean } {
  const byteLength = Buffer.byteLength(payload, 'utf8')
  return {
    head: payload.slice(0, PROVIDER_FRAME_HEAD_BYTES),
    byteLength,
    digest: digest(payload),
    truncated: byteLength > PROVIDER_FRAME_HEAD_BYTES
  }
}

/** Content blocks of one assistant or user message, in the shape the conversation renders. */
function messageBlocks(content: unknown): NativeChatBlock[] {
  if (typeof content === 'string') {
    return content.length > 0 ? [{ type: 'text', text: content }] : []
  }
  if (!Array.isArray(content)) {
    return []
  }
  const blocks: NativeChatBlock[] = []
  for (const raw of content) {
    const block = asRecord(raw)
    if (!block) {
      continue
    }
    if (block.type === 'text' && typeof block.text === 'string' && block.text.length > 0) {
      blocks.push({ type: 'text', text: block.text })
    } else if (block.type === 'tool_use' && asString(block.name)) {
      blocks.push({
        type: 'tool-call',
        name: asString(block.name) as string,
        input: block.input ?? {},
        state: 'running'
      })
    } else if (block.type === 'tool_result') {
      blocks.push({
        type: 'tool-result',
        output:
          typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? null),
        ...(block.is_error === true ? { isError: true } : {})
      })
    }
  }
  return blocks
}

export function createClaudeJournalTranslator(
  deps: ClaudeJournalTranslatorDeps
): ClaudeJournalTranslator {
  const digest = deps.digest ?? ((payload: string) => `sha256-len-${payload.length}`)
  const approvals = new Map<string, ClaudeStructuredPermissionRequest>()
  let disposed = false
  let ordinal = 0

  const identityFor = (uuid: string): AgentJournalItemIdentity | null => {
    const sessionId = deps.sessionId()
    return sessionId ? { provider: 'claude', sessionId, uuid } : null
  }

  const append = (uuid: string, body: AgentJournalItemBody): void => {
    if (disposed) {
      return
    }
    const identity = identityFor(uuid)
    if (!identity) {
      return
    }
    deps.sink.appendItem(identity, body)
    deps.sink.publish()
  }

  const handle = (frame: Record<string, unknown>): void => {
    if (disposed) {
      return
    }
    const permission = readClaudeStructuredPermissionRequest(frame)
    if (permission) {
      // The request id is the uuid: it is what the answer travels back under, so one request can
      // never bind to two journal items. The binding key, though, is the journal ITEM key — that is
      // the id the card answers with, and keying by the bare request id made every answer arrive
      // as "claude is no longer waiting on permission …".
      const identity = identityFor(permission.requestId)
      if (!identity) {
        return
      }
      approvals.set(permission.requestId, permission)
      deps.bindPermission(agentJournalItemKey(identity), permission)
      append(permission.requestId, claudeStructuredApprovalItem(permission))
      return
    }
    const type = asString(frame.type)
    if (type === 'assistant' || type === 'user') {
      const message = asRecord(frame.message)
      const blocks = messageBlocks(message?.content)
      if (blocks.length === 0) {
        return
      }
      // A frame with no uuid still has to land somewhere; the counter keeps two of them apart.
      const uuid = asString(frame.uuid) ?? `claude-frame-${(ordinal += 1)}`
      append(uuid, {
        kind: 'message',
        role: type === 'assistant' ? 'assistant' : 'user',
        blocks
      })
      return
    }
    if (type === 'result') {
      const uuid = asString(frame.uuid) ?? `claude-result-${(ordinal += 1)}`
      append(uuid, {
        kind: 'status',
        text: asString(frame.stop_reason) ?? 'end_turn',
        turnLifecycle: { turnId: uuid, state: 'completed' }
      })
      return
    }
    if (type === 'system' || type === 'control_request' || type === 'control_response') {
      // Everything this host does not model yet. It is journaled with its kind named so the
      // interface can say what it is instead of pretending it never happened.
      const kind = `${type}${asString(frame.subtype) ? `:${asString(frame.subtype)}` : ''}`
      const uuid = asString(frame.uuid) ?? `claude-${kind}-${(ordinal += 1)}`
      append(uuid, {
        kind: 'status',
        text: kind,
        providerFrame: {
          provider: 'claude',
          kind,
          payload: boundedPayload(JSON.stringify(frame), digest)
        }
      })
    }
  }

  return {
    handle,
    resolvePermission(itemId, optionId, resolvedAt) {
      const request = approvals.get(itemId)
      if (!request) {
        return
      }
      approvals.delete(itemId)
      const item = claudeStructuredApprovalItem(request)
      append(itemId, {
        ...item,
        resolution: { state: 'resolved', selectedOptionId: optionId, resolvedBy: null, resolvedAt }
      })
    },
    dispose() {
      disposed = true
      approvals.clear()
    }
  }
}
