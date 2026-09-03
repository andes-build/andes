import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { translate } from '@/i18n/i18n'
import type { CommandCenterSection } from '../../../../shared/command-center-startup-output'

type CommandCenterChecksCardProps = {
  section: CommandCenterSection
  onView: (row: string) => void
}

export function CommandCenterChecksCard({
  section,
  onView
}: CommandCenterChecksCardProps): React.JSX.Element {
  return (
    <Card
      data-command-center-card="checks"
      data-command-center-card-size="secondary"
      className="min-h-[140px] border-border"
    >
      <CardHeader>
        <CardTitle className="text-base">
          {translate('commandCenter.checks.title', 'Checks')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {section.isEmpty ? (
          <p className="text-sm text-muted-foreground">
            {translate('commandCenter.checks.empty', 'No findings.')}
          </p>
        ) : (
          section.rows.map((row) => (
            <div key={row} className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm">{row}</p>
              <Button size="sm" variant="outline" onClick={() => onView(row)}>
                {translate('commandCenter.checks.view', 'View')}
              </Button>
            </div>
          ))
        )}
        {section.omittedCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {translate('commandCenter.checks.more', 'and {{count}} more', {
              count: section.omittedCount
            })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
