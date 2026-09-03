/**
 * Step order for the simple-mode onboarding wizard (spec 005, criterion 1;
 * ajustado el 2026-09-03, 📌 Peter: se separan "folder"/"install" y se suma
 * "workspace").
 * Developer mode keeps Orca's own steps unchanged
 * (`src/renderer/src/components/onboarding/use-onboarding-flow-types.ts`) —
 * this is a wholly separate list, never derived from that one.
 */
export type SimpleOnboardingStepId =
  | 'welcome'
  | 'agent'
  | 'session'
  | 'folder'
  | 'install'
  | 'workspace'
  | 'skills'
  | 'notifications'
  | 'star'

export const SIMPLE_ONBOARDING_STEPS: readonly SimpleOnboardingStepId[] = [
  'welcome',
  'agent',
  'session',
  'folder',
  'install',
  'workspace',
  'skills',
  'notifications',
  'star'
]
