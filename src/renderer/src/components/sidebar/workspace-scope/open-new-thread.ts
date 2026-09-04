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
import { buildThreadFirstMessage } from '@/lib/thread-scope-startup-message'
import { resolveActiveWorkspaceScope } from '@/store/slices/workspace-scope'

/**
 * Open a real thread in simple mode: launch a conversation-capable coding
 * agent on the active folder and show its conversation.
 *
 * Spec 015 made this path launch the agent instead of only tagging the tab.
 * Spec 016 fixes what it launched: the agent came from the shared new-tab
 * picker, which honours the machine default, so a machine defaulting to
 * Antigravity opened a raw terminal — simple mode draws a conversation only
 * for the agents
 * of `NATIVE_CHAT_SUPPORTED_AGENT_LIST` — and it carried the profile's default
 * launch arguments, which are the permission-bypass ones
 * (`DEFAULT_TUI_AGENT_ARGS = YOLO_TUI_AGENT_ARGS`). Both rules live in
 * `@/lib/simple-mode-thread-launch`.
 *
 * Agent detection is lazy (`detectedAgentIds` starts `null`), so it is awaited
 * here instead of read from whatever another surface happened to populate.
 * Both dead ends — no folder, no conversation-capable agent — say so on screen
 * with an action; neither opens a terminal.
 *
 * Spec 019: the thread is born with the scope the sidebar selector had at
 * this moment (`resolveActiveWorkspaceScope`) — a name and a slug, or the
 * root. It rides in as this thread's first message
 * (`buildThreadScopeStartupMessage`), so the agent already knows the scope
 * the session contract asks for and never asks which one to use.
 *
 * Spec 009: the Command Center's buttons open a thread through this same
 * function, passing `seedMessage` — what the person clicked on, in words.
 * It is appended to the scope message so one thread starts already scoped
 * *and* already knowing what it is about; nothing below is duplicated on the
 * Command Center's side, and no launch path but this one opens a thread.
 */
export type OpenNewThreadOptions = {
  /** Extra text appended after the scope message as part of this thread's
   *  first message — what the operator clicked on (spec 009, criterion 6). */
  seedMessage?: string
}

export async function openNewThread(options: OpenNewThreadOptions = {}): Promise<boolean> {
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
    return false
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
    return false
  }
  const store = useAppStore.getState()
  // Spec 019: capture the scope the sidebar selector had *right now* — never
  // re-read later, so a selector change after this point never reaches back
  // into this thread (see `decisions.md`, spec 019, criterion 2).
  const threadScope = resolveActiveWorkspaceScope(
    store.activeWorkspaceScopeSlug,
    store.workspaceScopeOptions
  )
  // Spec 009: opening a thread leaves the Command Center home screen.
  store.leaveCommandCenter()
  store.setActiveView('terminal')
  const launched = launchAgentInNewTab({
    agent,
    worktreeId,
    launchSource: 'sidebar',
    agentArgs: resolveSimpleModeThreadAgentArgs(agent, store.settings),
    threadScope,
    prompt: buildThreadFirstMessage(threadScope, options.seedMessage),
    promptDelivery: 'auto-submit',
    // Spec 012: this prompt is the thread's birth message, so the structured lane may carry it on
    // `agentSession.create` instead of pasting it into a terminal.
    promptIsThreadFirstMessage: true
  })
  if (!launched) {
    toast.error(
      translate(
        'auto.components.workspaceScope.SimpleModeNav.threadLaunchFailed',
        'The thread could not be started. Check the agent in Settings and try again.'
      )
    )
    return false
  }
  return true
}
