import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { translate } from '@/i18n/i18n'
import { parseWaitingRow } from '../../../../shared/command-center-startup-output'
import type { CommandCenterSection } from '../../../../shared/command-center-startup-output'

type CommandCenterWaitingCardProps = {
  section: CommandCenterSection
  onResolve: (row: string) => void
}

/**
 * The primary card (spec 009, criterion 3): rendered first, and — via
 * `col-span-2 row-span-2` from the parent grid — wider and taller than the
 * other three. Every row carries the initiative's name, what it is waiting
 * on, and a Resolve button that opens a thread naming both.
 */
export function CommandCenterWaitingCard({
  section,
  onResolve
}: CommandCenterWaitingCardProps): React.JSX.Element {
  return (
    <Card
      data-command-center-card="waiting"
      data-command-center-card-size="primary"
      className="col-span-3 min-h-[220px] border-border"
    >
      <CardHeader>
        <CardTitle className="text-base">
          {translate('commandCenter.waiting.title', 'Waiting for your decision')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {section.isEmpty ? (
          <p className="text-sm text-muted-foreground">
            {translate('commandCenter.waiting.empty', 'Nothing is waiting on you.')}
          </p>
        ) : (
          section.rows.map((row) => {
            const { name, waitingOn } = parseWaitingRow(row)
            return (
              <div
                key={row}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{name}</div>
                  {waitingOn ? (
                    <div className="truncate text-xs text-muted-foreground">{waitingOn}</div>
                  ) : null}
                </div>
                <Button size="sm" onClick={() => onResolve(row)}>
                  {translate('commandCenter.waiting.resolve', 'Resolve')}
                </Button>
              </div>
            )
          })
        )}
        {section.omittedCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {translate('commandCenter.waiting.more', 'and {{count}} more', {
              count: section.omittedCount
            })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
