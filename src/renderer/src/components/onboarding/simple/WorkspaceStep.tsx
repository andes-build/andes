import { useCallback, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { translate } from '@/i18n/i18n'

type WorkspaceStepState =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'done'; path: string }
  | { kind: 'error'; message: string }

type WorkspaceStepProps = {
  folderPath: string | null
  onDone: () => void
  onSkip: () => void
}

/**
 * "Tu primer workspace" (spec 005, ajuste del 2026-09-03, 📌 Peter — nuevo
 * paso, no numerado como criterio propio). Names a workspace and scaffolds
 * its empty nodes — qué es, decisiones, aprendizajes, pendientes,
 * iniciativas — inside the chosen folder. This component only renders when
 * the folder has no workspace yet; `SimpleOnboardingFlow` skips it otherwise.
 */
export function WorkspaceStep({
  folderPath,
  onDone,
  onSkip
}: WorkspaceStepProps): React.JSX.Element {
  const [name, setName] = useState('')
  const [state, setState] = useState<WorkspaceStepState>({ kind: 'idle' })

  const createWorkspace = useCallback(async () => {
    const trimmed = name.trim()
    if (trimmed.length === 0 || !folderPath) {
      return
    }
    setState({ kind: 'busy' })
    try {
      const result = await window.api.onboardingBrain.createWorkspace({
        folderPath,
        name: trimmed
      })
      setState({ kind: 'done', path: result.workspaceRelativePath })
      onDone()
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  }, [folderPath, name, onDone])

  if (state.kind === 'done') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <CheckCircle2 className="size-6 text-green-600 dark:text-green-300" />
        <p className="text-sm font-medium text-foreground">{state.path}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Input
          autoFocus
          value={name}
          placeholder={translate(
            'auto.components.onboarding.simple.WorkspaceStep.namePlaceholder',
            'Workspace name'
          )}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void createWorkspace()
            }
          }}
        />
        <Button onClick={() => void createWorkspace()} disabled={name.trim().length === 0}>
          {state.kind === 'busy' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            translate('auto.components.onboarding.simple.WorkspaceStep.create', 'Create')
          )}
        </Button>
        <Button variant="ghost" onClick={onSkip} disabled={state.kind === 'busy'}>
          {translate('auto.components.onboarding.simple.WorkspaceStep.later', 'Later')}
        </Button>
      </div>
      {state.kind === 'error' ? (
        <p className="max-w-md text-sm text-red-600 dark:text-red-300">{state.message}</p>
      ) : null}
    </div>
  )
}
