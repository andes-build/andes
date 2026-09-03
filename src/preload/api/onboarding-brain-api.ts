import type {
  OnboardingBrainCreateFolderResult,
  OnboardingBrainCreateWorkspaceResult,
  OnboardingBrainHasWorkspacesResult,
  OnboardingBrainPrepareResult
} from '../../shared/onboarding-brain-types'

export type OnboardingBrainApi = {
  createFolder: (args: { name: string }) => Promise<OnboardingBrainCreateFolderResult>
  prepare: (args: { brainPath: string }) => Promise<OnboardingBrainPrepareResult>
  hasWorkspaces: (args: { folderPath: string }) => Promise<OnboardingBrainHasWorkspacesResult>
  createWorkspace: (args: {
    folderPath: string
    name: string
  }) => Promise<OnboardingBrainCreateWorkspaceResult>
}
