/**
 * Spec 009: the Command Center is Andes's own home screen for simple mode —
 * the core's startup scan for the active workspace, shown as its four fixed
 * sections, with a single suggested action above them and buttons that open
 * a thread with a real first message. Covers criteria 1, 2, 3, 4, 6, 7, 9.
 */

import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Page } from '@stablyai/playwright-test'
import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'

test.use({
  dismissOnboarding: true,
  seedTestRepo: false,
  launchEnv: { ANDES_INTERFACE_MODE: 'simple' },
  orcaAppExtraArgs: ['--lang=en-US']
})

const tempDirs: string[] = []

function makeTempBrainDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'andes-command-center-e2e-'))
  tempDirs.push(dir)
  return dir
}

test.afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true })
  }
})

/** Mirrors `FolderStep.tsx`'s "Elegir carpeta" activation exactly — the
 *  real, existing folder-workspace machinery, never the "Add Project" modal. */
async function activateFolderAsWorkspace(
  page: Page,
  folderPath: string,
  name: string
): Promise<string> {
  return page.evaluate(
    async ({ folderPath, name }) => {
      const store = window.__store!.getState()
      const group = await store.createProjectGroup(name)
      if (!group) {
        throw new Error('could not create project group')
      }
      const workspace = await store.createFolderWorkspace({
        projectGroupId: group.id,
        name,
        folderPath
      })
      if (!workspace) {
        throw new Error('could not create folder workspace')
      }
      store.setActiveFolderWorkspace(workspace.id)
      store.setActiveView('terminal')
      return workspace.id as string
    },
    { folderPath, name }
  )
}

async function prepareBrain(page: Page, brainPath: string): Promise<void> {
  await page.evaluate(async (brainPath) => {
    await window.api.onboardingBrain.prepare({ brainPath })
  }, brainPath)
}

test.describe('Command Center — simple mode (spec 009)', () => {
  test('replaces the empty state for a prepared folder with no thread yet', async ({
    orcaPage
  }) => {
    await waitForSessionReady(orcaPage)
    const brainPath = makeTempBrainDir()
    await prepareBrain(orcaPage, brainPath)
    await activateFolderAsWorkspace(orcaPage, brainPath, 'Empty Folder')

    await expect(orcaPage.getByRole('heading', { name: 'Command Center' })).toBeVisible({
      timeout: 15_000
    })
    await expect(orcaPage.getByText('Add a project')).toHaveCount(0)
  })

  test('shows the real scan content in its four cards', async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    const brainPath = makeTempBrainDir()
    await prepareBrain(orcaPage, brainPath)
    await orcaPage.evaluate(async (brainPath) => {
      await window.api.onboardingBrain.createWorkspace({
        folderPath: brainPath,
        name: 'Tandem Pay'
      })
    }, brainPath)
    mkdirSync(join(brainPath, 'workspaces', 'tandem-pay', 'initiatives'), { recursive: true })
    writeFileSync(
      join(brainPath, 'workspaces', 'tandem-pay', 'initiatives', 'migracion-kyc.md'),
      [
        '---',
        'status: blocked',
        'owner: Test Owner',
        'horizon: now',
        'waiting_on: operador',
        '---',
        '',
        '# Migration'
      ].join('\n')
    )
    await activateFolderAsWorkspace(orcaPage, brainPath, 'Tandem Pay')

    await expect(orcaPage.getByText('migracion-kyc')).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByText('waiting on you')).toBeVisible()
    await expect(orcaPage.locator('[data-command-center-card="queue"]')).toBeVisible()
    await expect(orcaPage.locator('[data-command-center-card="checks"]')).toBeVisible()
  })

  test('resolving a waiting item opens a thread whose first message names it', async ({
    orcaPage
  }) => {
    await waitForSessionReady(orcaPage)
    const brainPath = makeTempBrainDir()
    await prepareBrain(orcaPage, brainPath)
    await orcaPage.evaluate(async (brainPath) => {
      await window.api.onboardingBrain.createWorkspace({
        folderPath: brainPath,
        name: 'Resolve Co'
      })
    }, brainPath)
    const initiativesDir = join(brainPath, 'workspaces', 'resolve-co', 'initiatives')
    mkdirSync(initiativesDir, { recursive: true })
    writeFileSync(
      join(initiativesDir, 'contrato-marco.md'),
      [
        '---',
        'status: active',
        'horizon: now',
        'waiting_on: operador',
        '---',
        '',
        '# Contract'
      ].join('\n')
    )
    const workspaceId = await activateFolderAsWorkspace(orcaPage, brainPath, 'Resolve Co')

    await expect(orcaPage.getByText('contrato-marco')).toBeVisible({ timeout: 15_000 })

    // Fake a detected, launchable agent so the click exercises the real
    // launch path (launchAgentInNewTab) without depending on a real CLI
    // being installed on the machine running this suite.
    const fakeAgentScript = join(brainPath, process.platform === 'win32' ? 'claude.cmd' : 'claude')
    writeFileSync(
      fakeAgentScript,
      process.platform === 'win32'
        ? '@echo off\r\nping -n 30 127.0.0.1 >nul\r\n'
        : '#!/usr/bin/env sh\nsleep 30\n'
    )
    if (process.platform !== 'win32') {
      chmodSync(fakeAgentScript, 0o755)
    }
    await orcaPage.evaluate(
      async ({ workspaceId, fakeAgentScript }) => {
        const store = window.__store!.getState()
        store.ensureDetectedAgents = async () => ['claude']
        await store.updateSettings({
          defaultTuiAgent: 'claude',
          agentCmdOverrides: { claude: `"${fakeAgentScript}"` }
        })
        void workspaceId
      },
      { workspaceId, fakeAgentScript }
    )

    await orcaPage.getByRole('button', { name: 'Resolve' }).click()

    await expect
      .poll(
        async () =>
          orcaPage.evaluate(
            (workspaceId) => (window.__store!.getState().tabsByWorktree[workspaceId] ?? []).length,
            workspaceId
          ),
        { timeout: 15_000, message: 'expected a new tab after Resolve' }
      )
      .toBeGreaterThan(0)

    const queuedText = await orcaPage.evaluate((workspaceId) => {
      const state = window.__store!.getState()
      const tabId = (state.tabsByWorktree[workspaceId] ?? [])[0]?.id
      if (!tabId) {
        return ''
      }
      return (
        state.pendingStartupByTabId[tabId]?.command ??
        state.nativeChatLaunchPromptByTabId[tabId]?.text ??
        state.nativeChatLaunchDraftByTabId[tabId]?.text ??
        ''
      )
    }, workspaceId)
    expect(queuedText).toContain('contrato-marco')
  })

  test('an unprepared folder shows its own message with a way to prepare it', async ({
    orcaPage
  }) => {
    await waitForSessionReady(orcaPage)
    const folderPath = makeTempBrainDir()
    await activateFolderAsWorkspace(orcaPage, folderPath, 'Not Prepared')

    await expect(orcaPage.getByText("This folder isn't set up yet")).toBeVisible({
      timeout: 15_000
    })
    await expect(orcaPage.getByRole('button', { name: 'Prepare this folder' })).toBeVisible()
  })
})

test.describe('Command Center — developer mode stays unchanged (spec 009, criterion 9)', () => {
  test.use({ launchEnv: { ANDES_INTERFACE_MODE: 'developer' } })

  test('shows the Orca empty state, never the Command Center, with no active project', async ({
    orcaPage
  }) => {
    await waitForSessionReady(orcaPage)
    await expect(orcaPage.getByText('Add Project')).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByRole('heading', { name: 'Command Center' })).toHaveCount(0)
  })
})
