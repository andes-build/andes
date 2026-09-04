import { toast } from 'sonner'
import {
  createStructuredAgentSessionLaunchIntent,
  launchStructuredAgentSession,
  StructuredAgentSessionCreateRefusalError,
  type StructuredAgentSessionLaunchIntent,
  type StructuredAgentSessionProvider
} from '@/lib/launch-structured-agent-session'
import { refreshLocalStructuredSessionTabs } from '@/runtime/local-structured-session-tabs-sync'
import { translate } from '@/i18n/i18n'

type StructuredLaunchState = {
  intent: StructuredAgentSessionLaunchIntent
  promise: Promise<string>
  visibilityUnknown: boolean
}

const pendingStructuredLaunchesByWorktree = new Map<string, StructuredLaunchState>()

function trackLaunchSettlement(
  worktreeId: string,
  state: StructuredLaunchState,
  promise: Promise<string>
): void {
  void promise.then(
    () => {
      if (
        state.promise === promise &&
        pendingStructuredLaunchesByWorktree.get(worktreeId) === state
      ) {
        pendingStructuredLaunchesByWorktree.delete(worktreeId)
      }
    },
    () => {
      if (
        state.promise === promise &&
        !state.visibilityUnknown &&
        pendingStructuredLaunchesByWorktree.get(worktreeId) === state
      ) {
        pendingStructuredLaunchesByWorktree.delete(worktreeId)
      }
    }
  )
}

async function verifyPublishedSession(intent: StructuredAgentSessionLaunchIntent): Promise<string> {
  const snapshots = await refreshLocalStructuredSessionTabs()
  const published = snapshots.some(
    (snapshot) =>
      snapshot.worktree === intent.worktreeId &&
      snapshot.tabs.some(
        (tab) => tab.type === 'agent-session' && tab.sessionId === intent.sessionId
      )
  )
  if (!published) {
    throw new Error('structured session tab publication unavailable')
  }
  return intent.sessionId
}

async function retrySameIntent(state: StructuredLaunchState, priorError: unknown): Promise<string> {
  try {
    await launchStructuredAgentSession(state.intent)
    return await verifyPublishedSession(state.intent)
  } catch (error) {
    if (error instanceof StructuredAgentSessionCreateRefusalError) {
      throw error
    }
    try {
      return await verifyPublishedSession(state.intent)
    } catch {
      state.visibilityUnknown = true
      throw error ?? priorError
    }
  }
}

async function launchAndReconcile(state: StructuredLaunchState): Promise<string> {
  try {
    await launchStructuredAgentSession(state.intent)
  } catch (error) {
    if (error instanceof StructuredAgentSessionCreateRefusalError) {
      throw error
    }
    try {
      return await verifyPublishedSession(state.intent)
    } catch {
      return retrySameIntent(state, error)
    }
  }
  try {
    return await verifyPublishedSession(state.intent)
  } catch (error) {
    return retrySameIntent(state, error)
  }
}

async function reconcileUnknownLaunch(state: StructuredLaunchState): Promise<string> {
  state.visibilityUnknown = false
  try {
    return await verifyPublishedSession(state.intent)
  } catch (error) {
    return retrySameIntent(state, error)
  }
}

function launchStructuredAgentSessionOnce(
  worktreeId: string,
  agent: StructuredAgentSessionProvider
): Promise<string> {
  const existing = pendingStructuredLaunchesByWorktree.get(worktreeId)
  if (existing) {
    if (existing.visibilityUnknown) {
      existing.promise = reconcileUnknownLaunch(existing)
      trackLaunchSettlement(worktreeId, existing, existing.promise)
    }
    return existing.promise
  }
  const state: StructuredLaunchState = {
    intent: createStructuredAgentSessionLaunchIntent(worktreeId, agent),
    promise: Promise.resolve(''),
    visibilityUnknown: false
  }
  state.promise = launchAndReconcile(state)
  pendingStructuredLaunchesByWorktree.set(worktreeId, state)
  trackLaunchSettlement(worktreeId, state, state.promise)
  return state.promise
}

export function startStructuredAgentLaunch(
  worktreeId: string,
  agent: StructuredAgentSessionProvider
): void {
  void launchStructuredAgentSessionOnce(worktreeId, agent).catch((error) => {
    toast.error(
      translate('components.native-chat.structuredSessionLaunchFailed', 'Could not open chat'),
      { description: error instanceof Error ? error.message : String(error) }
    )
  })
}
