/**
 * Spec 009: the Command Center is Andes's own home screen for simple mode —
 * the core's startup scan for the scope chosen in the sidebar selector, shown
 * as its four fixed sections, with a single suggested action above them and
 * buttons that open a *thread* with a real first message.
 *
 * Covers criteria 1, 2, 3, 4, 6, 7, 9.
 *
 * Criterion 6 was written before the thread existed ("a session of the ones
 * Orca already has, until the thread exists"). The thread landed in `main`
 * with specs 011/015/016/019, so these evals hold the buttons to the thread:
 * the first message carries the scope statement *and* what was clicked. The
 * launch command is captured the instant it is queued — the same technique
 * spec 019's eval uses, because the fresh tab's mount clears it.
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Page } from '@stablyai/playwright-test'
import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'
import { configureGoldenStubAgent, getGoldenStubAgentLaunchEnv } from './helpers/golden-stub-agent'

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

/** Mirrors `FolderStep.tsx`'s folder activation exactly — the real, existing
 *  folder-workspace machinery, never the "Add Project" modal. */
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

async function createWorkspace(page: Page, brainPath: string, name: string): Promise<void> {
  await page.evaluate(
    async ({ brainPath, name }) => {
      await window.api.onboardingBrain.createWorkspace({ folderPath: brainPath, name })
    },
    { brainPath, name }
  )
}

/**
 * Writes the brain's `tree.md` — the file that tells any scan which paths to
 * walk. Andes's own folder preparation does not write it (the core writes it
 * from `bootstrap`, which Andes's onboarding does not run), so without this
 * line every scan here answers "missing tree.md" and reads zero nodes. That
 * gap belongs to onboarding, not to this screen — see `decisions.md`,
 * spec 009, 2026-09-04.
 */
function seedTree(brainPath: string): void {
  const template = readFileSync(
    join(process.cwd(), 'vendor', 'ai-first-os-core', 'core', 'templates', 'tree.md'),
    'utf-8'
  )
  writeFileSync(join(brainPath, 'tree.md'), template.replace('{{MANUAL}}', 'HOW-IT-WORKS.md'))
}

/** Writes one initiative that the core's scan reports as waiting on the
 *  operator — the row every button-related criterion needs on screen. An
 *  initiative is a directory with a `README.md` inside it: that is the shape
 *  the `initiatives` glob of `tree.md` reaches. */
function seedWaitingInitiative(brainPath: string, slug: string, name: string): void {
  const initiativeDir = join(brainPath, 'workspaces', slug, 'initiatives', name)
  mkdirSync(initiativeDir, { recursive: true })
  writeFileSync(
    join(initiativeDir, 'README.md'),
    ['---', 'status: active', 'horizon: now', 'waiting_on: operador', '---', '', `# ${name}`].join(
      '\n'
    )
  )
}

/** The launch command is queued synchronously and cleared once the new tab's
 *  TerminalPane mounts, so a poll-after-click can lose the race. Subscribing
 *  before the click catches it either way (spec 019's eval does the same). */
async function captureNextQueuedStartupCommand(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __spec009CapturedCommand?: string | null }
    w.__spec009CapturedCommand = null
    window.__store!.subscribe((state) => {
      if (w.__spec009CapturedCommand !== null) {
        return
      }
      const entry = Object.values(state.pendingStartupByTabId ?? {})[0] as
        | { command?: string }
        | undefined
      if (entry?.command) {
        w.__spec009CapturedCommand = entry.command
      }
    })
  })
}

async function readCapturedStartupCommand(page: Page): Promise<string> {
  return page.evaluate(() => {
    const w = window as unknown as { __spec009CapturedCommand?: string | null }
    return w.__spec009CapturedCommand ?? ''
  })
}

