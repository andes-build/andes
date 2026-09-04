/**
 * Spec 019. The mandatory eval: open a thread with the root selected and
 * another with a workspace selected, and confirm the first exchange never
 * contains a question about scope — in either case. Runs against the golden
 * stub agent (spec 011's pattern) so it costs no real Claude credit.
 *
 * The scope statement rides in as the thread's literal first message,
 * argv-injected into the launch command (Claude's `promptInjectionMode`) —
 * the same mechanism spec 015/016 already use to queue a real startup
 * command instead of a bare shell. `captureNextQueuedStartupCommand` below
 * hooks the store the instant that command is queued, so the test sees the
 * exact text the agent process will receive as its argv.
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

/** The bug this spec closes was a literal question mark — "¿Con qué scope
 *  trabajamos?". The thread's first message states the scope instead of
 *  asking about it, so it carries no "?" anywhere (it does say "do not ask
 *  which scope to use", which is an instruction, not a question — checking
 *  for a literal "?" is what actually distinguishes the two). */
function assertNoScopeQuestion(text: string): void {
  expect(text).not.toContain('?')
}

/**
 * The launch command is queued into `pendingStartupByTabId` synchronously,
 * then consumed (and cleared) once the fresh tab's TerminalPane mounts — a
 * race a poll-after-click can lose. A zustand subscription installed before
 * the click catches the command at the moment it is set, win or lose the
 * race with the mount that clears it.
 */
async function captureNextQueuedStartupCommand(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __spec019CapturedCommand?: string | null }
    w.__spec019CapturedCommand = null
    window.__store!.subscribe((state) => {
      if (w.__spec019CapturedCommand !== null) {
        return
      }
      const entry = Object.values(state.pendingStartupByTabId ?? {})[0] as
        | { command?: string }
        | undefined
      if (entry?.command) {
        w.__spec019CapturedCommand = entry.command
      }
    })
  })
}

async function readCapturedStartupCommand(page: Page): Promise<string> {
  return page.evaluate(() => {
    const w = window as unknown as { __spec019CapturedCommand?: string | null }
    return w.__spec019CapturedCommand ?? ''
  })
}

test.describe('Simple mode — el hilo hereda el alcance (spec 019)', () => {
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

  test('spec019#10 root selected: the thread launches naming the root, never a question', async ({
    orcaPage
  }) => {
    // Root ("My work") is the default selector state — nothing to click.
    await captureNextQueuedStartupCommand(orcaPage)

    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()

    await expect
      .poll(() => readCapturedStartupCommand(orcaPage))
      .toContain('scope is already chosen')
    const command = await readCapturedStartupCommand(orcaPage)
    expect(command).toContain('my own work, the root')
    expect(command).toContain('--root')
    expect(command).not.toContain('--workspace')
    assertNoScopeQuestion(command)

    // Criterion 3: the scope is on screen too, not only in the transcript.
    await expect(orcaPage.getByTestId('thread-scope-badge')).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByTestId('thread-scope-badge')).toContainText('My work')
  })

  test('spec019#11 a workspace selected: the thread launches naming that workspace, never a question', async ({
    orcaPage
  }) => {
    await orcaPage.getByTestId('workspace-scope-selector').click()
    await orcaPage.getByTestId('workspace-scope-option-tandem-pay').click()
    await expect(orcaPage.getByTestId('workspace-scope-selector')).toContainText('Tandem Pay')
    await captureNextQueuedStartupCommand(orcaPage)

    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()

    await expect
      .poll(() => readCapturedStartupCommand(orcaPage))
      .toContain('scope is already chosen')
    const command = await readCapturedStartupCommand(orcaPage)
    expect(command).toContain('Tandem Pay')
    expect(command).toContain('--workspace tandem-pay')
    expect(command).not.toContain('--root')
    assertNoScopeQuestion(command)

    await expect(orcaPage.getByTestId('thread-scope-badge')).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByTestId('thread-scope-badge')).toContainText('Tandem Pay')
  })

  test("spec019#12 switching the selector after a thread opens does not change that thread's badge", async ({
    orcaPage
  }) => {
    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()
    await expect(orcaPage.getByTestId('thread-scope-badge')).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByTestId('thread-scope-badge')).toContainText('My work')

    // The selector moves to a workspace after the thread is already open.
    await orcaPage.getByTestId('workspace-scope-selector').click()
    await orcaPage.getByTestId('workspace-scope-option-tandem-pay').click()
    await expect(orcaPage.getByTestId('workspace-scope-selector')).toContainText('Tandem Pay')

    // The already-open thread's badge is untouched — it keeps the root.
    await expect(orcaPage.getByTestId('thread-scope-badge')).toContainText('My work')
  })
})
