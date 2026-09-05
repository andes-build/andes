/**
 * Spec 024: the Files screen edits markdown with Obsidian's experience —
 * writing on the formatted text, saving by itself, and no save button
 * (criteria 1, 3, 4) — plus developer mode untouched (criterion 8).
 *
 * Writes real files into the seeded e2e temp repo, never into anyone's own
 * folder: `TEST_REPO_PATH_FILE` points at an `os.tmpdir()` fixture.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'
import { TEST_REPO_PATH_FILE } from './global-setup'

function repoPath(): string {
  return readFileSync(TEST_REPO_PATH_FILE, 'utf-8').trim()
}

const EDITED_FILE_RELATIVE_PATH = path.join('workspaces', 'editable', 'decisions.md')

function seedEditableWorkspace(): void {
  const editableDir = path.join(repoPath(), 'workspaces', 'editable')
  if (!existsSync(editableDir)) {
    mkdirSync(editableDir, { recursive: true })
  }
  writeFileSync(path.join(editableDir, 'README.md'), '# Editable\n\nWhat it is.\n')
  writeFileSync(path.join(editableDir, 'decisions.md'), '# Decisions\n\nAs it was on disk.\n')
}

function fileOnDisk(): string {
  return readFileSync(path.join(repoPath(), EDITED_FILE_RELATIVE_PATH), 'utf-8')
}

test.describe('Simple mode — editing a document in Files', () => {
  test.use({
    launchEnv: { ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test.beforeAll(() => {
    seedEditableWorkspace()
  })

  test.beforeEach(async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    await orcaPage.getByTestId('workspace-scope-selector').click()
    await orcaPage.getByTestId('workspace-scope-option-editable').click()
    await orcaPage.getByTestId('simple-mode-nav-files').click()
    await expect(orcaPage.getByTestId('workspace-file-tree')).toBeVisible({ timeout: 10_000 })
  })

  test('a document opens for writing and what is typed is saved by itself (criteria 1, 3)', async ({
    orcaPage
  }) => {
    seedEditableWorkspace()
    await orcaPage.getByTestId('workspace-file-tree').getByText('Decisions').click()

    const editor = orcaPage.getByTestId('workspace-file-editor').locator('.ProseMirror')
    await expect(editor).toBeVisible({ timeout: 10_000 })
    // The document is shown formatted, not as markdown source (criterion 2).
    await expect(editor.locator('h1')).toHaveText('Decisions')
    await expect(editor).not.toContainText('# Decisions')

    await editor.click()
    await orcaPage.keyboard.press('End')
    await orcaPage.keyboard.type(' Typed by the e2e run.')

    // Nothing is pressed to save it: the screen says it saves itself.
    await expect(orcaPage.getByTestId('workspace-file-save-status')).toHaveText(/Saved/, {
      timeout: 10_000
    })
    await expect.poll(() => fileOnDisk(), { timeout: 10_000 }).toContain('Typed by the e2e run.')

    // Closing the document and reopening it shows what the disk now has.
    await orcaPage.getByTestId('workspace-file-tree').getByText('What this is').click()
    await orcaPage.getByTestId('workspace-file-tree').getByText('Decisions').click()
    await expect(orcaPage.getByTestId('workspace-file-editor')).toContainText(
      'Typed by the e2e run.',
      { timeout: 10_000 }
    )
  })

  test('the screen has no save button and no editor tabs (criteria 3, 4)', async ({ orcaPage }) => {
    await orcaPage.getByTestId('workspace-file-tree').getByText('Decisions').click()
    await expect(orcaPage.getByTestId('workspace-file-editor')).toBeVisible({ timeout: 10_000 })

    await expect(orcaPage.getByRole('button', { name: /^save/i })).toHaveCount(0)
    await expect(orcaPage.getByTestId('workspace-file-editor').getByRole('tab')).toHaveCount(0)
  })
})

test.describe('Developer mode — untouched by the Files editor (criterion 8)', () => {
  test.use({
    launchEnv: { ANDES_INTERFACE_MODE: 'developer' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test.beforeAll(() => {
    seedEditableWorkspace()
  })

  test.beforeEach(async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
  })

  test('developer mode still shows its own shell, not the Files screen', async ({ orcaPage }) => {
    await expect(orcaPage.getByTestId('simple-mode-nav')).toHaveCount(0)
    await expect(orcaPage.getByTestId('workspace-file-editor')).toHaveCount(0)
  })
})
