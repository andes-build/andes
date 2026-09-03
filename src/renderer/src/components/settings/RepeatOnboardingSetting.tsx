import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { SearchableSetting } from './SearchableSetting'
import { translate } from '@/i18n/i18n'
import { showOnboardingFromRenderer } from '../onboarding/show-onboarding-event'

/**
 * "Repetir la configuración inicial" (spec 005, criterion 12) — reuses the
 * reopen path Orca already has (`showOnboardingFromRenderer`), which clears
 * `closedAt` (the field `shouldShowOnboarding` gates on) and broadcasts the
 * reopen to the app shell.
 */
export function RepeatOnboardingSetting(): React.JSX.Element {
  const [busy, setBusy] = useState(false)

  const handleClick = async (): Promise<void> => {
    setBusy(true)
    try {
      await showOnboardingFromRenderer()
    } finally {
      setBusy(false)
    }
  }

  return (
    <SearchableSetting
      title={translate(
        'auto.components.settings.RepeatOnboardingSetting.title',
        'Repeat the initial setup'
      )}
      description={translate(
        'auto.components.settings.RepeatOnboardingSetting.description',
        'Reopen the onboarding wizard.'
      )}
      keywords={['onboarding', 'setup', 'wizard', 'restart', 'repeat']}
      className="flex items-center justify-between gap-4 py-2"
    >
      <Label>
        {translate(
          'auto.components.settings.RepeatOnboardingSetting.title',
          'Repeat the initial setup'
        )}
      </Label>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5"
        disabled={busy}
        onClick={() => void handleClick()}
      >
        <RotateCcw className="size-3.5" />
        {translate('auto.components.settings.RepeatOnboardingSetting.button', 'Repeat setup')}
      </Button>
    </SearchableSetting>
  )
}
