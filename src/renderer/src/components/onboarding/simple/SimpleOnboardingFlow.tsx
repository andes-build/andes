import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import type { OnboardingState } from '../../../../../shared/onboarding-state-types'
import { useSimpleOnboardingFlow } from './use-simple-onboarding-flow'
import { WelcomeStep } from './WelcomeStep'
import { SimpleAgentStep } from './SimpleAgentStep'
import { SessionStep } from './SessionStep'
import { FolderStep } from './FolderStep'
import { InstallStep } from './InstallStep'
import { WorkspaceStep } from './WorkspaceStep'
import { SkillsStep } from './SkillsStep'
import { StarStep } from './StarStep'
import { NotificationStep } from '../NotificationStep'
import { Button } from '@/components/ui/button'
import { OnboardingSkipConfirmationDialog } from '../OnboardingSkipConfirmationDialog'
import { translate } from '@/i18n/i18n'
import logo from '../../../../../../resources/logo.svg'

// Why: none of these steps drive their own footer buttons — see the ones
// listed in HIDDEN_FOOTER_STEPS below for the ones that do.
const STEP_COPY: Record<string, { title: () => string; subtitle: () => string | null }> = {
  welcome: {
    title: () =>
      translate(
        'auto.components.onboarding.simple.SimpleOnboardingFlow.welcomeTitle',
        'Welcome to Andes'
      ),
    subtitle: () => null
  },
  agent: {
    title: () =>
      translate('auto.components.onboarding.simple.SimpleOnboardingFlow.agentTitle', 'Your agent'),
    subtitle: () =>
      translate(
        'auto.components.onboarding.simple.SimpleOnboardingFlow.agentSubtitle',
        'Andes works with your favorite AI assistant.'
      )
  },
  session: {
    title: () =>
      translate(
        'auto.components.onboarding.simple.SimpleOnboardingFlow.sessionTitle',
        'Your session'
      ),
    subtitle: () => null
  },
  // Why: "folder", never "brain" — ajuste del 2026-09-03 (📌 Peter): la
  // persona crea y elige workspaces adentro de una carpeta, nunca un "brain".
  folder: {
    title: () =>
      translate(
        'auto.components.onboarding.simple.SimpleOnboardingFlow.folderTitle',
        'Where does Andes keep your work?'
      ),
    subtitle: () =>
      translate(
        'auto.components.onboarding.simple.SimpleOnboardingFlow.folderSubtitle',
        'Andes works on a folder on your computer, and never outside it. Everything lives there, and everything stays on your machine.'
      )
  },
  install: {
    title: () =>
      translate(
        'auto.components.onboarding.simple.SimpleOnboardingFlow.installTitle',
        'Setting up your folder'
      ),
    subtitle: () => null
  },
  workspace: {
    title: () =>
      translate(
        'auto.components.onboarding.simple.SimpleOnboardingFlow.workspaceTitle',
        'Your first workspace'
      ),
    subtitle: () =>
      translate(
        'auto.components.onboarding.simple.SimpleOnboardingFlow.workspaceSubtitle',
        'Give it a name — you can always create more later.'
      )
  },
  skills: {
    title: () =>
      translate('auto.components.onboarding.simple.SimpleOnboardingFlow.skillsTitle', 'Skills'),
    subtitle: () => null
  },
  notifications: {
    title: () =>
      translate(
        'auto.components.onboarding.simple.SimpleOnboardingFlow.notificationsTitle',
        'Set up notifications'
      ),
    subtitle: () => null
  },
  star: {
    title: () =>
      translate(
        'auto.components.onboarding.simple.SimpleOnboardingFlow.starTitle',
        'One last thing'
      ),
    subtitle: () => null
  }
}

// Why: these steps drive their own primary action(s) — the shared footer
// "Continue"/"Finish" button would be a confusing second way to do the same
// thing.
const HIDDEN_FOOTER_STEPS = new Set(['install', 'workspace', 'star'])

type SimpleOnboardingFlowProps = {
  onboarding: OnboardingState
  onOnboardingChange: (state: OnboardingState) => void
}

/**
 * Simple-mode onboarding wizard (spec 005; ajuste del 2026-09-03, 📌 Peter).
 * Nine fixed steps — `welcome, agent, session, folder, install, workspace,
 * skills, notifications, star` — replacing Orca's step-skipping developer
 * wizard. Never renders when `interfaceMode === 'developer'`; see
 * `OnboardingFlowRouter.tsx`.
 */
