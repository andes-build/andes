/**
 * Spec 021. With a workspace selected, "New thread" left the panel blank: no
 * tab in the strip and nothing painted, while the store already held the tab,
 * its group and its thread scope.
 *
 * This is the presence guard for that path: a workspace is selected, the
 * thread is opened the way a person opens it, and the tab, the scope badge
 * and the composer have to be on screen.
 *
 * The assertions measure painted geometry, not presence in the document: the
 * blank panel had the whole conversation in the tree and a pane measuring
 * 0x0, so `toBeVisible()` alone would have passed while the screen stayed
 * empty.
 *
 * The test that separates the broken build from the fixed one is the unit
 * one, `src/renderer/src/components/terminal/split-group-mount-stale-group.test.ts`:
 * this suite passes on both.
 *
 * Runs against the golden stub agent (spec 011's pattern), so it costs no
 * real Claude credit.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@stablyai/playwright-test'
import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'
import { TEST_REPO_PATH_FILE } from './global-setup'
import { configureGoldenStubAgent, getGoldenStubAgentLaunchEnv } from './helpers/golden-stub-agent'

function seedWorkspace(): void {
  const repoPath = readFileSync(TEST_REPO_PATH_FILE, 'utf-8').trim()
  const workspaceDir = path.join(repoPath, 'workspaces', 'tandem-pay')
  if (existsSync(workspaceDir)) {
    return
  }
  mkdirSync(workspaceDir, { recursive: true })
  writeFileSync(path.join(workspaceDir, 'README.md'), '# Tandem Pay\n\nWhat it is.\n')
}

/** Painted size of the active thread's pane, in CSS pixels. */
async function activePaneSize(page: Page): Promise<{ width: number; height: number }> {
  return page.evaluate(() => {
    const activeTabId = window.__store!.getState().activeTabId
    const pane = activeTabId
      ? document.querySelector(`[data-terminal-tab-id="${activeTabId}"]`)
      : null
    if (!pane) {
      return { width: 0, height: 0 }
    }
    const rect = pane.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  })
}

test.describe('Simple mode — el hilo abre con un workspace elegido (spec 021)', () => {
  test.use({
    launchEnv: { ...getGoldenStubAgentLaunchEnv(), ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test.beforeAll(() => {
    seedWorkspace()
  })

  test.beforeEach(async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    await configureGoldenStubAgent(orcaPage, { agent: 'claude' })
  })

  test('spec021#6 a workspace selected: the thread paints its tab, its scope and its composer', async ({
    orcaPage
  }) => {
    await orcaPage.getByTestId('workspace-scope-selector').click()
    await orcaPage.getByTestId('workspace-scope-option-tandem-pay').click()
    await expect(orcaPage.getByTestId('workspace-scope-selector')).toContainText('Tandem Pay')

    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()

    // The tab is in the strip.
    await expect(orcaPage.getByTestId('sortable-tab').first()).toBeVisible({ timeout: 15_000 })

    // The scope is on screen, and it is the workspace's.
    await expect(orcaPage.getByTestId('thread-scope-badge')).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByTestId('thread-scope-badge')).toContainText('Tandem Pay')

    // The pane actually occupies the panel — this is what the blank screen broke.
    await expect
      .poll(async () => (await activePaneSize(orcaPage)).height, { timeout: 15_000 })
      .toBeGreaterThan(100)
    const size = await activePaneSize(orcaPage)
    expect(size.width).toBeGreaterThan(100)

    // And the person can type.
    await expect(orcaPage.getByPlaceholder('Send a message…')).toBeVisible({ timeout: 15_000 })
  })

  test('spec021#7 the root keeps working the same way', async ({ orcaPage }) => {
    // Root ("My work") is the default selector state — nothing to click.
    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()

    await expect(orcaPage.getByTestId('sortable-tab').first()).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByTestId('thread-scope-badge')).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByTestId('thread-scope-badge')).toContainText('My work')
    await expect
      .poll(async () => (await activePaneSize(orcaPage)).height, { timeout: 15_000 })
      .toBeGreaterThan(100)
  })
})
