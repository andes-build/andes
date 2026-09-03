import { useCallback, useState } from 'react'
import { CheckCircle2, FolderOpen, FolderPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'

type FolderStepState =
  | { kind: 'idle' }
  | { kind: 'naming' }
  | { kind: 'busy' }
  | { kind: 'done'; path: string }
  | { kind: 'error'; message: string }

type FolderStepProps = {
  onChosen: (path: string) => void
}

/**
 * "Tu carpeta" (spec 005, criterion 4 — renombrado del ajuste 2026-09-03,
 * 📌 Peter: nunca dice "brain"). Pick or create a folder (no git repository
 * required) and set it as the active project right away, reusing the
 * existing folder-workspace machinery instead of the "Add Project" modal —
 * never opens it. Preparing its structure is the next step ("install").
 */
export function FolderStep({ onChosen }: FolderStepProps): React.JSX.Element {
  const [state, setState] = useState<FolderStepState>({ kind: 'idle' })
  const [newFolderName, setNewFolderName] = useState('')
  const createProjectGroup = useAppStore((s) => s.createProjectGroup)
  const createFolderWorkspace = useAppStore((s) => s.createFolderWorkspace)
  const setActiveFolderWorkspace = useAppStore((s) => s.setActiveFolderWorkspace)
  const setActiveView = useAppStore((s) => s.setActiveView)

  const activateFolder = useCallback(
    async (path: string, name: string) => {
      setState({ kind: 'busy' })
      try {
        const group = await createProjectGroup(name)
        if (!group) {
          throw new Error('Could not create a project for this folder.')
        }
        const workspace = await createFolderWorkspace({
          projectGroupId: group.id,
          name,
          folderPath: path
        })
        if (!workspace) {
          throw new Error('Could not add this folder as your project.')
        }
        setActiveFolderWorkspace(workspace.id)
        setActiveView('terminal')
        setState({ kind: 'done', path })
        onChosen(path)
      } catch (error) {
        setState({
          kind: 'error',
          message: error instanceof Error ? error.message : String(error)
        })
      }
    },
    [createFolderWorkspace, createProjectGroup, onChosen, setActiveFolderWorkspace, setActiveView]
  )

  const pickFolder = useCallback(async () => {
    const path = await window.api.repos.pickFolder()
    if (!path) {
      return
    }
    const name = path.split(/[\\/]/).findLast((segment) => segment.length > 0) ?? 'My folder'
    await activateFolder(path, name)
  }, [activateFolder])

  const confirmNewFolder = useCallback(async () => {
    const name = newFolderName.trim()
    if (name.length === 0) {
      return
    }
    setState({ kind: 'busy' })
    try {
      const { path } = await window.api.onboardingBrain.createFolder({ name })
      await activateFolder(path, name)
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  }, [activateFolder, newFolderName])

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
      {state.kind === 'busy' ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : state.kind === 'naming' ? (
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Input
            autoFocus
            value={newFolderName}
            placeholder={translate(
              'auto.components.onboarding.simple.FolderStep.namePlaceholder',
              'Folder name'
            )}
            onChange={(event) => setNewFolderName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void confirmNewFolder()
              }
            }}
          />
          <Button
            onClick={() => void confirmNewFolder()}
            disabled={newFolderName.trim().length === 0}
          >
            {translate('auto.components.onboarding.simple.FolderStep.create', 'Create')}
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="gap-2" onClick={() => void pickFolder()}>
            <FolderOpen className="size-4" />
            {translate('auto.components.onboarding.simple.FolderStep.pickFolder', 'Choose folder')}
          </Button>
          <Button size="lg" className="gap-2" onClick={() => setState({ kind: 'naming' })}>
            <FolderPlus className="size-4" />
            {translate(
              'auto.components.onboarding.simple.FolderStep.createNew',
              'Create a new one'
            )}
          </Button>
        </div>
      )}
      {state.kind === 'error' ? (
        <p className="max-w-md text-sm text-red-600 dark:text-red-300">{state.message}</p>
      ) : null}
    </div>
  )
}
