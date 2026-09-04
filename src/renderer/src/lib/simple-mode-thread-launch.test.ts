/**
 * Spec 016. Las dos reglas del modo simple, probadas donde viven: el hilo solo
 * lanza un agente cuya conversación la app sabe dibujar, y ningún argumento de
 * omisión de permisos llega al comando.
 */

import { describe, expect, it } from 'vitest'
import {
  resolveSimpleModeThreadAgent,
  resolveSimpleModeThreadAgentArgs
} from './simple-mode-thread-launch'
import {
  PERMISSION_BYPASS_ARGS,
  YOLO_TUI_AGENT_ARGS,
  containsPermissionBypassArgs,
  stripPermissionBypassArgs
} from '../../../shared/tui-agent-permissions'

describe('spec016#5 permission-bypass arguments', () => {
  it('recognizes and strips every bypass argument of the catalog', () => {
    for (const value of PERMISSION_BYPASS_ARGS) {
      expect(containsPermissionBypassArgs(value)).toBe(true)
      expect(stripPermissionBypassArgs(value)).toBe('')
      expect(containsPermissionBypassArgs(`--model opus ${value} --verbose`)).toBe(true)
      expect(stripPermissionBypassArgs(`--model opus ${value} --verbose`)).toBe(
        '--model opus --verbose'
      )
    }
  })

  it('leaves arguments that are not a bypass alone', () => {
    expect(containsPermissionBypassArgs('--model opus')).toBe(false)
    expect(stripPermissionBypassArgs('--model opus')).toBe('--model opus')
    expect(stripPermissionBypassArgs('')).toBe('')
    expect(stripPermissionBypassArgs(null)).toBe('')
  })

  it('strips the profile default of every agent that carries one', () => {
    for (const [agent, value] of Object.entries(YOLO_TUI_AGENT_ARGS)) {
      expect(
        resolveSimpleModeThreadAgentArgs(agent as never, {
          agentDefaultArgs: { [agent]: value }
        })
      ).toBe('')
    }
  })

  it('falls back to the code default, stripped, when the profile says nothing', () => {
    expect(resolveSimpleModeThreadAgentArgs('claude', { agentDefaultArgs: {} })).toBe('')
    expect(resolveSimpleModeThreadAgentArgs('claude', null)).toBe('')
  })
})

describe('spec016#6 which agent a simple-mode thread may launch', () => {
  it('skips the machine default when it has no conversation', () => {
    expect(
      resolveSimpleModeThreadAgent({
        defaultTuiAgent: 'antigravity',
        detectedAgentIds: ['antigravity', 'gemini', 'claude'],
        disabledTuiAgents: []
      })
    ).toBe('claude')
  })

  it('honours the operator default when it does have one', () => {
    expect(
      resolveSimpleModeThreadAgent({
        defaultTuiAgent: 'codex',
        detectedAgentIds: ['claude', 'codex'],
        disabledTuiAgents: []
      })
    ).toBe('codex')
  })

  it('returns null instead of falling back to a terminal agent', () => {
    expect(
      resolveSimpleModeThreadAgent({
        defaultTuiAgent: 'antigravity',
        detectedAgentIds: ['antigravity', 'gemini', 'aider'],
        disabledTuiAgents: []
      })
    ).toBeNull()
  })

  it('skips a disabled agent and an unreadable-transcript agent', () => {
    expect(
      resolveSimpleModeThreadAgent({
        defaultTuiAgent: undefined,
        detectedAgentIds: ['claude', 'codex'],
        disabledTuiAgents: ['claude']
      })
    ).toBe('codex')
    expect(
      resolveSimpleModeThreadAgent({
        defaultTuiAgent: undefined,
        detectedAgentIds: ['grok'],
        disabledTuiAgents: [],
        nativeChatTranscriptIsLocalReadable: false
      })
    ).toBeNull()
  })
})
