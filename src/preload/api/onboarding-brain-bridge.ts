import { ipcRenderer } from 'electron'
import type {
  OnboardingBrainCreateFolderResult,
  OnboardingBrainCreateWorkspaceResult,
  OnboardingBrainHasWorkspacesResult,
  OnboardingBrainPrepareResult
} from '../../shared/onboarding-brain-types'
import type { PreloadApi } from '../api-types'

export const onboardingBrainApi = {
  createFolder: (args: { name: string }): Promise<OnboardingBrainCreateFolderResult> =>
    ipcRenderer.invoke('onboardingBrain:createFolder', args),
  prepare: (args: { brainPath: string }): Promise<OnboardingBrainPrepareResult> =>
    ipcRenderer.invoke('onboardingBrain:prepare', args),
  hasWorkspaces: (args: { folderPath: string }): Promise<OnboardingBrainHasWorkspacesResult> =>
    ipcRenderer.invoke('onboardingBrain:hasWorkspaces', args),
  createWorkspace: (args: {
    folderPath: string
    name: string
  }): Promise<OnboardingBrainCreateWorkspaceResult> =>
    ipcRenderer.invoke('onboardingBrain:createWorkspace', args)
} satisfies PreloadApi['onboardingBrain']
