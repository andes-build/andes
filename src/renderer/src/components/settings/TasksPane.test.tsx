// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GlobalSettings } from '../../../../shared/global-settings-types'
import type { TaskProvider } from '../../../../shared/task-providers'
import type { TaskProviderReadiness } from './task-source-setup-state'
import { TasksPane } from './TasksPane'

type OfferedTaskProvider = Exclude<TaskProvider, 'linear'>

const mocks = vi.hoisted(() => ({
  readiness: {} as Record<OfferedTaskProvider, TaskProviderReadiness>,
  openSettingsTarget: vi.fn(),
  openSettingsPage: vi.fn(),
  refreshPreflightStatus: vi.fn(),
  checkJiraConnection: vi.fn(),
  jiraSetupProps: [] as { onOpenIntegrations: () => void }[]
}))

vi.mock('./use-task-source-provider-readiness', () => ({
  useTaskSourceProviderReadiness: () => mocks.readiness
}))

vi.mock('./use-integration-provider-status-refresh', () => ({
  useIntegrationProviderStatusRefresh: vi.fn()
}))

vi.mock('./TaskSourceSimpleSetup', () => ({
  CodeHostSetupSteps: (props: {
    providerLabel: string
    unavailable?: boolean
    onRetryConnection: () => void
  }) => (
    <div data-testid={`code-host-${props.providerLabel}`}>
      {props.unavailable ? (
        <>
          <span>Orca couldn&apos;t check this connection</span>
          <button type="button" onClick={props.onRetryConnection}>
            Try again
          </button>
        </>
      ) : (
        'Code host setup'
      )}
    </div>
  ),
  JiraSetupSteps: (props: { onOpenIntegrations: () => void }) => {
    mocks.jiraSetupProps.push(props)
    return <div data-testid="jira-setup">Jira setup</div>
  }
}))

vi.mock('@/store', () => ({
  useAppStore: (
    selector: (state: {
      openSettingsPage: () => void
      openSettingsTarget: (target: unknown) => void
      refreshPreflightStatus: () => void
      checkJiraConnection: () => void
      settingsSearchQuery: string
    }) => unknown
  ) =>
    selector({
      openSettingsPage: mocks.openSettingsPage,
      openSettingsTarget: mocks.openSettingsTarget,
      refreshPreflightStatus: mocks.refreshPreflightStatus,
      checkJiraConnection: mocks.checkJiraConnection,
      settingsSearchQuery: ''
    })
}))

const baseSettings = {
  visibleTaskProviders: ['github', 'gitlab'],
  defaultTaskSource: 'github'
} as GlobalSettings

const INCOMPLETE_BANNER = 'Some visible providers still need setup'

function renderPane(): string {
  return renderToStaticMarkup(<TasksPane settings={baseSettings} updateSettings={vi.fn()} />)
}

let root: Root | null = null
let container: HTMLDivElement | null = null

async function renderInteractivePane(): Promise<HTMLDivElement> {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root?.render(<TasksPane settings={baseSettings} updateSettings={vi.fn()} />)
  })
  return container
}

async function rerenderInteractivePane(): Promise<void> {
  await act(async () => {
    root?.render(<TasksPane settings={baseSettings} updateSettings={vi.fn()} />)
  })
}

