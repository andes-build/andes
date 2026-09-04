/**
 * Spec 013: threads stop opening as tabs and list in the sidebar instead
 * (criteria 1-3), the conversation gets a title + scope header (criteria
 * 4-6), and the right files panel never shows in simple mode (criterion 8).
 * Developer mode keeps tabs, the right panel and the raw tool line
 * (criterion 9). Runs against the golden stub agent (spec 011's pattern), so
 * it costs no real Claude credit; the stub never writes a `custom-title` or
 * `ai-title` record, which is exactly what exercises criterion 6's
 * degrade-to-"New thread" path end to end.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from './helpers/orca-app'
import { waitForActiveWorktree, waitForSessionReady } from './helpers/store'
import { TEST_REPO_PATH_FILE } from './global-setup'
import {
  configureGoldenStubAgent,
  getGoldenStubAgentLaunchEnv,
  launchGoldenStubAgentFromNewTab
} from './helpers/golden-stub-agent'

// Without a `workspaces/` folder the sidebar shows the "no workspaces yet"
// empty state instead of Recent threads (spec 010) — same seed the spec
// 019/021 e2e specs use.
function seedWorkspace(): void {
  const repoPath = readFileSync(TEST_REPO_PATH_FILE, 'utf-8').trim()
  const workspaceDir = path.join(repoPath, 'workspaces', 'tandem-pay')
  if (existsSync(workspaceDir)) {
    return
  }
  mkdirSync(workspaceDir, { recursive: true })
  writeFileSync(path.join(workspaceDir, 'README.md'), '# Tandem Pay\n\nWhat it is.\n')
}

test.describe('Simple mode — el hilo en la barra lateral (spec 013)', () => {
  test.use({
    launchEnv: { ...getGoldenStubAgentLaunchEnv(), ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test.beforeAll(() => {
    seedWorkspace()
  })

  test.beforeEach(async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)
    await configureGoldenStubAgent(orcaPage, { agent: 'claude' })
  })

  test('spec013#1 two open threads: two sidebar rows, no tab bar anywhere in the tree', async ({
    orcaPage
  }) => {
    // Counts are relative to whatever this shared session already had —
    // `orcaPage` is not guaranteed fresh per test in this describe block.
    const baseline = await orcaPage.getByTestId('recent-thread-row').count()
    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()
    await expect(orcaPage.getByTestId('recent-thread-row')).toHaveCount(baseline + 1, {
      timeout: 15_000
    })
    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()

    await expect(orcaPage.getByTestId('recent-thread-row')).toHaveCount(baseline + 2, {
      timeout: 15_000
    })
    await expect(orcaPage.getByTestId('sortable-tab')).toHaveCount(0)
  })

  test('spec013#3 clicking a row opens that thread; New thread creates and selects one', async ({
    orcaPage
  }) => {
    const baseline = await orcaPage.getByTestId('recent-thread-row').count()
    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()
    await expect(orcaPage.getByTestId('recent-thread-row')).toHaveCount(baseline + 1, {
      timeout: 15_000
    })
    const firstRow = orcaPage.getByTestId('recent-thread-row').first()
    // New thread leaves the newest thread selected — the newest thread always
    // sorts first (createdAt tiebreak in `buildSimpleModeThreadRows`).
    await expect(firstRow).toHaveAttribute('data-active', 'true')

    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()
    await expect(orcaPage.getByTestId('recent-thread-row')).toHaveCount(baseline + 2, {
      timeout: 15_000
    })
    const rows = orcaPage.getByTestId('recent-thread-row')
    await expect(rows.nth(0)).toHaveAttribute('data-active', 'true')
    await expect(rows.nth(1)).toHaveAttribute('data-active', 'false')

    // Clicking the other row opens it instead.
    await rows.nth(1).click()
    await expect(rows.nth(1)).toHaveAttribute('data-active', 'true')
    await expect(rows.nth(0)).toHaveAttribute('data-active', 'false')
  })

  test('spec013#4,6 the header shows a title and "My work · <scope>", degrading to "New thread" when the CLI wrote none', async ({
    orcaPage
  }) => {
    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()

    await expect(orcaPage.getByTestId('thread-header-title')).toBeVisible({ timeout: 15_000 })
    // The golden stub agent never writes a `custom-title`/`ai-title` record.
    await expect(orcaPage.getByTestId('thread-header-title')).toHaveText('New thread')
    await expect(orcaPage.getByTestId('thread-scope-badge')).toContainText('My work')
  })

  test('spec013#8 the right files panel never shows in simple mode', async ({ orcaPage }) => {
    await expect(orcaPage.getByTestId('right-sidebar')).toHaveCount(0)
  })
})

test.describe('Developer mode — sin cambios (spec 013, criterion 9)', () => {
  test.use({
    launchEnv: getGoldenStubAgentLaunchEnv(),
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test('spec013#9 the tab bar and the right panel still work as before', async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)
    await configureGoldenStubAgent(orcaPage, { agent: 'claude' })

    await launchGoldenStubAgentFromNewTab(orcaPage, /^Claude(?:\s|$)/i)

    await expect(orcaPage.getByTestId('sortable-tab').first()).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByTestId('recent-threads-section')).toHaveCount(0)
    await expect(orcaPage.getByTestId('right-sidebar')).toBeVisible({ timeout: 15_000 })
  })
})
