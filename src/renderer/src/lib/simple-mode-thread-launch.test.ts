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
  ASK_PERMISSION_TUI_AGENT_ARGS,
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
      const args = resolveSimpleModeThreadAgentArgs(agent as never, {
        agentDefaultArgs: { [agent]: value }
      })
      expect(containsPermissionBypassArgs(args)).toBe(false)
      expect(args).toBe(ASK_PERMISSION_TUI_AGENT_ARGS[agent as never] ?? '')
    }
  })

  it('asks Claude Code for the permission card instead of its auto default', () => {
    expect(
      resolveSimpleModeThreadAgentArgs('claude', {
        agentDefaultArgs: { claude: '--dangerously-skip-permissions --model opus' }
      })
    ).toBe('--model opus --permission-mode manual')
    expect(resolveSimpleModeThreadAgentArgs('claude', { agentDefaultArgs: {} })).toBe(
      '--permission-mode manual'
    )
    // Un modo elegido a mano no se pisa.
    expect(
      resolveSimpleModeThreadAgentArgs('claude', {
        agentDefaultArgs: { claude: '--permission-mode plan' }
      })
    ).toBe('--permission-mode plan')
  })

  it('leaves an agent without a verified ask argument alone', () => {
    expect(resolveSimpleModeThreadAgentArgs('codex', { agentDefaultArgs: {} })).toBe('')
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
