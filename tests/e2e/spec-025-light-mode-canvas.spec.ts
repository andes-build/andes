/**
 * Spec 025: functional check (criterion 8). Walks the conversation, Command
 * Center and Files screens in simple mode and screenshots each one in light
 * and dark mode, into docs/research so the evidence lives with the spec.
 * Uses the golden stub agent (spec 011's pattern) so the conversation has a
 * real thread on screen without spending Claude credit.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from './helpers/orca-app'
import { waitForActiveWorktree, waitForSessionReady } from './helpers/store'
import { TEST_REPO_PATH_FILE } from './global-setup'
import { configureGoldenStubAgent, getGoldenStubAgentLaunchEnv } from './helpers/golden-stub-agent'

const SHOT_DIR = path.join(
  process.cwd(),
  'docs',
  'research',
  '2026-09-04-chequeo-funcional-spec-025'
)

function seedWorkspace(): void {
  const repoPath = readFileSync(TEST_REPO_PATH_FILE, 'utf-8').trim()
  const workspaceDir = path.join(repoPath, 'workspaces', 'tandem-pay')
  if (existsSync(workspaceDir)) {
    return
  }
  mkdirSync(workspaceDir, { recursive: true })
  writeFileSync(path.join(workspaceDir, 'README.md'), '# Tandem Pay\n\nWhat it is.\n')
}

test.describe('spec025 — el modo claro no es blanco y negro (chequeo funcional)', () => {
  test.use({
    launchEnv: { ...getGoldenStubAgentLaunchEnv(), ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true })
    seedWorkspace()
  })

  test.beforeEach(async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)
    await configureGoldenStubAgent(orcaPage, { agent: 'claude' })
  })

  test('spec025#8 conversación, Command Center y archivos en claro y en oscuro', async ({
    orcaPage
  }) => {
    // Force each theme explicitly — don't rely on the host's system setting.
    async function setTheme(theme: 'light' | 'dark'): Promise<void> {
      await orcaPage.evaluate(async (theme) => {
        await window.__store!.getState().updateSettingsOrThrow({ theme })
      }, theme)
      await expect
        .poll(() => orcaPage.evaluate(() => document.documentElement.classList.contains('dark')))
        .toBe(theme === 'dark')
    }

    async function backgroundOf(selector: string): Promise<string> {
      return orcaPage.evaluate(
        (sel) => getComputedStyle(document.querySelector(sel)!).backgroundColor,
        selector
      )
    }

    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()
    await expect(orcaPage.getByTestId('thread-header-title')).toBeVisible({ timeout: 15_000 })

    // --- Light mode ---
    await setTheme('light')
    const lightAppBg = await backgroundOf('body')
    await orcaPage.screenshot({ path: path.join(SHOT_DIR, '01-conversacion-claro.png') })

    await orcaPage.getByTestId('simple-mode-nav-command-center').click()
    await expect(orcaPage.getByTestId('command-center')).toBeVisible({ timeout: 10_000 })
    await orcaPage.screenshot({ path: path.join(SHOT_DIR, '02-command-center-claro.png') })

    await orcaPage.getByTestId('simple-mode-nav-files').click()
    await orcaPage.waitForTimeout(300)
    await orcaPage.screenshot({ path: path.join(SHOT_DIR, '03-archivos-claro.png') })

    // --- Dark mode ---
    await setTheme('dark')
    const darkAppBg = await backgroundOf('body')
    await orcaPage.screenshot({ path: path.join(SHOT_DIR, '04-archivos-oscuro.png') })

    await orcaPage.getByTestId('simple-mode-nav-command-center').click()
    await expect(orcaPage.getByTestId('command-center')).toBeVisible({ timeout: 10_000 })
    await orcaPage.screenshot({ path: path.join(SHOT_DIR, '05-command-center-oscuro.png') })

    await orcaPage.getByTestId('simple-mode-nav-new-thread').click()
    await orcaPage.waitForTimeout(300)
    await orcaPage.screenshot({ path: path.join(SHOT_DIR, '06-conversacion-oscuro.png') })

    // The light canvas actually rendered is not pure white, and dark mode is
    // still the near-black it always was — the two themes render differently.
    expect(lightAppBg).not.toBe('rgb(255, 255, 255)')
    expect(darkAppBg).toBe('rgb(10, 10, 10)')
    expect(lightAppBg).not.toBe(darkAppBg)
  })
})