export function SimpleOnboardingFlow({
  onboarding,
  onOnboardingChange
}: SimpleOnboardingFlowProps): React.JSX.Element {
  const flow = useSimpleOnboardingFlow(onboarding, onOnboardingChange)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false)
  const copy = STEP_COPY[flow.currentStepId]
  const isLastStep = flow.stepIndex === flow.totalSteps - 1
  const hideFooterPrimary = HIDDEN_FOOTER_STEPS.has(flow.currentStepId) || isLastStep

  const canContinue = flow.currentStepId !== 'folder' || flow.folderPath !== null

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !skipConfirmOpen) {
        event.preventDefault()
        setSkipConfirmOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [skipConfirmOpen])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/50 p-4 text-foreground backdrop-blur-[2px]"
      data-onboarding-overlay
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          setSkipConfirmOpen(true)
        }
      }}
    >
      <section
        role="dialog"
        aria-label={translate(
          'auto.components.onboarding.simple.SimpleOnboardingFlow.dialogLabel',
          'Andes onboarding'
        )}
        aria-modal="true"
        data-onboarding-modal
        data-onboarding-mode="simple"
        className="relative flex h-[calc(100vh-2rem)] max-h-[720px] min-h-0 w-[calc(100vw-2rem)] max-w-[720px] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
      >
        <div className="relative flex h-full min-h-0 flex-col px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
          <div className="flex items-center gap-3 text-base font-semibold tracking-tight">
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              className="h-7 w-auto shrink-0 invert dark:invert-0"
            />
            <span>
              {translate(
                'auto.components.onboarding.simple.SimpleOnboardingFlow.brandName',
                'Andes'
              )}
            </span>
          </div>

          <div className="mt-8 flex items-center gap-2">
            {Array.from({ length: flow.totalSteps }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  index === flow.stepIndex
                    ? 'w-10 bg-foreground'
                    : index < flow.stepIndex
                      ? 'w-6 bg-muted-foreground/70'
                      : 'w-6 bg-muted-foreground/25'
                )}
              />
            ))}
          </div>

          <div className="mt-8 shrink-0">
            <h1 className="text-[28px] font-semibold leading-[1.15] tracking-tight text-foreground">
              {copy.title()}
            </h1>
            {copy.subtitle() ? (
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {copy.subtitle()}
              </p>
            ) : null}
          </div>

          <div className="scrollbar-sleek mt-8 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
            {flow.currentStepId === 'welcome' && <WelcomeStep />}
            {flow.currentStepId === 'agent' && (
              <SimpleAgentStep
                selectedAgent={flow.selectedAgent}
                onSelect={flow.setSelectedAgent}
                detectedSet={flow.detectedSet}
                isDetecting={flow.isDetectingAgents}
                onRefresh={() => void flow.refreshDetectedAgents()}
              />
            )}
            {flow.currentStepId === 'session' && <SessionStep selectedAgent={flow.selectedAgent} />}
            {flow.currentStepId === 'folder' && <FolderStep onChosen={flow.setFolderPath} />}
            {flow.currentStepId === 'install' && (
              <InstallStep folderPath={flow.folderPath} onDone={() => flow.next()} />
            )}
            {flow.currentStepId === 'workspace' && (
              <WorkspaceStep
                folderPath={flow.folderPath}
                onDone={() => flow.next()}
                onSkip={() => flow.next()}
              />
            )}
            {flow.currentStepId === 'skills' && (
              <SkillsStep detectedAgents={Array.from(flow.detectedSet)} />
            )}
            {flow.currentStepId === 'notifications' && (
              <NotificationStep settings={settings} updateSettings={updateSettings} />
            )}
            {flow.currentStepId === 'star' && <StarStep onDone={flow.next} />}
          </div>

          <footer className="mt-6 flex flex-none items-center justify-between border-t border-border pt-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={flow.back}
              disabled={flow.stepIndex === 0}
              className={flow.stepIndex === 0 ? 'invisible' : undefined}
            >
              {translate('auto.components.onboarding.simple.SimpleOnboardingFlow.back', 'Back')}
            </Button>
            {hideFooterPrimary ? null : (
              <Button onClick={flow.next} disabled={!canContinue}>
                {translate(
                  'auto.components.onboarding.simple.SimpleOnboardingFlow.continue',
                  'Continue'
                )}
              </Button>
            )}
          </footer>
        </div>
      </section>
      <OnboardingSkipConfirmationDialog
        open={skipConfirmOpen}
        onOpenChange={setSkipConfirmOpen}
        onSkip={() => {
          setSkipConfirmOpen(false)
          void flow.dismiss()
        }}
      />
    </div>
  )
}
