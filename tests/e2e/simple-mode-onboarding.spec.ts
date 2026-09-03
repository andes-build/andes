/**
 * Spec 002, criterion 8: first launch opens in simple mode without asking, and
 * no onboarding screen mentions worktrees, pull requests, or orchestration
 * while the mode is simple.
 */

import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'
import type { Page } from '@stablyai/playwright-test'
import type { GlobalSettings } from '../../src/shared/global-settings-types'

const BANNED_TEXT = /worktree|pull request|orchestration/i

function onboardingFooterButton(page: Page, name: RegExp) {
  return page
    .locator('footer')
    .filter({
      has: page.getByRole('button', { name: /Back|Continue|Add your first project|Set up|Skip/i })
    })
    .first()
    .getByRole('button', { name })
}

async function continueOnboarding(page: Page): Promise<void> {
  await onboardingFooterButton(page, /^(Continue|Add your first project)\b/).click()
}

async function getSettings(page: Page): Promise<GlobalSettings> {
  return page.evaluate(() => window.api.settings.get())
}

test.describe('First launch — simple mode', () => {
  // Criterion 7's fixture default is developer mode; this suite exercises the
  // real first-run default, so it opts back into simple mode explicitly.
  // --lang pins the UI to English regardless of the host OS locale, since
  // BANNED_TEXT and the assertions below match English copy.
  test.use({
    dismissOnboarding: false,
    launchEnv: { ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test.beforeEach(async ({ orcaPage }) => {
    // Per-test userData is freshly minted by the orcaPage fixture, so persisted
    // onboarding state defaults to `closedAt: null` and the overlay paints on
    // its own once App's bootstrap effect resolves (see onboarding.spec.ts).
    await waitForSessionReady(orcaPage)
  })

  test('opens in simple mode without asking', async ({ orcaPage }) => {
    await expect(orcaPage.getByRole('heading', { name: /Pick your default agent/i })).toBeVisible({
      timeout: 15_000
    })
    const settings = await getSettings(orcaPage)
    expect(settings.interfaceMode).toBe('simple')
  })

  test('never mentions worktrees, pull requests, or orchestration through the wizard', async ({
    orcaPage
  }) => {
    await expect(orcaPage.getByRole('heading', { name: /Pick your default agent/i })).toBeVisible({
      timeout: 15_000
    })
    await expect(orcaPage.getByText(BANNED_TEXT)).toHaveCount(0)

    await continueOnboarding(orcaPage)
    await expect(orcaPage.getByRole('heading', { name: /Make it feel like home/i })).toBeVisible()
    await expect(orcaPage.getByText(BANNED_TEXT)).toHaveCount(0)

    await continueOnboarding(orcaPage)
    const taskSourcesVisible = await orcaPage
      .getByRole('heading', { name: /Set up GitHub tasks/i })
      .waitFor({ state: 'visible', timeout: 1_000 })
      .then(() => true)
      .catch(() => false)
    if (taskSourcesVisible) {
      await expect(orcaPage.getByText(BANNED_TEXT)).toHaveCount(0)
      await continueOnboarding(orcaPage)
    }
    await expect(orcaPage.getByRole('heading', { name: /Set up notifications/i })).toBeVisible()
    await expect(orcaPage.getByText(BANNED_TEXT)).toHaveCount(0)
  })
})
