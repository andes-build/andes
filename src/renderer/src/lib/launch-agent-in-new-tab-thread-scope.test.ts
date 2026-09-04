/**
 * Spec 019. `launchAgentInNewTab` stamps a passed `threadScope` on the
 * created tab — the field `ThreadScopeBadge` reads to show what a thread was
 * born with (see `open-new-thread.ts`, `ThreadScopeBadge.tsx`). Kept in its
 * own file rather than growing `launch-agent-in-new-tab.test.ts` past the
 * repo's max-lines gate.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateTab = vi.fn()

const store = {
  activeRepoId: 'repo-1',
  activeWorktreeId: 'wt-1',
  settings: {
    agentCmdOverrides: {},
    agentDefaultArgs: {},
    agentDefaultEnv: {},
    activeRuntimeEnvironmentId: null as string | null
  },
  projects: [{ id: 'repo-1', localWindowsRuntimePreference: { kind: 'inherit-global' as const } }],
  repos: [{ id: 'repo-1', connectionId: null as string | null, path: '/repo' }],
  sshConnectionStates: new Map<string, { status: string }>(),
  transientClearedAgentStatusConnectionIds: {} as Record<string, true>,
  worktreesByRepo: {
    'repo-1': [{ id: 'wt-1', repoId: 'repo-1', projectId: 'repo-1', path: '/repo/worktree' }]
  },
  allWorktrees: vi.fn(() => store.worktreesByRepo['repo-1']),
  tabsByWorktree: { 'wt-1': [{ id: 'tab-1' }] } as Record<string, { id: string }[]>,
  openFiles: [] as { id: string; worktreeId: string }[],
  browserTabsByWorktree: {} as Record<string, { id: string }[]>,
  tabBarOrderByWorktree: {} as Record<string, string[]>,
  terminalLayoutsByTabId: {} as Record<string, unknown>,
  ptyIdsByTabId: {} as Record<string, string[]>,
  createTab: mockCreateTab,
  closeTab: vi.fn(),
  queueTabStartupCommand: vi.fn(),
  setActiveTabType: vi.fn(),
  setTabViewMode: vi.fn(),
  setTabBarOrder: vi.fn(),
  setAgentStatus: vi.fn(),
  seedNativeChatLaunchPrompt: vi.fn(),
  seedNativeChatLaunchDraft: vi.fn(),
  markNativeChatLaunchPromptFailed: vi.fn()
}

vi.mock('@/store', () => ({ useAppStore: { getState: () => store } }))
vi.mock('@/components/tab-bar/reconcile-order', () => ({
  reconcileTabOrder: vi.fn(
    (_stored, termIds: string[], editorIds: string[], browserIds: string[]) => [
      ...termIds,
      ...editorIds,
      ...browserIds
    ]
  )
}))
vi.mock('@/lib/telemetry', () => ({
  track: vi.fn(),
  tuiAgentToAgentKind: (agent: string) => agent
}))
vi.mock('@/runtime/web-runtime-session', () => ({
  createWebRuntimeSessionTerminal: vi.fn(),
  createWebRuntimeAgentSessionTerminalWithLaunchDraft: vi.fn(),
  isWebRuntimeSessionActive: vi.fn(() => false),
  isWebTerminalSurfaceTabId: vi.fn(() => false)
}))

describe('launchAgentInNewTab — threadScope (spec 019)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateTab.mockReturnValue({ id: 'tab-1' })
  })

  it('spec019#13 stamps a passed threadScope on the new tab, and omits the field when none is passed', async () => {
    const { launchAgentInNewTab } = await import('./launch-agent-in-new-tab')

    launchAgentInNewTab({
      agent: 'codex',
      worktreeId: 'wt-1',
      threadScope: { kind: 'workspace', slug: 'tandem-pay', name: 'Tandem Pay' }
    })

    expect(mockCreateTab).toHaveBeenCalledWith('wt-1', undefined, undefined, {
      launchAgent: 'codex',
      threadScope: { kind: 'workspace', slug: 'tandem-pay', name: 'Tandem Pay' }
    })

    mockCreateTab.mockClear()
    launchAgentInNewTab({ agent: 'codex', worktreeId: 'wt-1' })

    const [, , , options] = mockCreateTab.mock.calls[0]
    expect(options).not.toHaveProperty('threadScope')
  })
})
