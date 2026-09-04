import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import { launchAgentInNewTab } from '@/lib/launch-agent-in-new-tab'
import { getConnectionId } from '@/lib/connection-context'
import { isNativeChatTranscriptLocalReadable } from '@/lib/native-chat-transcript-readability'
import {
  resolveSimpleModeThreadAgent,
  resolveSimpleModeThreadAgentArgs
} from '@/lib/simple-mode-thread-launch'

/**
 * Open a real thread in simple mode: launch a conversation-capable coding
 * agent on the active folder and show its conversation.
 *
 * Spec 015 made this path launch the agent instead of only tagging the tab.
 * Spec 016 fixes what it launched: the agent came from the machine default
 * (`resolveDefaultAgentForNewTab`), so a machine whose default is Antigravity
 * opened a raw terminal — simple mode draws a conversation only for the agents
 * of `NATIVE_CHAT_SUPPORTED_AGENT_LIST` — and it carried the profile's default
 * launch arguments, which are the permission-bypass ones
 * (`DEFAULT_TUI_AGENT_ARGS = YOLO_TUI_AGENT_ARGS`). Both rules live in
 * `@/lib/simple-mode-thread-launch`.
 *
 * Agent detection is lazy (`detectedAgentIds` starts `null`), so it is awaited
 * here instead of read from whatever another surface happened to populate.
 * Both dead ends — no folder, no conversation-capable agent — say so on screen
 * with an action; neither opens a terminal.
 */
export async function openNewThread(): Promise<void> {
  const state = useAppStore.getState()
  const worktreeId = state.activeWorktreeId
  if (!worktreeId) {
    toast.error(
      translate(
        'auto.components.workspaceScope.SimpleModeNav.noFolderForThread',
        'Open a folder before starting a thread.'
      ),
      {
        action: {
          label: translate(
            'auto.components.workspaceScope.SimpleModeNav.noFolderForThreadAction',
            'Open folder'
          ),
          onClick: () => void useAppStore.getState().addRepo()
        }
      }
    )
    return
  }
  const detectedAgentIds = await state.ensureDetectedAgents(worktreeId)
  const settings = useAppStore.getState().settings
  const agent = resolveSimpleModeThreadAgent({
    defaultTuiAgent: settings?.defaultTuiAgent,
    detectedAgentIds,
    disabledTuiAgents: settings?.disabledTuiAgents,
    nativeChatTranscriptIsLocalReadable: isNativeChatTranscriptLocalReadable(
      getConnectionId(worktreeId)
    )
  })
  if (!agent) {
    toast.error(
      translate(
        'auto.components.workspaceScope.SimpleModeNav.noChatAgentForThread',
        'Claude Code is not installed, so there is no conversation to open yet.'
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
  const launched = launchAgentInNewTab({
    agent,
    worktreeId,
    launchSource: 'sidebar',
    agentArgs: resolveSimpleModeThreadAgentArgs(agent, store.settings)
  })
  if (!launched) {
    toast.error(
      translate(
        'auto.components.workspaceScope.SimpleModeNav.threadLaunchFailed',
        'The thread could not be started. Check the agent in Settings and try again.'
      )
    )
  }
}
