import { toast } from 'sonner'
import { useAppStore } from '@/store'
import { launchAgentInNewTab } from '@/lib/launch-agent-in-new-tab'
import { pickSourceControlLaunchAgent } from '@/lib/source-control-launch-agent-selection'
import { focusTerminalTabSurface } from '@/lib/focus-terminal-tab-surface'
import { translate } from '@/i18n/i18n'

/**
 * Opens a new agent thread in the currently active workspace with `message`
 * already written as the first message — never a blank terminal (spec 009,
 * criterion 6). Reuses `launchAgentInNewTab`, the same existing, tested path
 * `startFixChecksAgent` uses to open a thread about a check finding in an
 * *existing* worktree: it is the one launch path in the app that already
 * does this without creating a new worktree, so this never touches the
 * layer that actually spawns the agent binary.
 */
export async function openCommandCenterThread(
  worktreeId: string,
  message: string
): Promise<boolean> {
  const store = useAppStore.getState()
  const detectedAgents = await store.ensureDetectedAgents()
  const agent = pickSourceControlLaunchAgent({
    defaultAgent: store.settings?.defaultTuiAgent,
    detectedAgents,
    disabledAgents: store.settings?.disabledTuiAgents
  })
  if (!agent) {
    toast.error(
      translate(
        'commandCenter.agentLaunch.noAgentDetected',
        'No AI agent was detected on this computer.'
      )
    )
    return false
  }
  const result = launchAgentInNewTab({
    agent,
    worktreeId,
    prompt: message,
    promptDelivery: 'submit-after-ready',
    // Why: 'unknown' is the closest existing LaunchSource value — adding a
    // dedicated 'command_center' entry to the shared telemetry schema is out
    // of this spec's scope (see decisions.md).
    launchSource: 'unknown'
  })
  if (!result) {
    toast.error(translate('commandCenter.agentLaunch.launchFailed', 'Could not open a new thread.'))
    return false
  }
  if (result.tabId) {
    focusTerminalTabSurface(result.tabId)
  }
  return true
}
