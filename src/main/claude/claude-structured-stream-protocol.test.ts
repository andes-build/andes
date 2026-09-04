// Spec 012 criterion 4: what the card says comes out of the permission's own fields.

import { describe, expect, it } from 'vitest'
import {
  buildClaudeStructuredPermissionResponse,
  claudeStructuredApprovalItem,
  claudeStructuredDecisionForOption,
  CLAUDE_STRUCTURED_LAUNCH_ARGS,
  readClaudeStructuredPermissionRequest
} from './claude-structured-stream-protocol'

const frame = (request: Record<string, unknown>): Record<string, unknown> => ({
  type: 'control_request',
  request_id: 'req-1',
  request: { subtype: 'can_use_tool', tool_use_id: 'toolu_1', ...request }
})

describe('reading a permission off the wire', () => {
  it('takes the title from the permission when it carries one', () => {
    const request = readClaudeStructuredPermissionRequest(
      frame({ tool_name: 'Bash', title: 'Run a command', description: 'ls -la' })
    )
    expect(request?.title).toBe('Run a command')
    expect(request?.detail).toBe('ls -la')
  })

  it('falls back to the display name, then to the tool name', () => {
    expect(
      readClaudeStructuredPermissionRequest(
        frame({ tool_name: 'Write', display_name: 'Write file' })
      )?.title
    ).toBe('Write file')
    expect(readClaudeStructuredPermissionRequest(frame({ tool_name: 'Write' }))?.title).toBe(
      'Write'
    )
  })

  it('reports no detail rather than inventing one', () => {
    expect(readClaudeStructuredPermissionRequest(frame({ tool_name: 'Write' }))?.detail).toBeNull()
  })

  it('ignores every frame that is not a permission', () => {
    expect(readClaudeStructuredPermissionRequest({ type: 'assistant' })).toBeNull()
    expect(
      readClaudeStructuredPermissionRequest({
        type: 'control_request',
        request_id: 'x',
        request: { subtype: 'initialize' }
      })
    ).toBeNull()
    expect(readClaudeStructuredPermissionRequest(null)).toBeNull()
  })
})

describe('the approval item the conversation draws', () => {
  it('copies the title and detail straight from the request', () => {
    const request = readClaudeStructuredPermissionRequest(
      frame({ tool_name: 'Write', title: 'Write', description: 'nota.txt' })
    )
    const item = claudeStructuredApprovalItem(request!)
    expect(item.title).toBe('Write')
    expect(item.detail).toBe('nota.txt')
    expect(item.options.map((option) => option.id)).toEqual(['allow', 'deny'])
    expect(item.resolution.state).toBe('pending')
  })
})

describe('the answer that goes back', () => {
  it('allows with the input unchanged', () => {
    const response = buildClaudeStructuredPermissionResponse({
      requestId: 'req-1',
      input: { file_path: 'nota.txt' },
      decision: 'allow'
    })
    expect(response).toEqual({
      type: 'control_response',
      response: {
        subtype: 'success',
        request_id: 'req-1',
        response: { behavior: 'allow', updatedInput: { file_path: 'nota.txt' } }
      }
    })
  })

  it('denies with a message and never with an input', () => {
    const response = buildClaudeStructuredPermissionResponse({
      requestId: 'req-1',
      input: { file_path: 'nota.txt' },
      decision: 'deny',
      denyMessage: 'no'
    }) as { response: { response: Record<string, unknown> } }
    expect(response.response.response).toEqual({ behavior: 'deny', message: 'no' })
  })

  it('maps the card options onto the two behaviours', () => {
    expect(claudeStructuredDecisionForOption('allow')).toBe('allow')
    expect(claudeStructuredDecisionForOption('deny')).toBe('deny')
    // Anything unrecognised denies: the safe answer is the one that does not act.
    expect(claudeStructuredDecisionForOption('something-else')).toBe('deny')
  })
})

describe('how the binary is launched', () => {
  it('opens the control channel and nothing more', () => {
    expect([...CLAUDE_STRUCTURED_LAUNCH_ARGS]).toEqual([
      '--output-format',
      'stream-json',
      '--verbose',
      '--input-format',
      'stream-json',
      '--permission-prompt-tool',
      'stdio'
    ])
  })
})
