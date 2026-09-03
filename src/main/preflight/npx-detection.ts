/**
 * `npx` detection for the onboarding Skills step (spec 005, criterion 6).
 * Reuses the exact PATH-rehydration mechanism agent detection already uses
 * (`hydrateShellPathForAgentDetection`) instead of adding a second one.
 */
import { hydrateShellPathForAgentDetection } from '../ipc/agent-detection-shell-path'
import { isCommandOnPath } from '../ipc/preflight-command-exec'
import type { PreflightRuntimeContext } from '../ipc/preflight-runtime-target'

export async function detectNpxAvailabilityWithShellPathHydration(
  context?: PreflightRuntimeContext
): Promise<boolean> {
  await hydrateShellPathForAgentDetection(context)
  return isCommandOnPath('npx')
}
