import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { translate } from '@/i18n/i18n'
import type { CommandCenterSection } from '../../../../shared/command-center-startup-output'

export function CommandCenterInProgressCard({
  section
}: {
  section: CommandCenterSection
}): React.JSX.Element {
  return (
    <Card
      data-command-center-card="in-progress"
      data-command-center-card-size="secondary"
      className="min-h-[140px] border-border"
    >
      <CardHeader>
        <CardTitle className="text-base">
          {translate('commandCenter.inProgress.title', 'In progress')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {section.isEmpty ? (
          <p className="text-sm text-muted-foreground">
            {translate('commandCenter.inProgress.empty', 'Nothing in progress.')}
          </p>
        ) : (
          section.rows.map((row) => (
            <p key={row} className="truncate text-sm">
              {row}
            </p>
          ))
        )}
        {section.omittedCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {translate('commandCenter.inProgress.more', 'and {{count}} more', {
              count: section.omittedCount
            })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