test.describe('Command Center — simple mode (spec 009)', () => {
  test.use({
    dismissOnboarding: true,
    seedTestRepo: false,
    launchEnv: { ...getGoldenStubAgentLaunchEnv(), ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test('spec009#1 replaces the empty state for a prepared folder with no thread yet', async ({
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

  test('spec009#2 scans the scope the selector has, and rescans when it changes', async ({
    orcaPage
  }) => {
    await waitForSessionReady(orcaPage)
    const brainPath = makeTempBrainDir()
    await prepareBrain(orcaPage, brainPath)
    await createWorkspace(orcaPage, brainPath, 'Tandem Pay')
    seedTree(brainPath)
    seedWaitingInitiative(brainPath, 'tandem-pay', 'migracion-kyc')
    await activateFolderAsWorkspace(orcaPage, brainPath, 'Tandem Pay')

    // The default scope is the root, and the root of this brain holds no
    // initiative: nothing from the workspace is on screen.
    await expect(orcaPage.locator('[data-command-center-card="waiting"]')).toBeVisible({
      timeout: 15_000
    })
    await expect(orcaPage.getByText('migracion-kyc')).toHaveCount(0)

    await orcaPage.getByTestId('workspace-scope-selector').click()
    await orcaPage.getByTestId('workspace-scope-option-tandem-pay').click()

    // Changing the selector rescans, and the workspace's own initiative appears.
    await expect(orcaPage.getByText('migracion-kyc').first()).toBeVisible({ timeout: 15_000 })
  })

  test('spec009#3 #4 shows the four sections, with Waiting first and primary', async ({
    orcaPage
  }) => {
    await waitForSessionReady(orcaPage)
    const brainPath = makeTempBrainDir()
    await prepareBrain(orcaPage, brainPath)
    await createWorkspace(orcaPage, brainPath, 'Tandem Pay')
    seedTree(brainPath)
    seedWaitingInitiative(brainPath, 'tandem-pay', 'migracion-kyc')
    await activateFolderAsWorkspace(orcaPage, brainPath, 'Tandem Pay')
    await orcaPage.getByTestId('workspace-scope-selector').click()
    await orcaPage.getByTestId('workspace-scope-option-tandem-pay').click()

    await expect(orcaPage.getByText('migracion-kyc').first()).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByText('waiting on you').first()).toBeVisible()
    await expect(orcaPage.locator('[data-command-center-card="waiting"]')).toBeVisible()
    await expect(orcaPage.locator('[data-command-center-card="in-progress"]')).toBeVisible()
    await expect(orcaPage.locator('[data-command-center-card="queue"]')).toBeVisible()
    await expect(orcaPage.locator('[data-command-center-card="checks"]')).toBeVisible()

    // Criterion 3: primary card, and it comes before the other three.
    await expect(
      orcaPage.locator(
        '[data-command-center-card="waiting"][data-command-center-card-size="primary"]'
      )
    ).toBeVisible()
    const order = await orcaPage.evaluate(() =>
      Array.from(document.querySelectorAll('[data-command-center-card]')).map(
        (node) => node.getAttribute('data-command-center-card') ?? ''
      )
    )
    expect(order[0]).toBe('waiting')
  })

  test('spec009#6 Resolve opens a thread whose first message names the item and the scope', async ({
    orcaPage
  }) => {
    await waitForSessionReady(orcaPage)
    await configureGoldenStubAgent(orcaPage, { agent: 'claude' })
    const brainPath = makeTempBrainDir()
    await prepareBrain(orcaPage, brainPath)
    await createWorkspace(orcaPage, brainPath, 'Contracts Co')
    seedTree(brainPath)
    seedWaitingInitiative(brainPath, 'contracts-co', 'contrato-marco')
    await activateFolderAsWorkspace(orcaPage, brainPath, 'Contracts Co')
    await orcaPage.getByTestId('workspace-scope-selector').click()
    await orcaPage.getByTestId('workspace-scope-option-contracts-co').click()

    await expect(orcaPage.getByText('contrato-marco').first()).toBeVisible({ timeout: 15_000 })
    await captureNextQueuedStartupCommand(orcaPage)

    // Scoped to the card on purpose: an unscoped "Resolve" also matches the
    // sidebar's workspace button by substring.
    await orcaPage
      .locator('[data-command-center-card="waiting"]')
      .getByRole('button', { name: 'Resolve', exact: true })
      .click()

    await expect.poll(() => readCapturedStartupCommand(orcaPage)).toContain('contrato-marco')
    const command = await readCapturedStartupCommand(orcaPage)
    // The thread, not a raw session: the scope statement spec 019 stamps on
    // every thread rides in front of what was clicked.
    expect(command).toContain('scope is already chosen')
    expect(command).toContain('--workspace contracts-co')

    // And it really is a thread: the tab carries the scope badge.
    await expect(orcaPage.getByTestId('thread-scope-badge')).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByTestId('thread-scope-badge')).toContainText('Contracts Co')
  })

  test('spec009#7 an unprepared folder shows its own message with a way to prepare it', async ({
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
  test.use({
    dismissOnboarding: true,
    seedTestRepo: false,
    launchEnv: { ANDES_INTERFACE_MODE: 'developer' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test('spec009#9 shows the Orca empty state, never the Command Center', async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    await expect(orcaPage.getByText('Add Project')).toBeVisible({ timeout: 15_000 })
    await expect(orcaPage.getByRole('heading', { name: 'Command Center' })).toHaveCount(0)
  })
})