describe('TasksPane', () => {
  beforeEach(() => {
    mocks.jiraSetupProps = []
    mocks.openSettingsPage.mockClear()
    mocks.openSettingsTarget.mockClear()
    mocks.readiness = {
      github: { connected: true, checking: false, visible: true },
      gitlab: { connected: true, checking: false, visible: true },
      jira: { connected: false, checking: false, visible: false }
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
  })

  it('never offers Linear as a task provider', () => {
    const markup = renderPane()

    expect(markup).not.toContain('Linear')
  })

  it('frames Task Sources as a guided setup hub, not visibility-only toggles', () => {
    const markup = renderPane()

    expect(markup).toContain('Task management setup')
    expect(markup).toContain('GitHub')
    expect(markup).toContain('GitLab')
    expect(markup).toContain('Jira')
  })

  it('does not warn on a fresh install where nothing is connected yet', () => {
    // Settings ship with every provider visible, so untouched providers are the
    // default state; the cards still say "Connect required" on their own.
    mocks.readiness.github = { connected: false, checking: false, visible: true }
    mocks.readiness.gitlab = { connected: false, checking: false, visible: true }
    mocks.readiness.jira = { connected: false, checking: false, visible: true }

    const markup = renderPane()

    expect(markup).not.toContain(INCOMPLETE_BANNER)
    expect(markup).toContain('Connect required')
  })

  it('hides the incomplete banner when every visible provider is ready', () => {
    expect(renderPane()).not.toContain(INCOMPLETE_BANNER)
  })

  it('does not warn or expand while connection checks are still in flight', () => {
    mocks.readiness.github = { connected: false, checking: true, visible: true }
    mocks.readiness.gitlab = { connected: false, checking: true, visible: true }

    const markup = renderPane()

    expect(markup).not.toContain(INCOMPLETE_BANNER)
    expect(markup).not.toContain('data-testid="jira-setup"')
  })

  it('deep-links connected Jira credential management to its integration card', async () => {
    mocks.readiness.jira = { connected: true, checking: false, visible: true }
    await renderInteractivePane()
    const expandJira = Array.from(container?.querySelectorAll('button') ?? []).find(
      (button) => button.getAttribute('aria-label') === 'Show Jira setup steps'
    )

    await act(async () => {
      expandJira?.click()
    })
    mocks.jiraSetupProps.at(-1)?.onOpenIntegrations()

    expect(mocks.openSettingsPage).toHaveBeenCalledOnce()
    expect(mocks.openSettingsTarget).toHaveBeenCalledWith({
      pane: 'integrations',
      repoId: null,
      sectionId: 'integrations-jira'
    })
  })

  it('auto-expands only the first incomplete provider', () => {
    mocks.readiness.gitlab = { connected: false, checking: false, visible: true }
    mocks.readiness.jira = { connected: false, checking: false, visible: true }

    const markup = renderPane()

    // GitLab is first in provider order, so Jira stays collapsed.
    expect(markup).toContain('Code host setup')
    expect(markup).not.toContain('data-testid="jira-setup"')
  })

  it('leaves hidden providers out of the incomplete warning', () => {
    mocks.readiness.jira = { connected: false, checking: false, visible: false }

    expect(renderPane()).not.toContain(INCOMPLETE_BANNER)
  })

  it('keeps the auto-expanded card open across a recheck of the same instance', async () => {
    mocks.readiness.gitlab = { connected: false, checking: false, visible: true }
    // Same component instance keeps the sticky auto-expand ref across rerenders.
    await renderInteractivePane()
    expect(container?.querySelector('[data-testid="code-host-GitLab"]')).not.toBeNull()

    mocks.readiness.gitlab = { connected: false, checking: true, visible: true }
    await rerenderInteractivePane()

    expect(container?.querySelector('[data-testid="code-host-GitLab"]')).not.toBeNull()
  })

  it('shows a retry action instead of setup instructions when preflight is unavailable', async () => {
    mocks.readiness.github = {
      connected: false,
      checking: false,
      unavailable: true,
      visible: true
    }
    mocks.readiness.gitlab = { connected: true, checking: false, visible: true }
    await renderInteractivePane()

    expect(container?.textContent).toContain('Status unavailable')
    expect(container?.textContent).toContain("Orca couldn't check this connection")
    const retry = Array.from(container?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent === 'Try again'
    )
    expect(retry).toBeDefined()

    await act(async () => {
      retry?.click()
    })
    expect(mocks.refreshPreflightStatus).toHaveBeenCalledWith({ force: true })
  })
})
