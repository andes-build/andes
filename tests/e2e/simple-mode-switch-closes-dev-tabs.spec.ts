/**
 * Spec 006, criterion 7 — closes the gap spec 002 left open (see decisions.md,
 * 2026-09-03): switching from developer to simple mode with a browser tab, the
 * agent dashboard drawer, and the PR/task page already open closes all three,
 * and the terminal tab (the conversation) survives.
 */

import { test, expect } from './helpers/orca-app'
import { waitForSessionReady, waitForActiveWorktree, getBrowserTabs } from './helpers/store'

test.describe('Simple mode — closes already-open developer surfaces', () => {
  // Fixture default is developer mode (tests/e2e/helpers/orca-app.ts); this
  // spec exercises the developer -> simple transition explicitly.
  test.use({ orcaAppExtraArgs: ['--lang=en-US'] })

  test('closes an open browser tab, the dashboard, and the PR page — keeps the terminal', async ({
    orcaPage
  }) => {
    await waitForSessionReady(orcaPage)
    const worktreeId = await waitForActiveWorktree(orcaPage)

    const terminalTabCountBefore = await orcaPage.evaluate(
      (targetWorktreeId) =>
        (window.__store!.getState().tabsByWorktree[targetWorktreeId] ?? []).length,
      worktreeId
    )

    // Open the three developer-only surfaces criterion 7 names. The dashboard
    // drawer only stays open with experimentalAgentDashboardPopout on — a
    // sidebar effect otherwise closes it right back (sidebar/index.tsx).
    await orcaPage.evaluate((targetWorktreeId) => {
      const state = window.__store!.getState()
      state.createBrowserTab(targetWorktreeId, 'about:blank', { activate: true })
      void state.updateSettings({ experimentalAgentDashboardPopout: true }).then(() => {
        window.__store!.getState().setAgentDashboardDrawerOpen(true)
      })
      state.openTaskPage()
    }, worktreeId)

    await expect
      .poll(async () => (await getBrowserTabs(orcaPage, worktreeId)).length)
      .toBeGreaterThan(0)
    await expect
      .poll(() => orcaPage.evaluate(() => window.__store!.getState().activeView))
      .toBe('tasks')
    await expect
      .poll(() => orcaPage.evaluate(() => window.__store!.getState().agentDashboardDrawerOpen))
      .toBe(true)

    // The Option-click door (spec 002): flips interfaceMode to simple.
    await orcaPage.evaluate(() => {
      void window.__store!.getState().updateSettings({ interfaceMode: 'simple' })
    })
    await expect.poll(async () => (await getBrowserTabs(orcaPage, worktreeId)).length).toBe(0)

    const after = await orcaPage.evaluate((targetWorktreeId) => {
      const state = window.__store!.getState()
      return {
        terminalTabCount: (state.tabsByWorktree[targetWorktreeId] ?? []).length,
        activeView: state.activeView,
        dashboardOpen: state.agentDashboardDrawerOpen
      }
    }, worktreeId)

    expect(after.activeView).not.toBe('tasks')
    expect(after.dashboardOpen).toBe(false)
    // The conversation survives: no terminal tab was closed by the switch.
    expect(after.terminalTabCount).toBe(terminalTabCountBefore)
  })
})
