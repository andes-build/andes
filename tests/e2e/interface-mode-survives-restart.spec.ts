/**
 * Spec 017: the interface mode chosen by the operator survives closing and
 * reopening the app.
 *
 * These launches deliberately run with NO ANDES_INTERFACE_MODE door
 * (`interfaceModeEnvDoor: 'off'`), because the door wins over the persisted
 * value at every launch and would mask exactly the bug under test.
 */

import { existsSync, readFileSync } from 'node:fs'
import type { ElectronApplication, Page } from '@stablyai/playwright-test'
import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'
import { attachRepoAndOpenTerminal, createRestartSession } from './helpers/orca-restart'
import { TEST_REPO_PATH_FILE } from './global-setup'

function seededRepoPathOrSkip(): string {
  const repoPath = existsSync(TEST_REPO_PATH_FILE)
    ? readFileSync(TEST_REPO_PATH_FILE, 'utf-8').trim()
    : ''
  test.skip(!repoPath || !existsSync(repoPath), 'Global setup did not produce a seeded test repo')
  return repoPath
}

async function setInterfaceMode(page: Page, interfaceMode: 'simple' | 'developer'): Promise<void> {
  await page.evaluate(async (mode) => {
    const store = window.__store
    if (!store) {
      throw new Error('window.__store is not available')
    }
    await store.getState().updateSettings({ interfaceMode: mode })
  }, interfaceMode)
}

async function readInterfaceMode(page: Page): Promise<string | undefined> {
  return page.evaluate(() => window.__store?.getState().settings?.interfaceMode)
}

test('the chosen interface mode survives closing and reopening the app, with a real project attached (criterion 1, 2, 3)', async (// oxlint-disable-next-line no-empty-pattern -- Playwright's second fixture arg is testInfo; the first must be an object destructure to opt out of the default fixture set.
{}, testInfo) => {
  test.setTimeout(420_000)
  const repoPath = seededRepoPathOrSkip()
  const session = createRestartSession(testInfo, {}, { interfaceModeEnvDoor: 'off' })
  const launched: ElectronApplication[] = []
  try {
    const first = await session.launch()
    launched.push(first.app)
    await waitForSessionReady(first.page)
    await setInterfaceMode(first.page, 'developer')
    await attachRepoAndOpenTerminal(first.page, repoPath)
    await session.close(first.app)
    launched.pop()

    // An explicit choice outranks the simple default at the next launch.
    const second = await session.launch()
    launched.push(second.app)
    await waitForSessionReady(second.page)
    await expect.poll(() => readInterfaceMode(second.page)).toBe('developer')
    await expect(second.page.getByTestId('simple-mode-nav')).toHaveCount(0)

    await setInterfaceMode(second.page, 'simple')
    await session.close(second.app)
    launched.pop()

    const third = await session.launch()
    launched.push(third.app)
    await waitForSessionReady(third.page)
    await expect.poll(() => readInterfaceMode(third.page)).toBe('simple')
    await expect(third.page.getByTestId('workspace-scope-selector')).toBeVisible({
      timeout: 15_000
    })
    await expect(third.page.getByTestId('simple-mode-nav')).toBeVisible()
    await expect(third.page.getByText(/Attached worktrees/i)).toHaveCount(0)
    await expect(third.page.getByRole('button', { name: /New worktree/i })).toHaveCount(0)
  } finally {
    for (const app of launched.reverse()) {
      try {
        await session.close(app)
      } catch {
        // best-effort cleanup
      }
    }
    await session.dispose()
  }
})

test('a launch with ANDES_INTERFACE_MODE=developer does not convert the stored preference (criterion 4)', async (// oxlint-disable-next-line no-empty-pattern -- Playwright's second fixture arg is testInfo; the first must be an object destructure to opt out of the default fixture set.
{}, testInfo) => {
  test.setTimeout(300_000)
  // One profile, two launches: the first opens the env door, the second does not.
  const session = createRestartSession(testInfo, {}, { interfaceModeEnvDoor: 'off' })
  const launched: ElectronApplication[] = []
  try {
    const doored = await session.launch({ extraEnv: { ANDES_INTERFACE_MODE: 'developer' } })
    launched.push(doored.app)
    await waitForSessionReady(doored.page)
    await expect.poll(() => readInterfaceMode(doored.page)).toBe('developer')
    // Any ordinary edit saves the whole settings object; the overlay must not ride along.
    await doored.page.evaluate(async () => {
      await window.__store?.getState().updateSettings({ theme: 'dark' })
    })
    await session.close(doored.app)
    launched.pop()

    const reopened = await session.launch()
    launched.push(reopened.app)
    await waitForSessionReady(reopened.page)
    await expect.poll(() => readInterfaceMode(reopened.page)).toBe('simple')
    await expect(reopened.page.getByTestId('simple-mode-nav')).toBeVisible()
  } finally {
    for (const app of launched.reverse()) {
      try {
        await session.close(app)
      } catch {
        // best-effort cleanup
      }
    }
    await session.dispose()
  }
})
