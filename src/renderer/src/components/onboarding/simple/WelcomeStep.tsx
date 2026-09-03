import { translate } from '@/i18n/i18n'
import logo from '../../../../../../resources/logo.svg'

export function WelcomeStep(): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className="h-14 w-auto shrink-0 invert dark:invert-0"
      />
      <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
        {translate(
          'auto.components.onboarding.simple.WelcomeStep.intro',
          "In a few steps we'll set up your assistant, sign you in, prepare your folder, and install skills. Nothing technical needed."
        )}
      </p>
    </div>
  )
}
