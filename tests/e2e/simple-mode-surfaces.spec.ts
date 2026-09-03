/**
 * Spec 002: criteria 2, 4, and 5 — the hidden developer-mode door, the right
 * sidebar's reduced tab set, and blocked shortcuts, all in simple mode.
 */

import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'

test.describe('Simple mode — surfaces', () => {
  // Criterion 7's fixture default is developer mode; these tests exercise
  // simple mode explicitly. --lang pins the UI to English regardless of the
  // host OS locale, since these assertions match English copy.
  test.use({
    launchEnv: { ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test.beforeEach(async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
  })

  test('Option-click on the Advanced title reveals Git without reloading', async ({ orcaPage }) => {
    await orcaPage.evaluate(() => {
      const state = window.__store!.getState()
      state.openSettingsTarget({ pane: 'advanced', repoId: null })
      state.openSettingsPage()
    })
    await expect(orcaPage.getByPlaceholder('Search settings')).toBeVisible({ timeout: 10_000 })

    // Simple mode: no Git section in the nav.
    await expect(orcaPage.getByRole('button', { name: 'Git & Source Control' })).toHaveCount(0)

    const advancedTitle = orcaPage
      .locator('[data-settings-section="advanced"]')
      .getByRole('heading', { name: 'Advanced', exact: true })
    await expect(advancedTitle).toBeVisible({ timeout: 10_000 })
    await advancedTitle.click({ modifiers: ['Alt'] })

    // Hot-applies: Git appears in the nav without a reload.
    await expect(orcaPage.getByRole('button', { name: 'Git & Source Control' })).toBeVisible({
      timeout: 10_000
    })
  })

  test('the right sidebar offers no Checks, Ports, or Attached worktrees tab', async ({
    orcaPage
  }) => {
    await expect(orcaPage.getByRole('button', { name: /^Checks(\s|$)/ })).toHaveCount(0)
    await expect(orcaPage.getByRole('button', { name: /^Ports(\s|$)/ })).toHaveCount(0)
    await expect(orcaPage.getByRole('button', { name: /Attached worktrees/i })).toHaveCount(0)
  })

  test('the browser and cmd-j shortcuts open no new tab or palette', async ({ orcaPage }) => {
    const tabCountBefore = await orcaPage.evaluate(() => {
      const state = window.__store!.getState()
      const worktreeId = state.activeWorktreeId!
      return (state.tabsByWorktree[worktreeId] ?? []).length
    })

    const isMac = process.platform === 'darwin'
    // tab.newBrowser default binding: Mod+Shift+B.
    await orcaPage.keyboard.press(isMac ? 'Meta+Shift+B' : 'Control+Shift+B')
    await orcaPage.waitForTimeout(300)

    const tabCountAfter = await orcaPage.evaluate(() => {
      const state = window.__store!.getState()
      const worktreeId = state.activeWorktreeId!
      return (state.tabsByWorktree[worktreeId] ?? []).length
    })
    expect(tabCountAfter).toBe(tabCountBefore)

    // worktree.palette default binding: Mod+J on macOS, Mod+Shift+J elsewhere.
    await orcaPage.keyboard.press(isMac ? 'Meta+J' : 'Control+Shift+J')
    await orcaPage.waitForTimeout(300)
    const activeModal = await orcaPage.evaluate(() => window.__store!.getState().activeModal)
    expect(activeModal).not.toBe('worktree-palette')
  })
})
