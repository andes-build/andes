import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import { resolveActiveWorkspaceScope } from '@/store/slices/workspace-scope'
import { useCommandCenterStartup } from './use-command-center-startup'
import { deriveSuggestedAction } from './command-center-suggested-action'
import { buildCheckFindingMessage, buildWaitingResolveMessage } from './command-center-first-message'
import { openCommandCenterThread } from './command-center-agent-launch'
import { isCommandCenterScanEmpty } from './command-center-scan-empty'
import { CommandCenterActionLine } from './CommandCenterActionLine'
import { CommandCenterWaitingCard } from './CommandCenterWaitingCard'
import { CommandCenterInProgressCard } from './CommandCenterInProgressCard'
import { CommandCenterQueueCard } from './CommandCenterQueueCard'
import { CommandCenterChecksCard } from './CommandCenterChecksCard'
import { CommandCenterFooter } from './CommandCenterFooter'
import {
  CommandCenterEmptyScanState,
  CommandCenterLoadingState,
  CommandCenterNotPreparedState,
  CommandCenterParseErrorState,
  CommandCenterRunErrorState,
  CommandCenterUnavailableState
} from './CommandCenterStates'

export type CommandCenterProps = {
  brainPath: string
}

/**
 * Andes's own home screen in simple mode (spec 009): the core's startup scan
 * for the scope chosen in the sidebar selector, shown as its four fixed
 * sections, with a single suggested action above them. Every button here
 * opens a thread with a first message already written — never a blank
 * terminal.
 */
export function CommandCenter({ brainPath }: CommandCenterProps): React.JSX.Element {
  // Spec 010's selector is the single place a scope is chosen; this screen
  // reads it instead of keeping its own notion of scope.
  const activeWorkspaceScopeSlug = useAppStore((s) => s.activeWorkspaceScopeSlug)
  const workspaceScopeOptions = useAppStore((s) => s.workspaceScopeOptions)
  const selectorScope = resolveActiveWorkspaceScope(activeWorkspaceScopeSlug, workspaceScopeOptions)
  const scope =
    selectorScope.kind === 'root'
      ? ({ type: 'root' } as const)
      : ({ type: 'workspace', slug: selectorScope.slug } as const)
  const { state, retry } = useCommandCenterStartup({ brainPath, scope })
  const [preparing, setPreparing] = useState(false)

  const openThread = useCallback((message: string) => {
    void openCommandCenterThread(message)
  }, [])

  const handlePrepare = useCallback(() => {
    setPreparing(true)
    void window.api.onboardingBrain
      .prepare({ brainPath })
      .then(() => retry())
      .catch(() => {
        toast.error(translate('commandCenter.notPrepared.failed', 'Could not prepare this folder.'))
      })
      .finally(() => setPreparing(false))
  }, [brainPath, retry])

  const scanIsEmpty = state.status === 'ready' && isCommandCenterScanEmpty(state.output)

  return (
    <div
      data-testid="command-center"
      className="scrollbar-sleek flex h-full min-h-0 flex-col gap-4 overflow-y-auto bg-background px-8 py-6"
    >
      {/* No scope label here on purpose: the sidebar selector right beside
          this screen already names the scope, and repeating it would be the
          same words twice on one screen. */}
      <h1 className="text-2xl font-semibold">
        {translate('commandCenter.header.title', 'Command Center')}
      </h1>

      {state.status === 'loading' ? (
        <CommandCenterLoadingState slow={state.slow} onRetry={retry} />
      ) : null}
      {state.status === 'not-prepared' ? (
        <CommandCenterNotPreparedState onPrepare={preparing ? () => {} : handlePrepare} />
      ) : null}
      {state.status === 'run-error' ? <CommandCenterRunErrorState onRetry={retry} /> : null}
      {state.status === 'unavailable' ? <CommandCenterUnavailableState onRetry={retry} /> : null}
      {state.status === 'parse-error' ? <CommandCenterParseErrorState onRetry={retry} /> : null}

      {state.status === 'ready' ? (
        <>
          {/* Criterion 7's third uncomfortable state: a scan that ran fine and
              found nothing anywhere. The four cards still render — criterion 2
              shows the sections as they came — but the line above says plainly
              that the folder is empty rather than leaving a suggestion slot
              that reads like a bug. */}
          {scanIsEmpty ? (
            <CommandCenterEmptyScanState onOpenThread={openThread} />
          ) : (
            <CommandCenterActionLine
              suggestion={deriveSuggestedAction(state.output)}
              onOpenThread={openThread}
            />
          )}
          <div className="grid flex-1 grid-cols-3 auto-rows-min gap-4">
            <CommandCenterWaitingCard
              section={state.output.waiting}
              onResolve={(row) => openThread(buildWaitingResolveMessage(row))}
            />
            <CommandCenterInProgressCard section={state.output.inProgress} />
            <CommandCenterQueueCard section={state.output.queue} />
            <CommandCenterChecksCard
              section={state.output.checks}
              onView={(row) => openThread(buildCheckFindingMessage(row))}
            />
          </div>
          <CommandCenterFooter lines={state.output.footerLines} />
        </>
      ) : null}
    </div>
  )
}
