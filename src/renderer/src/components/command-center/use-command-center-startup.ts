import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isCommandCenterStartupParseError,
  parseCommandCenterStartupOutput,
  type CommandCenterStartupOutput
} from '../../../../shared/command-center-startup-output'

/** How long the scan can run before the loading state says so and offers a
 *  retry (spec 009, criterion 8). Exported so the timing test and any future
 *  caller share one number instead of two copies drifting apart. */
export const COMMAND_CENTER_SLOW_THRESHOLD_MS = 10_000

export type CommandCenterStartupState =
  | { status: 'loading'; slow: boolean }
  | { status: 'ready'; output: CommandCenterStartupOutput }
  | { status: 'parse-error'; raw: string }
  | { status: 'run-error'; message: string }
  | { status: 'not-prepared' }
  | { status: 'unavailable' }

export type UseCommandCenterStartupArgs = {
  brainPath: string | null
}

/**
 * Runs the core's startup scan for the active brain and turns its result
 * into a state the Command Center can render directly. The scope (a
 * workspace slug, or root) is resolved on the main side — there is no
 * workspace selector yet (spec 010) for this hook to read one from; see
 * `resolveCommandCenterScope`. Never blocks the window: the scan runs on the
 * main process via IPC while this hook reports 'loading', and flips a `slow`
 * flag once it has run past `COMMAND_CENTER_SLOW_THRESHOLD_MS` so the UI can
 * say so and offer a retry.
 */
export function useCommandCenterStartup(args: UseCommandCenterStartupArgs): {
  state: CommandCenterStartupState
  retry: () => void
} {
  const { brainPath } = args
  const [state, setState] = useState<CommandCenterStartupState>({ status: 'loading', slow: false })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const mountedRef = useRef(true)
  useEffect(
    () => () => {
      mountedRef.current = false
    },
    []
  )

  useEffect(() => {
    if (!brainPath) {
      return undefined
    }
    let cancelled = false
    setState({ status: 'loading', slow: false })
    const slowTimer = setTimeout(() => {
      if (!cancelled) {
        setState((current) =>
          current.status === 'loading' ? { status: 'loading', slow: true } : current
        )
      }
    }, COMMAND_CENTER_SLOW_THRESHOLD_MS)

    void window.api.commandCenter
      .runStartup({ brainPath })
      .then((result) => {
        if (cancelled) {
          return
        }
        if (result.kind === 'not-prepared') {
          setState({ status: 'not-prepared' })
          return
        }
        if (result.kind === 'unavailable') {
          setState({ status: 'unavailable' })
          return
        }
        if (result.kind === 'error') {
          setState({ status: 'run-error', message: result.stderr })
          return
        }
        const parsed = parseCommandCenterStartupOutput(result.stdout)
        if (isCommandCenterStartupParseError(parsed)) {
          setState({ status: 'parse-error', raw: parsed.raw })
          return
        }
        setState({ status: 'ready', output: parsed })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ status: 'run-error', message: error instanceof Error ? error.message : '' })
        }
      })

    return () => {
      cancelled = true
      clearTimeout(slowTimer)
    }
  }, [brainPath, attempt])

  return { state, retry }
}
