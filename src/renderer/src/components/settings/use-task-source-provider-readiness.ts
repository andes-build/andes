import { useMemo } from 'react'
import type { TaskProvider } from '../../../../shared/task-providers'
import { getLocalPreflightContext, localPreflightContextKey } from '@/lib/local-preflight-context'
import { getProviderRuntimeContextKey } from '@/lib/provider-runtime-context'
import { useAppStore } from '@/store'
import type { TaskProviderReadiness } from './task-source-setup-state'

// Linear is not offered here (spec 004): this hook covers only the providers
// Settings > Fuentes de tareas actually lists.
type OfferedTaskProvider = Exclude<TaskProvider, 'linear'>

export function useTaskSourceProviderReadiness(
  visibleProviders: readonly TaskProvider[]
): Record<OfferedTaskProvider, TaskProviderReadiness> {
  const settings = useAppStore((s) => s.settings)
  const preflightStatus = useAppStore((s) => s.preflightStatus)
  const preflightStatusChecked = useAppStore((s) => s.preflightStatusChecked)
  const preflightStatusContextKey = useAppStore((s) => s.preflightStatusContextKey)
  const preflightStatusError = useAppStore((s) => s.preflightStatusError)
  const preflightStatusLoading = useAppStore((s) => s.preflightStatusLoading)
  const expectedPreflightContextKey = useAppStore((s) =>
    localPreflightContextKey(getLocalPreflightContext(s))
  )
  const jiraStatus = useAppStore((s) => s.jiraStatus)
  const jiraStatusChecked = useAppStore((s) => s.jiraStatusChecked)
  const jiraStatusContextKey = useAppStore((s) => s.jiraStatusContextKey)
  const providerRuntimeContextKey = getProviderRuntimeContextKey(settings)

  const preflightCurrent = preflightStatusContextKey === expectedPreflightContextKey
  const reviewChecking = preflightStatusLoading || !preflightStatusChecked || !preflightCurrent
  // A failed preflight leaves the previous status object in place, so mirror
  // Integrations and refuse to read connection facts out of a stale snapshot.
  const reviewReadyForConnection = !reviewChecking && preflightStatusError === null
  const reviewUnavailable = !reviewChecking && preflightStatusError !== null
  const githubConnected =
    reviewReadyForConnection &&
    preflightStatus?.gh?.installed === true &&
    preflightStatus.gh.authenticated === true
  const gitlabConnected =
    reviewReadyForConnection &&
    preflightStatus?.glab?.installed === true &&
    preflightStatus.glab.authenticated === true
  const jiraChecking = jiraStatusContextKey !== providerRuntimeContextKey || !jiraStatusChecked
  const jiraConnected = !jiraChecking && jiraStatus.connected === true
  // Normalization returns a new array, so memoize by provider contents.
  const visibleProvidersKey = visibleProviders.join(',')

  return useMemo(() => {
    const visible = new Set(visibleProvidersKey.split(',') as TaskProvider[])
    return {
      github: {
        connected: githubConnected,
        checking: reviewChecking,
        unavailable: reviewUnavailable,
        visible: visible.has('github')
      },
      gitlab: {
        connected: gitlabConnected,
        checking: reviewChecking,
        unavailable: reviewUnavailable,
        visible: visible.has('gitlab')
      },
      jira: {
        connected: jiraConnected,
        checking: jiraChecking,
        visible: visible.has('jira')
      }
    }
  }, [
    githubConnected,
    gitlabConnected,
    jiraChecking,
    jiraConnected,
    reviewChecking,
    reviewUnavailable,
    visibleProvidersKey
  ])
}
