import { useInterfaceMode } from '@/hooks/useInterfaceMode'
import type { OnboardingState } from '../../../../shared/onboarding-state-types'
import DeveloperOnboardingFlow from './OnboardingFlow'
import { SimpleOnboardingFlow } from './simple/SimpleOnboardingFlow'

type OnboardingFlowRouterProps = {
  onboarding: OnboardingState
  onOnboardingChange: (state: OnboardingState) => void
}

/**
 * Picks the onboarding wizard by interface mode (spec 005, criterion 1).
 * Developer mode renders Orca's own `OnboardingFlow` byte-for-byte unchanged;
 * simple mode (the default) renders the new seven-step guided wizard.
 */
export default function OnboardingFlowRouter(props: OnboardingFlowRouterProps): React.JSX.Element {
  const interfaceMode = useInterfaceMode()
  if (interfaceMode === 'developer') {
    return <DeveloperOnboardingFlow {...props} />
  }
  return <SimpleOnboardingFlow {...props} />
}
