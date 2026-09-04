import { describe, expect, it } from 'vitest'
import { resolveThreadHeaderTitle } from './thread-header-title'

const FALLBACK = 'New thread'

describe('resolveThreadHeaderTitle', () => {
  // Criterion 5: custom-title beats ai-title; neither present falls back;
  // a manual rename in Andes beats both.
  it('custom-title and ai-title both present: custom-title wins', () => {
    const title = resolveThreadHeaderTitle(
      {
        customTitle: null,
        aiVaultTitle: {
          agent: 'claude',
          sessionId: 's1',
          title: 'x',
          explicitTitle: 'Fix the login bug'
        }
      },
      FALLBACK
    )
    expect(title).toBe('Fix the login bug')
  })

  it('only the CLI explicit title present: it is used', () => {
    const title = resolveThreadHeaderTitle(
      {
        customTitle: null,
        aiVaultTitle: {
          agent: 'claude',
          sessionId: 's1',
          title: 'x',
          explicitTitle: 'Fix the login bug'
        }
      },
      FALLBACK
    )
    expect(title).toBe('Fix the login bug')
  })

  it('neither custom-title nor ai-title present: falls back to "New thread"', () => {
    const title = resolveThreadHeaderTitle(
      {
        customTitle: null,
        aiVaultTitle: { agent: 'claude', sessionId: 's1', title: 'x', explicitTitle: null }
      },
      FALLBACK
    )
    expect(title).toBe(FALLBACK)
  })

  it('a manual rename in Andes wins over both custom-title and ai-title', () => {
    const title = resolveThreadHeaderTitle(
      {
        customTitle: 'My own name',
        aiVaultTitle: {
          agent: 'claude',
          sessionId: 's1',
          title: 'x',
          explicitTitle: 'Fix the login bug'
        }
      },
      FALLBACK
    )
    expect(title).toBe('My own name')
  })

  // Criterion 6: a CLI that never wrote a title record degrades to the
  // fallback — it never invents one from the first prompt or a session id.
  it('no aiVaultTitle at all (CLI never wrote one): degrades to "New thread"', () => {
    const title = resolveThreadHeaderTitle({ customTitle: null, aiVaultTitle: null }, FALLBACK)
    expect(title).toBe(FALLBACK)
  })
})
