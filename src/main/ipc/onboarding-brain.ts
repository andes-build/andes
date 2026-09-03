import { ipcMain, app } from 'electron'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  hasExistingWorkspaces,
  prepareBrainStructure,
  resolveVendoredCorePath
} from '../onboarding/brain-preparation'
import { createFirstWorkspace } from '../onboarding/workspace-creation'
import type {
  OnboardingBrainCreateFolderResult,
  OnboardingBrainHasWorkspacesResult,
  OnboardingBrainPrepareResult,
  OnboardingBrainCreateWorkspaceResult
} from '../../shared/onboarding-brain-types'

const DEFAULT_BRAIN_PARENT_DIR_NAME = 'Andes'

function slugifyFolderName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.length > 0 ? slug : 'my-folder'
}

/** Picks a fresh `<Documents>/Andes/<slug>` path, adding `-2`, `-3`, ... on
 *  collision so "Crear una nueva" never silently reuses an existing folder. */
function resolveNewFolderPath(name: string): string {
  const parentDir = join(app.getPath('documents'), DEFAULT_BRAIN_PARENT_DIR_NAME)
  const slug = slugifyFolderName(name)
  let candidate = join(parentDir, slug)
  let attempt = 1
  while (existsSync(candidate)) {
    attempt += 1
    candidate = join(parentDir, `${slug}-${attempt}`)
  }
  return candidate
}

export function registerOnboardingBrainHandlers(): void {
  ipcMain.removeHandler('onboardingBrain:createFolder')
  ipcMain.removeHandler('onboardingBrain:prepare')
  ipcMain.removeHandler('onboardingBrain:hasWorkspaces')
  ipcMain.removeHandler('onboardingBrain:createWorkspace')

  ipcMain.handle(
    'onboardingBrain:createFolder',
    (_event, args: { name: string }): OnboardingBrainCreateFolderResult => {
      const path = resolveNewFolderPath(args?.name ?? '')
      mkdirSync(path, { recursive: true })
      return { path }
    }
  )

  ipcMain.handle(
    'onboardingBrain:prepare',
    async (_event, args: { brainPath: string }): Promise<OnboardingBrainPrepareResult> => {
      return prepareBrainStructure(args.brainPath, resolveVendoredCorePath())
    }
  )

  ipcMain.handle(
    'onboardingBrain:hasWorkspaces',
    (_event, args: { folderPath: string }): OnboardingBrainHasWorkspacesResult => {
      return { hasWorkspaces: hasExistingWorkspaces(args.folderPath) }
    }
  )

  ipcMain.handle(
    'onboardingBrain:createWorkspace',
    async (
      _event,
      args: { folderPath: string; name: string }
    ): Promise<OnboardingBrainCreateWorkspaceResult> => {
      return createFirstWorkspace(args.folderPath, resolveVendoredCorePath(), args.name)
    }
  )
}
