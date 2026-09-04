import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { translate } from '@/i18n/i18n'
import type { CommandCenterSection } from '../../../../shared/command-center-startup-output'

const COUNTS_RE = /^next (\d+) · later (\d+)$/

function parseCounts(row: string | undefined): { next: string; later: string } | null {
  const match = row ? COUNTS_RE.exec(row) : null
  return match ? { next: match[1], later: match[2] } : null
}

export function CommandCenterQueueCard({
  section
}: {
  section: CommandCenterSection
}): React.JSX.Element {
  const counts = parseCounts(section.rows[0])
  const extraRows = counts ? section.rows.slice(1) : section.rows

  return (
    <Card
      data-command-center-card="queue"
      data-command-center-card-size="secondary"
      className="min-h-[140px] border-border"
    >
      <CardHeader>
        <CardTitle className="text-base">
          {translate('commandCenter.queue.title', 'Queued')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {counts ? (
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-semibold">{counts.next}</div>
              <div className="text-xs text-muted-foreground">
                {translate('commandCenter.queue.next', 'next')}
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{counts.later}</div>
              <div className="text-xs text-muted-foreground">
                {translate('commandCenter.queue.later', 'later')}
              </div>
            </div>
          </div>
        ) : null}
        {extraRows.map((row) => (
          <p key={row} className="text-sm text-muted-foreground">
            {row}
          </p>
        ))}
      </CardContent>
    </Card>
  )
}
