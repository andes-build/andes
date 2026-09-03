import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import { useCommandCenterStartup } from './use-command-center-startup'
import { deriveSuggestedAction } from './command-center-suggested-action'
import {
  buildCheckFindingMessage,
  buildWaitingResolveMessage
} from './command-center-first-message'
import { openCommandCenterThread } from './command-center-agent-launch'
import { CommandCenterActionLine } from './CommandCenterActionLine'
import { CommandCenterWaitingCard } from './CommandCenterWaitingCard'
import { CommandCenterInProgressCard } from './CommandCenterInProgressCard'
import { CommandCenterQueueCard } from './CommandCenterQueueCard'
import { CommandCenterChecksCard } from './CommandCenterChecksCard'
import { CommandCenterFooter } from './CommandCenterFooter'
import {
  CommandCenterLoadingState,
  CommandCenterNotPreparedState,
  CommandCenterParseErrorState,
  CommandCenterRunErrorState,
  CommandCenterUnavailableState
} from './CommandCenterStates'

export type CommandCenterProps = {
  brainPath: string
  /** The workspace's own workspace/worktree id — where a thread opened from
   *  here lives (spec 009, criterion 6). */
  worktreeId: string
}

/**
 * Andes's own home screen in simple mode (spec 009): the core's startup scan
 * for the active workspace, shown as its four fixed sections, with a single
 * suggested action above them. Every button here opens an agent thread with
 * a first message already written — never a blank terminal.
 */
export function CommandCenter({ brainPath, worktreeId }: CommandCenterProps): React.JSX.Element {
  const { state, retry } = useCommandCenterStartup({ brainPath })
  const [preparing, setPreparing] = useState(false)

  const openThread = useCallback(
    (message: string) => {
      void openCommandCenterThread(worktreeId, message)
    },
    [worktreeId]
  )

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

  return (
    <div className="scrollbar-sleek flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-8 py-6">
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
          <CommandCenterActionLine
            suggestion={deriveSuggestedAction(state.output)}
            onOpenThread={openThread}
          />
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
