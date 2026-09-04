import { openNewThread } from '@/components/sidebar/workspace-scope/open-new-thread'

/**
 * Opens a thread from a Command Center button, with `message` already written
 * as part of its first message — never a blank terminal and never a raw
 * agent session (spec 009, criterion 6, resolved against the thread that
 * specs 011/015/016/019 landed in `main`).
 *
 * This delegates to `openNewThread` rather than calling `launchAgentInNewTab`
 * itself: that is the one path in simple mode that picks a
 * conversation-capable agent, launches it without the permission-bypass
 * arguments, and stamps the thread with the scope the selector had at that
 * moment (spec 019). A second launch path here would silently drift from all
 * three. Nothing in the layer that spawns the agent binary is touched: the
 * first message travels as `launchAgentInNewTab`'s existing `prompt`.
 */
export async function openCommandCenterThread(message: string): Promise<boolean> {
  return openNewThread({ seedMessage: message })
}
