/**
 * Spec 005, criterion 12: "Repeat the initial setup" in Settings -> General
 * clears `closedAt` and reopens the onboarding wizard.
 */

import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'

async function openGeneralSettings(page: Parameters<typeof waitForSessionReady>[0]): Promise<void> {
  await page.evaluate(() => {
    const state = window.__store!.getState()
    state.openSettingsTarget({ pane: 'general', repoId: null })
    state.openSettingsPage()
  })
  await expect(page.getByPlaceholder('Search settings')).toBeVisible({ timeout: 10_000 })
}

test.describe('Repeat the initial setup (spec 005)', () => {
  test.use({ orcaAppExtraArgs: ['--lang=en-US'] })

  test.beforeEach(async ({ orcaPage }) => {
    // Default fixture behavior dismisses onboarding on startup, so the app
    // opens straight to the main view here.
    await waitForSessionReady(orcaPage)
  })

  test('reopens onboarding from Settings -> General', async ({ orcaPage }) => {
    await expect(orcaPage.locator('[data-onboarding-modal]')).toHaveCount(0)

    await openGeneralSettings(orcaPage)
    await orcaPage.getByRole('button', { name: 'Repeat setup' }).click()

    await expect(orcaPage.locator('[data-onboarding-modal]')).toBeVisible({ timeout: 10_000 })
    const onboarding = await orcaPage.evaluate(() => window.api.onboarding.get())
    expect(onboarding.closedAt).toBeNull()
  })
})
