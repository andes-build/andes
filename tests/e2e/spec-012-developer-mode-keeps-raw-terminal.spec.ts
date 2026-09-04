/**
 * Spec 012, criterion 6 — developer mode, with its terminal, does not change.
 *
 * Spec 012 opened a data lane for Claude and widened the structured gate so a thread's first
 * message can ride on `agentSession.create`. Neither may take the raw terminal away from developer
 * mode. This runs the app in developer mode with BOTH structured toggles on — the configuration in
 * which the new lane is reachable — and checks that a developer-mode tab is still a live raw
 * terminal: a real pty, a shell that answers, and its output on screen.
 */

import { test, expect } from './helpers/orca-app'
import { ensureTerminalVisible, waitForActiveWorktree, waitForSessionReady } from './helpers/store'
import {
  execInTerminal,
  focusActiveTerminalInput,
  getTerminalContent,
  waitForActivePanePtyId,
  waitForActiveTerminalManager
} from './helpers/terminal'

test.describe('Spec 012 — developer mode keeps its raw terminal', () => {
  // The fixture default is developer mode (tests/e2e/helpers/orca-app.ts).
  test.use({ orcaAppExtraArgs: ['--lang=en-US'] })

  test('a developer-mode tab is still a live raw terminal with the structured lane on', async ({
    orcaPage
  }) => {
    test.setTimeout(180_000)
    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)

    // The configuration in which spec 012's lane exists at all. If the lane had swallowed the
    // terminal, this is where it would show.
    await orcaPage.evaluate(async () => {
      await window.__store!.getState().updateSettings({
        interfaceMode: 'developer',
        experimentalNativeChat: true,
        experimentalStructuredNativeChat: true,
        openAgentTabsInChatByDefault: true
      })
    })
    await expect
      .poll(() => orcaPage.evaluate(() => window.__store!.getState().settings?.interfaceMode))
      .toBe('developer')

    await ensureTerminalVisible(orcaPage)
    await waitForActiveTerminalManager(orcaPage)
    const ptyId = await waitForActivePanePtyId(orcaPage)
    expect(ptyId).toBeTruthy()

    await focusActiveTerminalInput(orcaPage)
    await execInTerminal(orcaPage, ptyId, 'echo spec012-terminal-cruda')
    await expect
      .poll(async () => await getTerminalContent(orcaPage), { timeout: 30_000 })
      .toContain('spec012-terminal-cruda')
  })
})
