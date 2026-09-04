import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import { launchAgentInNewTab } from '@/lib/launch-agent-in-new-tab'
import { resolveDefaultAgentForNewTab } from '@/lib/agent-tab-shortcuts'

/**
 * Open a real thread in simple mode: launch the detected coding agent on the
 * active folder and show its conversation.
 *
 * Spec 015. Until this fix the entry point called `createTab` with a
 * `launchAgent` tag and nothing else, so the PTY spawned a plain login shell:
 * the chat surface was mounted over a shell that could not answer, and every
 * message the operator typed went nowhere visible. Launching goes through
 * `launchAgentInNewTab`, the one path that also queues the startup command
 * that actually spawns the agent CLI.
 *
 * Agent detection is lazy (`detectedAgentIds` starts `null`), so it is awaited
 * here instead of read from whatever another surface happened to populate.
 * Both dead ends — no folder, no agent installed — say so on screen; neither
 * opens a tab that silently swallows what the operator writes.
 */
export async function openNewThread(): Promise<void> {
  const state = useAppStore.getState()
  const worktreeId = state.activeWorktreeId
  if (!worktreeId) {
    toast.error(
      translate(
        'auto.components.workspaceScope.SimpleModeNav.noFolderForThread',
        'Open a folder before starting a thread.'
      )
    )
    return
  }
  const detectedAgentIds = await state.ensureDetectedAgents(worktreeId)
  const settings = useAppStore.getState().settings
  const agent = resolveDefaultAgentForNewTab({
    defaultTuiAgent: settings?.defaultTuiAgent,
    detectedAgentIds,
    disabledTuiAgents: settings?.disabledTuiAgents
  })
  if (!agent) {
    toast.error(
      translate(
        'auto.components.workspaceScope.SimpleModeNav.noAgentForThread',
        'No coding agent is installed, so there is nobody to talk to yet.'
      ),
      {
        action: {
          label: translate(
            'auto.components.workspaceScope.SimpleModeNav.noAgentForThreadAction',
            'Agents & skills'
          ),
          onClick: () => useAppStore.getState().openSkillsPage()
        }
      }
    )
    return
  }
  const store = useAppStore.getState()
  store.setActiveView('terminal')
  const launched = launchAgentInNewTab({ agent, worktreeId, launchSource: 'sidebar' })
  if (!launched) {
    toast.error(
      translate(
        'auto.components.workspaceScope.SimpleModeNav.threadLaunchFailed',
        'The thread could not be started. Check the agent in Settings and try again.'
      )
    )
  }
}
