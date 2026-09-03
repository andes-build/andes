import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'

/**
 * The three uncomfortable states from spec 009's criterion 7 — an unprepared
 * folder, a failed scan, and a genuinely empty one — each with their own
 * message and a way forward. None of them ever show the raw error text.
 */

export function CommandCenterLoadingState({
  slow,
  onRetry
}: {
  slow: boolean
  onRetry: () => void
}) {
  return (
    <div
      data-command-center-state="loading"
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {translate('commandCenter.loading.default', 'Reading your workspace…')}
      </p>
      {slow ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {translate('commandCenter.loading.slow', 'This is taking longer than usual.')}
          </p>
          <Button size="sm" variant="outline" onClick={onRetry}>
            {translate('commandCenter.loading.retry', 'Retry')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function CommandCenterMessageState({
  dataState,
  title,
  description,
  actionLabel,
  onAction
}: {
  dataState: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div
      data-command-center-state={dataState}
      className="flex flex-col items-center justify-center gap-2 py-16 text-center"
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function CommandCenterNotPreparedState({ onPrepare }: { onPrepare: () => void }) {
  return (
    <CommandCenterMessageState
      dataState="not-prepared"
      title={translate('commandCenter.notPrepared.title', "This folder isn't set up yet")}
      description={translate(
        'commandCenter.notPrepared.description',
        'Andes needs to prepare this folder before it can show its status.'
      )}
      actionLabel={translate('commandCenter.notPrepared.action', 'Prepare this folder')}
      onAction={onPrepare}
    />
  )
}

export function CommandCenterRunErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <CommandCenterMessageState
      dataState="run-error"
      title={translate('commandCenter.runError.title', "Couldn't read your workspace")}
      description={translate(
        'commandCenter.runError.description',
        'Something went wrong reading the status of this workspace. You can try again.'
      )}
      actionLabel={translate('commandCenter.runError.retry', 'Retry')}
      onAction={onRetry}
    />
  )
}

export function CommandCenterParseErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <CommandCenterMessageState
      dataState="parse-error"
      title={translate('commandCenter.parseError.title', "Couldn't read your workspace")}
      description={translate(
        'commandCenter.parseError.description',
        "The workspace scan returned something Andes doesn't recognize yet."
      )}
      actionLabel={translate('commandCenter.parseError.retry', 'Retry')}
      onAction={onRetry}
    />
  )
}

export function CommandCenterUnavailableState({ onRetry }: { onRetry: () => void }) {
  return (
    <CommandCenterMessageState
      dataState="unavailable"
      title={translate(
        'commandCenter.unavailable.title',
        'This computer is missing a required tool'
      )}
      description={translate(
        'commandCenter.unavailable.description',
        'Andes could not run the workspace scan on this computer.'
      )}
      actionLabel={translate('commandCenter.unavailable.retry', 'Retry')}
      onAction={onRetry}
    />
  )
}
