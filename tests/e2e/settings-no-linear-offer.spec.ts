import type { Page } from '@stablyai/playwright-test'
import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'

// Spec 004: Linear is not offered anywhere in Settings — no nav section, no
// Integrations card, no Task Sources provider — even though the underlying
// Linear connection status (src/main/linear) still exists for anyone already
// linked to an issue elsewhere in the app.
async function openSettings(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__store!.getState().openSettingsPage()
  })
  await expect
    .poll(async () => page.evaluate(() => window.__store?.getState().activeView), {
      timeout: 10_000
    })
    .toBe('settings')
}

test('never offers Linear across Settings', async ({ orcaPage }) => {
  await waitForSessionReady(orcaPage)
  await openSettings(orcaPage)

  await expect(orcaPage.getByText(/linear/i)).toHaveCount(0)

  for (const paneId of ['integrations', 'tasks']) {
    await orcaPage.evaluate((id) => {
      window.__store!.getState().openSettingsTarget({ pane: id, repoId: null })
    }, paneId)
    await expect(orcaPage.getByText(/linear/i)).toHaveCount(0)
  }
})
