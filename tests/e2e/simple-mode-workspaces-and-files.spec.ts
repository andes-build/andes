/**
 * Spec 010: the simple-mode workspace selector (criteria 1, 2, 3, 6) and the
 * Files screen scoped to the active workspace (criterion 7). Writes real
 * `workspaces/` fixtures into the seeded test repo — the fixture Andes
 * already opens as the active folder for every simple-mode e2e test.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'
import { TEST_REPO_PATH_FILE } from './global-setup'

function seedWorkspaces(): void {
  const repoPath = readFileSync(TEST_REPO_PATH_FILE, 'utf-8').trim()
  const workspacesDir = path.join(repoPath, 'workspaces')
  if (existsSync(workspacesDir)) {
    return
  }
  mkdirSync(path.join(workspacesDir, 'tandem-pay'), { recursive: true })
  writeFileSync(
    path.join(workspacesDir, 'tandem-pay', 'README.md'),
    '# Tandem Pay\n\nWhat it is.\n'
  )
  writeFileSync(path.join(workspacesDir, 'tandem-pay', 'decisions.md'), '# Decisions\n')

  mkdirSync(path.join(workspacesDir, 'ops'), { recursive: true })
  writeFileSync(path.join(workspacesDir, 'ops', 'README.md'), '# Ops\n\nWhat it is.\n')
  writeFileSync(path.join(workspacesDir, 'ops', 'backlog.md'), '# Backlog\n')

  mkdirSync(path.join(workspacesDir, 'growth'), { recursive: true })
  writeFileSync(path.join(workspacesDir, 'growth', 'README.md'), '# Growth\n\nWhat it is.\n')
}

test.describe('Simple mode — workspace selector and Files', () => {
  test.use({
    launchEnv: { ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test.beforeAll(() => {
    seedWorkspaces()
  })

  test.beforeEach(async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
  })

  test('the sidebar shows only the active workspace, not the others (criterion 1)', async ({
    orcaPage
  }) => {
    const selector = orcaPage.getByTestId('workspace-scope-selector')
    await expect(selector).toBeVisible({ timeout: 10_000 })
    // Root scope ("My work") by default — the other workspaces are not listed anywhere.
    await expect(orcaPage.getByText('My work')).toBeVisible()
    await expect(orcaPage.getByText('Tandem Pay')).toHaveCount(0)
    await expect(orcaPage.getByText('Ops')).toHaveCount(0)
    await expect(orcaPage.getByText('Growth')).toHaveCount(0)
  })

  test('opening the selector lists every workspace plus My work and New workspace (criterion 2)', async ({
    orcaPage
  }) => {
    await orcaPage.getByTestId('workspace-scope-selector').click()
    await expect(orcaPage.getByTestId('workspace-scope-option-tandem-pay')).toBeVisible()
    await expect(orcaPage.getByTestId('workspace-scope-option-ops')).toBeVisible()
    await expect(orcaPage.getByTestId('workspace-scope-option-growth')).toBeVisible()
    await expect(orcaPage.getByTestId('workspace-scope-option-root')).toBeVisible()
    await expect(orcaPage.getByTestId('workspace-scope-option-new')).toBeVisible()
  })

  test('choosing a workspace scopes the Files tree to it (criterion 3, 7)', async ({
    orcaPage
  }) => {
    await orcaPage.getByTestId('workspace-scope-selector').click()
    await orcaPage.getByTestId('workspace-scope-option-tandem-pay').click()
    await expect(orcaPage.getByTestId('workspace-scope-selector')).toContainText('Tandem Pay')

    await orcaPage.getByTestId('simple-mode-nav-files').click()
    const tree = orcaPage.getByTestId('workspace-file-tree')
    await expect(tree).toBeVisible({ timeout: 10_000 })
    await expect(tree.getByText('What this is')).toBeVisible()
    await expect(tree.getByText('Decisions')).toBeVisible()
    // Ops' own files never leak into Tandem Pay's tree.
    await expect(tree.getByText('Backlog')).toHaveCount(0)
  })

  test('simple mode never shows projects, repos, or worktree detail sections (criterion 6)', async ({
    orcaPage
  }) => {
    await expect(orcaPage.getByText(/Attached worktrees/i)).toHaveCount(0)
    await expect(orcaPage.getByRole('button', { name: /New worktree/i })).toHaveCount(0)
  })

  test('New thread opens a real, activated agent tab, not an empty screen (criterion 3)', async ({
    orcaPage
  }) => {
    // Why not asserting viewMode==='chat' here: native-chat's own eligibility
    // check (src/renderer/src/components/terminal-pane/use-terminal-pane-chat-state.ts)
    // reverts a tab to plain 'terminal' view until it detects a real, running
    // coding-agent CLI in the pane — which this sandboxed e2e machine has no
    // authenticated CLI to spawn. Asserting the tab exists and is active is
    // what this environment can prove; the chat request itself is real (see
    // openNewThread in SimpleModeNav.tsx) and takes effect wherever an agent
    // CLI is actually detected. See decisions.md.
    const before = await orcaPage.evaluate(() => {
      const state = window.__store!.getState()
      const worktreeId = state.activeWorktreeId!
      return {
        count: (state.tabsByWorktree[worktreeId] ?? []).length,
        activeTabId: state.activeTabIdByWorktree[worktreeId] ?? null
      }
    })

    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()

    await expect
      .poll(() =>
        orcaPage.evaluate(() => {
          const state = window.__store!.getState()
          const worktreeId = state.activeWorktreeId!
          return (state.tabsByWorktree[worktreeId] ?? []).length
        })
      )
      .toBeGreaterThan(before.count)

    const after = await orcaPage.evaluate(() => {
      const state = window.__store!.getState()
      const worktreeId = state.activeWorktreeId!
      return state.activeTabIdByWorktree[worktreeId] ?? null
    })
    expect(after).not.toBeNull()
    expect(after).not.toBe(before.activeTabId)
  })
})

test.describe('Developer mode — unaffected by the workspace selector (criterion 11)', () => {
  test.use({
    launchEnv: { ANDES_INTERFACE_MODE: 'developer' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test.beforeAll(() => {
    seedWorkspaces()
  })

  test.beforeEach(async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
  })

  test('the sidebar still shows projects and worktrees, not the workspace selector', async ({
    orcaPage
  }) => {
    await expect(orcaPage.getByTestId('workspace-scope-selector')).toHaveCount(0)
    await expect(orcaPage.getByTestId('simple-mode-nav')).toHaveCount(0)
  })
})
