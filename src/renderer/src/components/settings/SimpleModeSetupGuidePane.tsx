import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { SIMPLE_MODE_SETUP_STEPS } from '../../../../shared/simple-mode-feature-wall-setup-steps'
import { translate } from '@/i18n/i18n'

const STEP_LABELS: Record<(typeof SIMPLE_MODE_SETUP_STEPS)[number]['id'], () => string> = {
  agent: () => translate('auto.components.settings.SimpleModeSetupGuidePane.agent', 'Agent'),
  session: () => translate('auto.components.settings.SimpleModeSetupGuidePane.session', 'Session'),
  folder: () => translate('auto.components.settings.SimpleModeSetupGuidePane.folder', 'Folder'),
  skills: () => translate('auto.components.settings.SimpleModeSetupGuidePane.skills', 'Skills'),
  notifications: () =>
    translate('auto.components.settings.SimpleModeSetupGuidePane.notifications', 'Notifications'),
  star: () => translate('auto.components.settings.SimpleModeSetupGuidePane.star', 'Star')
}

/**
 * Simple-mode "checklist de Ajustes" (spec 005, criterion 11) — a flat list
 * of exactly agent, session, brain, skills, notifications, star, each with
 * a done/not-done state. A wholly separate pane from
 * `SettingsSetupGuidePane`, which developer mode keeps unchanged.
 */
export function SimpleModeSetupGuidePane(): React.JSX.Element {
  const settings = useAppStore((s) => s.settings)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([window.api.claudeAccounts.list(), window.api.codexAccounts.list()]).then(
      ([claude, codex]) => {
        if (!cancelled) {
          setSessionReady(claude.accounts.length > 0 || codex.accounts.length > 0)
        }
      }
    )
    return () => {
      cancelled = true
    }
  }, [])

  const done: Record<(typeof SIMPLE_MODE_SETUP_STEPS)[number]['id'], boolean> = {
    agent: Boolean(settings?.defaultTuiAgent && settings.defaultTuiAgent !== 'blank'),
    session: sessionReady,
    folder: false,
    skills: false,
    notifications: Boolean(settings?.notifications?.enabled),
    star: false
  }

  return (
    <div className="space-y-1.5 px-7 py-6">
      {SIMPLE_MODE_SETUP_STEPS.map((step) => {
        const isDone = done[step.id]
        return (
          <div
            key={step.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border',
                isDone
                  ? 'border-green-500/45 bg-green-500/10 text-green-600 dark:text-green-300'
                  : 'border-border text-muted-foreground'
              )}
            >
              {isDone ? <Check className="size-3" /> : null}
            </span>
            <span className="text-sm font-medium text-foreground">{STEP_LABELS[step.id]()}</span>
          </div>
        )
      })}
    </div>
  )
}
