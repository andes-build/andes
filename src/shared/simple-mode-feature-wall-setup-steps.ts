/**
 * Settings checklist items for simple mode (spec 005, criterion 11) — a
 * wholly separate, shorter list from Orca's own `FEATURE_WALL_SETUP_STEPS`
 * (`feature-wall-setup-steps.ts`), which developer mode keeps unchanged.
 * "folder", never "brain" (ajuste del 2026-09-03, 📌 Peter).
 */
export type SimpleModeSetupStepId =
  | 'agent'
  | 'session'
  | 'folder'
  | 'skills'
  | 'notifications'
  | 'star'

export type SimpleModeSetupStep = {
  readonly id: SimpleModeSetupStepId
  readonly name: string
}

export const SIMPLE_MODE_SETUP_STEPS: readonly SimpleModeSetupStep[] = [
  { id: 'agent', name: 'Agent' },
  { id: 'session', name: 'Session' },
  { id: 'folder', name: 'Folder' },
  { id: 'skills', name: 'Skills' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'star', name: 'Star' }
]

export const SIMPLE_MODE_SETUP_STEP_IDS: readonly SimpleModeSetupStepId[] =
  SIMPLE_MODE_SETUP_STEPS.map((step) => step.id)
