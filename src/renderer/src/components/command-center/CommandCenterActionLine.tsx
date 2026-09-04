import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'
import type { CommandCenterSuggestedAction } from './command-center-suggested-action'

type CommandCenterActionLineProps = {
  suggestion: CommandCenterSuggestedAction | null
  onOpenThread: (message: string) => void
}

/**
 * The single suggested-action line above the cards (spec 009, criterion 5).
 * With nothing to suggest, it says so and offers no button — every button on
 * this screen opens a thread with a real first message, never a blank one
 * (criterion 6), and there is no message to write here.
 */
export function CommandCenterActionLine({
  suggestion,
  onOpenThread
}: CommandCenterActionLineProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <Sparkles className="size-4 shrink-0 text-muted-foreground" />
        <p className="truncate text-sm">
          {suggestion
            ? suggestion.text
            : translate(
                'commandCenter.actionLine.empty',
                'Nothing urgent. Open a thread whenever you want.'
              )}
        </p>
      </div>
      {suggestion ? (
        <Button size="sm" onClick={() => onOpenThread(suggestion.message)} className="shrink-0">
          {translate('commandCenter.actionLine.openThread', 'Open thread')}
        </Button>
      ) : null}
    </div>
  )
}
