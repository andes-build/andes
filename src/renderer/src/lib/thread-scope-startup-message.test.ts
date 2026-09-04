import { describe, expect, it } from 'vitest'
import {
  buildThreadFirstMessage,
  buildThreadScopeStartupMessage
} from './thread-scope-startup-message'

/**
 * Spec 019. The core session contract
 * (`vendor/ai-first-os-core/core/CLAUDE.md`, "When the session starts") asks
 * the first message to name the scope — a workspace slug, or the root — in
 * exactly that vocabulary. These evals hold the message to that vocabulary
 * so a future edit can't drift into a phrasing the contract no longer
 * recognizes without a test going red.
 */
describe('buildThreadScopeStartupMessage (spec 019)', () => {
  it('spec019#4 names the root with the exact flag the contract expects, never a workspace', () => {
    const message = buildThreadScopeStartupMessage({ kind: 'root' })

    expect(message).toContain('--root')
    expect(message).toContain('the root')
    expect(message).not.toContain('--workspace')
  })

  it('spec019#5 names a workspace by its slug, with the exact flag the contract expects', () => {
    const message = buildThreadScopeStartupMessage({
      kind: 'workspace',
      slug: 'tandem-pay',
      name: 'Tandem Pay'
    })

    expect(message).toContain('--workspace tandem-pay')
    expect(message).toContain('Tandem Pay')
    expect(message).not.toContain('--root')
  })

  it('spec019#6 the message never asks a question — no "?" anywhere in it', () => {
    expect(buildThreadScopeStartupMessage({ kind: 'root' })).not.toContain('?')
    expect(
      buildThreadScopeStartupMessage({ kind: 'workspace', slug: 'x', name: 'X' })
    ).not.toContain('?')
  })
})

describe('spec009#6 buildThreadFirstMessage — the scope, then what was clicked', () => {
  it('is exactly the scope message when nothing was clicked (the New thread button)', () => {
    const scope = { kind: 'root' } as const
    expect(buildThreadFirstMessage(scope)).toBe(buildThreadScopeStartupMessage(scope))
  })

  it('puts the scope first and the clicked item after it', () => {
    const scope = { kind: 'workspace', slug: 'tandem-pay', name: 'Tandem Pay' } as const
    const message = buildThreadFirstMessage(scope, 'Help me resolve "migracion-kyc".')

    expect(message.startsWith(buildThreadScopeStartupMessage(scope))).toBe(true)
    expect(message).toContain('migracion-kyc')
    expect(message).toContain('--workspace tandem-pay')
  })

  it('ignores a blank seed instead of leaving a dangling separator', () => {
    const scope = { kind: 'root' } as const
    expect(buildThreadFirstMessage(scope, '   ')).toBe(buildThreadScopeStartupMessage(scope))
  })
})
