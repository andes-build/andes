// Spec 012 criterion 2: Claude comes in through the same gate as Codex, and an unknown provider
// stays outside.

import { describe, expect, it, vi } from 'vitest'
import type {
  AgentSessionExecutionLocation,
  AgentSessionRecord
} from '../../../shared/agent-session-record'
import { StructuredAgentSessionAdapterRouter } from './structured-agent-session-adapter-router'
import type { StructuredAgentSessionAdapter } from './structured-agent-session-adapter'
import {
  adapterSupportsCreate,
  adapterSupportsRecord
} from './structured-agent-session-provider-support'

const LOCAL: AgentSessionExecutionLocation = {
  executionHostId: 'local',
  workspaceId: 'ws-1',
  wslDistro: null
} as AgentSessionExecutionLocation

function lane(agent: string): StructuredAgentSessionAdapter {
  return {
    supportsCreate: (location, candidate) => candidate === agent && location.wslDistro === null,
    supportsLocation: (location) => location.wslDistro === null,
    acquire: vi.fn(),
    dispatch: vi.fn(),
    cancelTurn: vi.fn(),
    answerPrompt: vi.fn(),
    setOption: vi.fn()
  } as unknown as StructuredAgentSessionAdapter
}

function router(): StructuredAgentSessionAdapterRouter {
  return new StructuredAgentSessionAdapterRouter([
    { provider: 'codex', adapter: lane('codex') },
    { provider: 'claude', adapter: lane('claude') }
  ])
}

const record = (provider: string): AgentSessionRecord =>
  ({ provider, location: LOCAL }) as unknown as AgentSessionRecord

describe('adapterSupportsCreate', () => {
  it('admits claude', () => {
    expect(adapterSupportsCreate(router(), LOCAL, 'claude')).toBe(true)
  })

  it('still admits codex', () => {
    expect(adapterSupportsCreate(router(), LOCAL, 'codex')).toBe(true)
  })

  it('leaves an unknown provider outside', () => {
    expect(adapterSupportsCreate(router(), LOCAL, 'gemini')).toBe(false)
  })
})

describe('adapterSupportsRecord', () => {
  it('admits a claude record', () => {
    expect(adapterSupportsRecord(router(), record('claude'))).toBe(true)
  })

  it('still admits a codex record', () => {
    expect(adapterSupportsRecord(router(), record('codex'))).toBe(true)
  })

  it('leaves an unknown provider outside', () => {
    expect(adapterSupportsRecord(router(), record('gemini'))).toBe(false)
  })
})

describe('routing a live session', () => {
  it('sends a turn to the lane that acquired the session', async () => {
    const codex = lane('codex')
    const claude = lane('claude')
    const routed = new StructuredAgentSessionAdapterRouter([
      { provider: 'codex', adapter: codex },
      { provider: 'claude', adapter: claude }
    ])
    vi.mocked(claude.acquire).mockResolvedValue({} as never)
    await routed.acquire({
      identity: { sessionId: 's-1', agent: 'claude' },
      fence: 1,
      spawnToken: 't'
    } as never)
    await routed.dispatch({ sessionId: 's-1' } as never)
    expect(claude.dispatch).toHaveBeenCalled()
    expect(codex.dispatch).not.toHaveBeenCalled()
  })

  it('refuses to guess the lane of a session it never acquired', async () => {
    await expect(router().dispatch({ sessionId: 'unknown' } as never)).rejects.toThrow(
      /no structured lane holds session unknown/
    )
  })
})
