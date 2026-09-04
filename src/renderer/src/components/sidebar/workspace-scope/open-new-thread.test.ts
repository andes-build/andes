/**
 * Spec 015. The regression these evals hold: "New thread" has to queue the
 * agent's startup command, not only tag the tab. The spec 010 test asserted
 * the `createTab` argument shape and nothing else, so a tab that spawned a
 * plain login shell passed it.
 *
 * `launchAgentInNewTab` is deliberately NOT mocked: the assertion is on the
 * startup command that reaches the store, which is what actually spawns the
 * agent CLI in the PTY.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { containsPermissionBypassArgs } from '../../../../../shared/tui-agent-permissions'

const mockCreateTab = vi.fn()
const mockQueueTabStartupCommand = vi.fn()
const mockSetActiveView = vi.fn()
const mockOpenSkillsPage = vi.fn()
const mockEnsureDetectedAgents = vi.fn()
const mockAddRepo = vi.fn()
const mockToastError = vi.fn()
const mockToastMessage = vi.fn()

const store = {
  activeWorktreeId: 'wt-1' as string | null,
  activeRepoId: 'repo-1',
  detectedAgentIds: ['claude'] as string[] | null,
  settings: {
    agentCmdOverrides: {} as Record<string, string>,
    agentDefaultArgs: {} as Record<string, string>,
    agentDefaultEnv: {} as Record<string, Record<string, string>>,
    activeRuntimeEnvironmentId: null as string | null,
    interfaceMode: 'simple' as string,
    defaultTuiAgent: undefined as string | undefined,
    disabledTuiAgents: undefined as string[] | undefined
  },
  projects: [{ id: 'repo-1', localWindowsRuntimePreference: { kind: 'inherit-global' as const } }],
  repos: [{ id: 'repo-1', connectionId: null as string | null, path: '/repo' }],
  sshConnectionStates: new Map<string, { status: string }>(),
  transientClearedAgentStatusConnectionIds: {} as Record<string, true>,
  worktreesByRepo: {
    'repo-1': [
      {
        id: 'wt-1',
        repoId: 'repo-1',
        projectId: 'repo-1',
        path: '/repo/worktree',
        displayName: 'main'
      }
    ]
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
  queueTabStartupCommand: mockQueueTabStartupCommand,
  queueTabInitialCwd: vi.fn(),
  setActiveTabType: vi.fn(),
  setTabViewMode: vi.fn(),
  setTabBarOrder: vi.fn(),
  setAgentStatus: vi.fn(),
  seedNativeChatLaunchPrompt: vi.fn(),
  seedNativeChatLaunchDraft: vi.fn(),
  markNativeChatLaunchPromptFailed: vi.fn(),
  setActiveView: mockSetActiveView,
  openSkillsPage: mockOpenSkillsPage,
  ensureDetectedAgents: mockEnsureDetectedAgents,
  addRepo: mockAddRepo
}

vi.mock('@/store', () => ({ useAppStore: { getState: () => store } }))
vi.mock('sonner', () => ({ toast: { error: mockToastError, message: mockToastMessage } }))
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

describe('openNewThread (spec 015)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    store.activeWorktreeId = 'wt-1'
    store.detectedAgentIds = ['claude']
    store.settings = {
      agentCmdOverrides: {},
      agentDefaultArgs: {},
      agentDefaultEnv: {},
      activeRuntimeEnvironmentId: null,
      interfaceMode: 'simple',
      defaultTuiAgent: undefined,
      disabledTuiAgents: undefined
    }
    store.tabsByWorktree = { 'wt-1': [{ id: 'tab-1' }] }
    store.tabBarOrderByWorktree = {}
    mockCreateTab.mockReturnValue({ id: 'tab-1' })
    mockEnsureDetectedAgents.mockResolvedValue(['claude'])
  })

  it('spec015#1 queues the startup command that spawns the detected agent, not a bare shell', async () => {
    const { openNewThread } = await import('./open-new-thread')

    await openNewThread()

    expect(mockEnsureDetectedAgents).toHaveBeenCalledWith('wt-1')
    expect(mockQueueTabStartupCommand).toHaveBeenCalledTimes(1)
    const [tabId, startup] = mockQueueTabStartupCommand.mock.calls[0]
    expect(tabId).toBe('tab-1')
    expect(startup.launchAgent).toBe('claude')
    expect(String(startup.command)).toContain('claude')
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('spec015#2 opens the tab as a conversation in simple mode', async () => {
    const { openNewThread } = await import('./open-new-thread')

    await openNewThread()

    expect(mockSetActiveView).toHaveBeenCalledWith('terminal')
    expect(mockCreateTab).toHaveBeenCalledWith('wt-1', undefined, undefined, {
      launchAgent: 'claude',
      quickCommandLabel: undefined,
      viewMode: 'chat'
    })
  })

  it('spec016#3 says so on screen when no conversation-capable agent is installed, and offers an action', async () => {
    store.detectedAgentIds = []
    mockEnsureDetectedAgents.mockResolvedValue([])
    const { openNewThread } = await import('./open-new-thread')

    await openNewThread()

    expect(mockQueueTabStartupCommand).not.toHaveBeenCalled()
    expect(mockCreateTab).not.toHaveBeenCalled()
    const [message, options] = mockToastError.mock.calls[0]
    expect(String(message)).toContain('Claude Code is not installed')
    expect(options.action.label).toBe('Agents & skills')
    options.action.onClick()
    expect(mockOpenSkillsPage).toHaveBeenCalled()
  })

  it('spec015#4 says so on screen when no folder is open', async () => {
    store.activeWorktreeId = null
    const { openNewThread } = await import('./open-new-thread')

    await openNewThread()

    expect(mockEnsureDetectedAgents).not.toHaveBeenCalled()
    expect(mockCreateTab).not.toHaveBeenCalled()
    expect(String(mockToastError.mock.calls[0][0])).toContain('Open a folder')
  })
})

describe('openNewThread — el agente correcto y sin omisión de permisos (spec 016)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    store.activeWorktreeId = 'wt-1'
    store.detectedAgentIds = ['claude']
    store.settings = {
      agentCmdOverrides: {},
      agentDefaultArgs: {},
      agentDefaultEnv: {},
      activeRuntimeEnvironmentId: null,
      interfaceMode: 'simple',
      defaultTuiAgent: undefined,
      disabledTuiAgents: undefined
    }
    store.tabsByWorktree = { 'wt-1': [{ id: 'tab-1' }] }
    store.tabBarOrderByWorktree = {}
    mockCreateTab.mockReturnValue({ id: 'tab-1' })
    mockEnsureDetectedAgents.mockResolvedValue(['claude'])
  })

  it('spec016#1 launches the conversation-capable agent, not the machine default', async () => {
    store.settings.defaultTuiAgent = 'antigravity'
    store.detectedAgentIds = ['antigravity', 'claude']
    mockEnsureDetectedAgents.mockResolvedValue(['antigravity', 'claude'])
    const { openNewThread } = await import('./open-new-thread')

    await openNewThread()

    const [, startup] = mockQueueTabStartupCommand.mock.calls[0]
    expect(startup.launchAgent).toBe('claude')
    expect(String(startup.command)).not.toContain('agy')
  })

  it('spec016#2 never passes a permission-bypass argument, even when the profile default carries one', async () => {
    store.settings.agentDefaultArgs = { claude: '--dangerously-skip-permissions --model opus' }
    const { openNewThread } = await import('./open-new-thread')

    await openNewThread()

    const [, startup] = mockQueueTabStartupCommand.mock.calls[0]
    expect(containsPermissionBypassArgs(String(startup.command))).toBe(false)
    expect(String(startup.command)).not.toContain('--dangerously-skip-permissions')
    // Lo que no es omisión de permisos sobrevive: el filtro es por argumento, no por bloque.
    expect(String(startup.command)).toContain("'--model' 'opus'")
    // Y el modo que hace aparecer la tarjeta: sin él, Claude Code corre en su modo `auto`.
    expect(String(startup.command)).toContain("'--permission-mode' 'manual'")
    expect(startup.agentArgsOverride).toBe('--model opus --permission-mode manual')
  })

  it('spec016#3 opens no terminal when the only agent installed has no conversation', async () => {
    store.settings.defaultTuiAgent = 'antigravity'
    store.detectedAgentIds = ['antigravity']
    mockEnsureDetectedAgents.mockResolvedValue(['antigravity'])
    const { openNewThread } = await import('./open-new-thread')

    await openNewThread()

    expect(mockCreateTab).not.toHaveBeenCalled()
    expect(mockQueueTabStartupCommand).not.toHaveBeenCalled()
    const [message, options] = mockToastError.mock.calls[0]
    expect(String(message)).toContain('Claude Code is not installed')
    expect(options.action.label).toBe('Agents & skills')
  })

  it('spec016#4 the missing-folder notice carries the action that opens one', async () => {
    store.activeWorktreeId = null
    const { openNewThread } = await import('./open-new-thread')

    await openNewThread()

    expect(mockCreateTab).not.toHaveBeenCalled()
    const [, options] = mockToastError.mock.calls[0]
    expect(options.action.label).toBe('Open folder')
    options.action.onClick()
    expect(mockAddRepo).toHaveBeenCalled()
  })
})
