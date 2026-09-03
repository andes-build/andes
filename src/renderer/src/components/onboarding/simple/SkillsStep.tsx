import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'
import { buildSkillsPackInstallCommand } from '../../../../../shared/agent-feature-install-commands'
import { OnboardingInlineCommandTerminal } from '../OnboardingInlineCommandTerminal'
import type { TuiAgent } from '../../../../../shared/tui-agent'
import { isSkillsCliAgentKeyShaped } from '../../../../../shared/skills-cli-agent-keys'

const NODE_INSTALL_DOCS_URL = 'https://nodejs.org/en/download'

type SkillsStepProps = {
  detectedAgents: readonly TuiAgent[]
  /** Suggested pack repo, configurable and empty by default (Gate 1, 2026-09-03) — never a fixed pack in code. */
  suggestedRepo?: string
}

/**
 * "Skills" (spec 005, criterion 6) — optional step. No pack is hardcoded:
 * the person types the repo of the pack they want. Reuses skills.sh through
 * `buildSkillsPackInstallCommand` and the same embedded terminal the rest of
 * onboarding uses, targeting exactly the agents detected in the agent step.
 */
export function SkillsStep({
  detectedAgents,
  suggestedRepo = ''
}: SkillsStepProps): React.JSX.Element {
  const [repo, setRepo] = useState(suggestedRepo)
  const [npxAvailable, setNpxAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.api.preflight.detectNpx().then((available) => {
      if (!cancelled) {
        setNpxAvailable(available)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (npxAvailable === false) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          {translate(
            'auto.components.onboarding.simple.SkillsStep.noNpx',
            'Installing skills needs Node.js, which is not installed on this computer. You can install it now, or do this later from Settings.'
          )}
        </p>
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => void window.api.shell.openUrl(NODE_INSTALL_DOCS_URL)}
        >
          <ExternalLink className="size-3.5" />
          {translate('auto.components.onboarding.simple.SkillsStep.installNode', 'Install Node.js')}
        </Button>
      </div>
    )
  }

  const usableAgents = detectedAgents.filter((agent) => isSkillsCliAgentKeyShaped(agent))
  const trimmedRepo = repo.trim()
  const command =
    trimmedRepo.length > 0 && usableAgents.length > 0
      ? buildSkillsPackInstallCommand(trimmedRepo, { agents: usableAgents, yes: true })
      : null

  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {translate(
          'auto.components.onboarding.simple.SkillsStep.description',
          'Optional. Paste the repository of a skills pack to install it for your agent.'
        )}
      </p>
      <Input
        value={repo}
        placeholder={translate(
          'auto.components.onboarding.simple.SkillsStep.repoPlaceholder',
          'https://github.com/owner/pack'
        )}
        onChange={(event) => setRepo(event.target.value)}
      />
      {command ? (
        <OnboardingInlineCommandTerminal
          command={command}
          title={translate(
            'auto.components.onboarding.simple.SkillsStep.terminalTitle',
            'Skill setup'
          )}
          ariaLabel={translate(
            'auto.components.onboarding.simple.SkillsStep.terminalAriaLabel',
            'Skill setup command'
          )}
          terminalHeightPx={160}
        />
      ) : null}
    </div>
  )
}
