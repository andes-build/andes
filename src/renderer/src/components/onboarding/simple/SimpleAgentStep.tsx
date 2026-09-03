import { useCallback, useState } from 'react'
import { Check, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { AgentStep } from '../AgentStep'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'
import type { TuiAgent } from '../../../../../shared/tui-agent'

function getInstallCommands(): readonly {
  id: 'claude' | 'codex'
  label: string
  command: string
  docsUrl: string
}[] {
  return [
    {
      id: 'claude',
      label: translate(
        'auto.components.onboarding.simple.SimpleAgentStep.claudeLabel',
        'Claude Code'
      ),
      command: 'npm install -g @anthropic-ai/claude-code',
      docsUrl: 'https://code.claude.com/docs'
    },
    {
      id: 'codex',
      label: translate('auto.components.onboarding.simple.SimpleAgentStep.codexLabel', 'Codex'),
      command: 'npm install -g @openai/codex',
      docsUrl: 'https://github.com/openai/codex'
    }
  ]
}

function InstallCommandRow({
  label,
  command,
  docsUrl
}: {
  label: string
  command: string
  docsUrl: string
}): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    await window.api.ui.writeClipboardText(command)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }, [command])
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-background px-3 py-2.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
          {command}
        </code>
        <Button
          variant="outline"
          size="xs"
          className="shrink-0 gap-1"
          onClick={() => void handleCopy()}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied
            ? translate('auto.components.onboarding.simple.SimpleAgentStep.copied', 'Copied')
            : translate('auto.components.onboarding.simple.SimpleAgentStep.copy', 'Copy')}
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className="shrink-0 gap-1"
          onClick={() => void window.api.shell.openUrl(docsUrl)}
        >
          <ExternalLink className="size-3" />
          {translate('auto.components.onboarding.simple.SimpleAgentStep.docs', 'Docs')}
        </Button>
      </div>
    </div>
  )
}

type SimpleAgentStepProps = {
  selectedAgent: TuiAgent | null
  onSelect: (agent: TuiAgent | null) => void
  detectedSet: Set<TuiAgent>
  isDetecting: boolean
  onRefresh: () => void
}

/**
 * "Tu agente" (spec 005, criterion 2). Reuses the developer AgentStep's grid
 * for detected agents unchanged, and adds a guided install block — copyable
 * official commands for Claude Code and Codex, a docs link, and a
 * "Volver a buscar" button that re-runs the same PATH-rehydrated detection —
 * only when nothing was found.
 */
export function SimpleAgentStep({
  selectedAgent,
  onSelect,
  detectedSet,
  isDetecting,
  onRefresh
}: SimpleAgentStepProps): React.JSX.Element {
  const hasDetected = detectedSet.size > 0
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <AgentStep
        selectedAgent={selectedAgent}
        onSelect={(agent) => onSelect(agent)}
        detectedSet={detectedSet}
        isDetecting={isDetecting}
      />
      {!hasDetected && !isDetecting ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            {translate(
              'auto.components.onboarding.simple.SimpleAgentStep.noneFound',
              "We couldn't find an agent on your computer. Install one with the official command below, then search again."
            )}
          </p>
          {getInstallCommands().map((entry) => (
            <InstallCommandRow
              key={entry.id}
              label={entry.label}
              command={entry.command}
              docsUrl={entry.docsUrl}
            />
          ))}
          <Button
            variant="secondary"
            size="sm"
            className="w-fit gap-1.5"
            onClick={onRefresh}
            disabled={isDetecting}
          >
            <RefreshCw className={isDetecting ? 'size-3.5 animate-spin' : 'size-3.5'} />
            {translate(
              'auto.components.onboarding.simple.SimpleAgentStep.searchAgain',
              'Search again'
            )}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
