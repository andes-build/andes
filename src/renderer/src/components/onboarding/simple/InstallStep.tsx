import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { translate } from '@/i18n/i18n'

type InstallStepState =
  | { kind: 'busy' }
  | { kind: 'done'; alreadyPrepared: boolean; added: string[] }
  | { kind: 'error'; message: string }

type InstallStepProps = {
  folderPath: string | null
  onDone: (ready: boolean) => void
}

/**
 * "Preparar la carpeta" (spec 005, criterion 5 — renombrado del ajuste
 * 2026-09-03, 📌 Peter: nunca dice "brain"). If the folder does not have the
 * system's structure yet, creates it from the vendored core and shows what
 * was added; if it already has it, says so and continues.
 */
export function InstallStep({ folderPath, onDone }: InstallStepProps): React.JSX.Element {
  const [state, setState] = useState<InstallStepState>({ kind: 'busy' })

  useEffect(() => {
    if (!folderPath) {
      return
    }
    let cancelled = false
    setState({ kind: 'busy' })
    void window.api.onboardingBrain
      .prepare({ brainPath: folderPath })
      .then((result) => {
        if (cancelled) {
          return
        }
        setState({ kind: 'done', alreadyPrepared: result.alreadyPrepared, added: result.added })
        onDone(true)
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        setState({
          kind: 'error',
          message: error instanceof Error ? error.message : String(error)
        })
        onDone(false)
      })
    return () => {
      cancelled = true
    }
  }, [folderPath, onDone])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      {state.kind === 'busy' ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : state.kind === 'done' ? (
        <>
          <CheckCircle2 className="size-6 text-green-600 dark:text-green-300" />
          <p className="max-w-md text-sm text-muted-foreground">
            {state.alreadyPrepared
              ? translate(
                  'auto.components.onboarding.simple.InstallStep.alreadyPrepared',
                  'This folder was already set up. Nothing to add.'
                )
              : translate(
                  'auto.components.onboarding.simple.InstallStep.prepared',
                  'Set up: {{value0}}',
                  { value0: state.added.join(', ') }
                )}
          </p>
        </>
      ) : (
        <p className="max-w-md text-sm text-red-600 dark:text-red-300">{state.message}</p>
      )}
    </div>
  )
}
