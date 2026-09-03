import { useCallback, useState } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'
import type { TuiAgent } from '../../../../../shared/tui-agent'

type SessionStatus =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'ready'; email: string }
  | { kind: 'error'; message: string }

type SessionStepProps = {
  selectedAgent: TuiAgent | null
}

/**
 * "Tu sesión" (spec 005, criterion 3). Drives the CLI login session Orca
 * already has — `claudeAccounts.add` / `codexAccounts.add`, which wrap
 * `runClaudeLoginSession` and its Codex pair — through the existing accounts
 * service. Andes never sees or shows any secret: the browser handles the
 * actual credential exchange, this screen only reports status.
 */
export function SessionStep({ selectedAgent }: SessionStepProps): React.JSX.Element {
  const provider: 'claude' | 'codex' = selectedAgent === 'codex' ? 'codex' : 'claude'
  const providerLabel = provider === 'codex' ? 'Codex' : 'Claude'
  const [status, setStatus] = useState<SessionStatus>({ kind: 'idle' })

  const startLogin = useCallback(async () => {
    setStatus({ kind: 'pending' })
    try {
      const result =
        provider === 'codex'
          ? await window.api.codexAccounts.add({ runtime: 'host' })
          : await window.api.claudeAccounts.add({ runtime: 'host' })
      const account = result.accounts.at(-1)
      setStatus({ kind: 'ready', email: account?.email ?? providerLabel })
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  }, [provider, providerLabel])

  const cancelLogin = useCallback(() => {
    if (provider === 'claude') {
      void window.api.claudeAccounts.cancelPendingLogin()
    }
    setStatus({ kind: 'idle' })
  }, [provider])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <p className="max-w-md text-sm text-muted-foreground">
        {translate(
          'auto.components.onboarding.simple.SessionStep.description',
          'Sign in with your {{value0}} subscription in the browser. Andes never asks you for anything here.',
          { value0: providerLabel }
        )}
      </p>

      {status.kind === 'idle' || status.kind === 'error' ? (
        <Button size="lg" onClick={() => void startLogin()}>
          {translate(
            'auto.components.onboarding.simple.SessionStep.signIn',
            'Sign in with {{value0}}',
            { value0: providerLabel }
          )}
        </Button>
      ) : null}

      {status.kind === 'pending' ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {translate(
              'auto.components.onboarding.simple.SessionStep.waitingForBrowser',
              'Waiting for the browser…'
            )}
          </p>
          {provider === 'claude' ? (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={cancelLogin}>
              <X className="size-3.5" />
              {translate('auto.components.onboarding.simple.SessionStep.cancel', 'Cancel')}
            </Button>
          ) : null}
        </div>
      ) : null}

      {status.kind === 'ready' ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-300">
          <CheckCircle2 className="size-4" />
          {translate(
            'auto.components.onboarding.simple.SessionStep.ready',
            'Session ready — {{value0}}',
            { value0: status.email }
          )}
        </div>
      ) : null}

      {status.kind === 'error' ? (
        <p className="max-w-md text-sm text-red-600 dark:text-red-300">{status.message}</p>
      ) : null}
    </div>
  )
}
