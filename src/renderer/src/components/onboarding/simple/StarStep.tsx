import { useCallback } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'

export const ANDES_REPO_URL = 'https://github.com/andes-build/andes'

/**
 * "Estrella" (spec 005, criterion 8) — last step. Marks the star ask as done
 * or postponed in the same star-nag service the floating card uses, so that
 * card does not repeat the ask at the 35-agent threshold once the person
 * already answered here.
 */
type StarStepProps = {
  /** Both buttons finish onboarding right away — this is the last step. */
  onDone: () => void
}

export function StarStep({ onDone }: StarStepProps): React.JSX.Element {
  const handleStar = useCallback(() => {
    void window.api.shell.openUrl(ANDES_REPO_URL)
    void window.api.starNag.complete()
    onDone()
  }, [onDone])

  const handleLater = useCallback(() => {
    void window.api.starNag.later()
    onDone()
  }, [onDone])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <Star className="size-8 fill-amber-400/60 text-amber-400/80" />
      <p className="max-w-md text-sm text-muted-foreground">
        {translate(
          'auto.components.onboarding.simple.StarStep.description',
          'Andes is open source. If you liked it, a star on GitHub helps others find it.'
        )}
      </p>
      <div className="flex gap-3">
        <Button className="gap-1.5" onClick={handleStar}>
          <Star className="size-3.5" />
          {translate('auto.components.onboarding.simple.StarStep.starButton', 'Give it a star')}
        </Button>
        <Button variant="secondary" onClick={handleLater}>
          {translate('auto.components.onboarding.simple.StarStep.later', 'Not now')}
        </Button>
      </div>
    </div>
  )
}
