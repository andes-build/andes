// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TaskProvider } from '../../../../shared/task-providers'
import type { TaskProviderReadiness } from './task-source-setup-state'
import { useTaskSourceProviderReadiness } from './use-task-source-provider-readiness'

type OfferedTaskProvider = Exclude<TaskProvider, 'linear'>

const mocks = vi.hoisted(() => ({
  state: {} as Record<string, unknown>
}))

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) => selector(mocks.state)
}))

vi.mock('@/lib/local-preflight-context', () => ({
  getLocalPreflightContext: () => null,
  localPreflightContextKey: () => 'local'
}))

vi.mock('@/lib/provider-runtime-context', () => ({
  getProviderRuntimeContextKey: () => 'local'
}))

const ALL_PROVIDERS: readonly OfferedTaskProvider[] = ['github', 'gitlab', 'jira']

let root: Root | null = null
let container: HTMLDivElement | null = null
let latest: Record<OfferedTaskProvider, TaskProviderReadiness> | null = null

function Probe({ visibleProviders }: { visibleProviders: readonly OfferedTaskProvider[] }): null {
  latest = useTaskSourceProviderReadiness(visibleProviders)
  return null
}

async function renderProbe(
  visibleProviders: readonly OfferedTaskProvider[] = ALL_PROVIDERS
): Promise<void> {
  if (!container) {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  }
  await act(async () => {
    root?.render(<Probe visibleProviders={visibleProviders} />)
  })
}

beforeEach(() => {
  mocks.state = {
    settings: {},
    preflightStatus: {
      gh: { installed: true, authenticated: true },
      glab: { installed: true, authenticated: true }
    },
    preflightStatusChecked: true,
    preflightStatusContextKey: 'local',
    preflightStatusError: null,
    preflightStatusLoading: false,
    jiraStatus: { connected: true },
    jiraStatusChecked: true,
    jiraStatusContextKey: 'local'
  }
})

afterEach(async () => {
  if (root) {
    await act(async () => {
      root?.unmount()
    })
  }
  root = null
  container?.remove()
  container = null
  latest = null
})

describe('useTaskSourceProviderReadiness', () => {
  it('reports every provider connected once checks land cleanly', async () => {
    await renderProbe()

    expect(latest?.github).toMatchObject({ connected: true, checking: false })
    expect(latest?.gitlab).toMatchObject({ connected: true, checking: false })
    expect(latest?.jira).toMatchObject({ connected: true, checking: false })
  })

  it('does not read code-host connection facts out of a failed preflight snapshot', async () => {
    // A failed refresh keeps the previous status object, so Integrations reports
    // GitHub as disconnected; Task Sources must not disagree.
    mocks.state.preflightStatusError = 'preflight failed'

    await renderProbe()

    expect(latest?.github.connected).toBe(false)
    expect(latest?.gitlab.connected).toBe(false)
    expect(latest?.github.unavailable).toBe(true)
    expect(latest?.gitlab.unavailable).toBe(true)
  })

  it('marks providers hidden when they are not in the visible list', async () => {
    await renderProbe(['github'])

    expect(latest?.github.visible).toBe(true)
    expect(latest?.gitlab.visible).toBe(false)
    expect(latest?.jira.visible).toBe(false)
  })

  it('recomputes visibility when the provider list changes', async () => {
    await renderProbe(['github'])
    expect(latest?.jira.visible).toBe(false)

    await renderProbe(['github', 'jira'])
    expect(latest?.jira.visible).toBe(true)
  })
})
