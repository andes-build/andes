/**
 * Spec 005: the simple-mode onboarding wizard has exactly nine steps —
 * welcome, agent, session, folder, install, workspace, skills,
 * notifications, star — and none of them mentions developer-mode jargon or
 * "brain"/"vault" (criteria 1 and 10; ajuste del 2026-09-03, 📌 Peter, agregó
 * folder/install split + the new workspace step + the word ban). Supersedes
 * the spec 002 version of this file, which asserted Orca's developer-mode
 * step headings ("Pick your default agent", etc.) as the simple-mode
 * experience; spec 005 replaces that wizard entirely for simple mode.
 */

import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'
import type { Page } from '@stablyai/playwright-test'
import type { GlobalSettings } from '../../src/shared/global-settings-types'

const BANNED_TEXT =
  /AI First OS|worktree|pull request|orchestration|\bgit\b|\bterminal\b|\bCLI\b|\bbrain\b|\bvault\b/i

function onboardingModal(page: Page) {
  return page.locator('[data-onboarding-modal][data-onboarding-mode="simple"]')
}

async function continueOnboarding(page: Page): Promise<void> {
  await onboardingModal(page)
    .getByRole('button', { name: /^(Continue|Finish)$/ })
    .click()
}

async function getSettings(page: Page): Promise<GlobalSettings> {
  return page.evaluate(() => window.api.settings.get())
}

/** Drives "folder" (create a new one) through to "install" finishing —
 *  install has no visible button, it runs and auto-advances on its own.
 *  Returns the chosen folder's absolute path. */
async function createFolderAndWaitForInstall(page: Page, folderName: string): Promise<string> {
  const modal = onboardingModal(page)
  await modal.getByRole('button', { name: 'Create a new one' }).click()
  await modal.getByPlaceholder('Folder name').fill(folderName)
  await modal.getByRole('button', { name: 'Create' }).click()
  const pathLocator = modal.getByText(new RegExp(folderName))
  await expect(pathLocator).toBeVisible({ timeout: 15_000 })
  const folderPath = (await pathLocator.textContent()) ?? ''
  await continueOnboarding(page) // folder -> install
  await expect(modal.getByRole('heading', { name: 'Your first workspace' })).toBeVisible({
    timeout: 15_000
  })
  return folderPath.trim()
}

test.describe('Simple-mode onboarding (spec 005)', () => {
  // --lang pins the UI to English regardless of the host OS locale, since
  // BANNED_TEXT and the heading assertions below match English copy.
  test.use({
    dismissOnboarding: false,
    launchEnv: { ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test.beforeEach(async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
  })

  test('opens in simple mode on the welcome step, without asking', async ({ orcaPage }) => {
    await expect(orcaPage.getByRole('heading', { name: 'Welcome to Andes' })).toBeVisible({
      timeout: 15_000
    })
    const settings = await getSettings(orcaPage)
    expect(settings.interfaceMode).toBe('simple')
  })

  test('walks all nine step headings, in order, with no developer jargon', async ({ orcaPage }) => {
    const modal = onboardingModal(orcaPage)

    await expect(modal.getByRole('heading', { name: 'Welcome to Andes' })).toBeVisible({
      timeout: 15_000
    })
    await expect(modal.getByText(BANNED_TEXT)).toHaveCount(0)
    await continueOnboarding(orcaPage)

    await expect(modal.getByRole('heading', { name: 'Your agent' })).toBeVisible()
    await expect(modal.getByText(BANNED_TEXT)).toHaveCount(0)
    await continueOnboarding(orcaPage)

    await expect(modal.getByRole('heading', { name: 'Your session' })).toBeVisible()
    await expect(modal.getByText(BANNED_TEXT)).toHaveCount(0)
    await continueOnboarding(orcaPage)

    await expect(
      modal.getByRole('heading', { name: 'Where does Andes keep your work?' })
    ).toBeVisible()
    await expect(modal.getByText(BANNED_TEXT)).toHaveCount(0)
    const folderPath = await createFolderAndWaitForInstall(orcaPage, 'spec-005-e2e-walk')
    // "install" ran and auto-advanced past itself while getting to "workspace".
    await expect(modal.getByText(BANNED_TEXT)).toHaveCount(0)

    // Why no intermediate assertion: creating the workspace advances straight
    // to "Skills" (WorkspaceStep calls onDone() right after success).
    await modal.getByPlaceholder('Workspace name').fill('First Workspace')
    await modal.getByRole('button', { name: 'Create' }).click()

    await expect(modal.getByRole('heading', { name: 'Skills' })).toBeVisible({ timeout: 15_000 })
    const hasWorkspaces = await orcaPage.evaluate(
      async (path) =>
        (await window.api.onboardingBrain.hasWorkspaces({ folderPath: path })).hasWorkspaces,
      folderPath
    )
    expect(hasWorkspaces).toBe(true)
    await expect(modal.getByText(BANNED_TEXT)).toHaveCount(0)
    await continueOnboarding(orcaPage)

    await expect(modal.getByRole('heading', { name: 'Set up notifications' })).toBeVisible()
    await expect(modal.getByText(BANNED_TEXT)).toHaveCount(0)
    await continueOnboarding(orcaPage)

    await expect(modal.getByRole('heading', { name: 'One last thing' })).toBeVisible()
    await expect(modal.getByText(BANNED_TEXT)).toHaveCount(0)
  })

  test('finishing closes onboarding onto the active project, not the Add Project modal', async ({
    orcaPage
  }) => {
    const modal = onboardingModal(orcaPage)
    await expect(modal.getByRole('heading', { name: 'Welcome to Andes' })).toBeVisible({
      timeout: 15_000
    })
    await continueOnboarding(orcaPage) // welcome -> agent
    await continueOnboarding(orcaPage) // agent -> session
    await continueOnboarding(orcaPage) // session -> folder
    await createFolderAndWaitForInstall(orcaPage, 'spec-005-e2e-finish')
    await modal.getByRole('button', { name: 'Later' }).click() // skip workspace naming
    await expect(modal.getByRole('heading', { name: 'Skills' })).toBeVisible({ timeout: 15_000 })
    await continueOnboarding(orcaPage) // skills -> notifications
    await continueOnboarding(orcaPage) // notifications -> star
    await expect(modal.getByRole('heading', { name: 'One last thing' })).toBeVisible()
    await orcaPage.getByRole('button', { name: 'Not now' }).click()

    await expect(onboardingModal(orcaPage)).toHaveCount(0)
    await expect(orcaPage.getByRole('dialog', { name: /Add Project/i })).toHaveCount(0)
  })
})
