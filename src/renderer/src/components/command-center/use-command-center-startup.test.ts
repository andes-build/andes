// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  COMMAND_CENTER_SLOW_THRESHOLD_MS,
  useCommandCenterStartup
} from './use-command-center-startup'

function stubCommandCenterApi(runStartup: (...args: unknown[]) => unknown): void {
  ;(window as unknown as { api: unknown }).api = { commandCenter: { runStartup } }
}

describe('spec009#8 useCommandCenterStartup — loading timer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    delete (window as unknown as { api?: unknown }).api
  })

  it('starts loading without the slow flag', () => {
    stubCommandCenterApi(() => new Promise(() => {}))
    const { result } = renderHook(() => useCommandCenterStartup({ brainPath: '/brain' }))
    expect(result.current.state).toEqual({ status: 'loading', slow: false })
  })

  it('flips to slow after the threshold when the scan has not resolved', () => {
    stubCommandCenterApi(() => new Promise(() => {}))
    const { result } = renderHook(() => useCommandCenterStartup({ brainPath: '/brain' }))
    act(() => {
      vi.advanceTimersByTime(COMMAND_CENTER_SLOW_THRESHOLD_MS)
    })
    expect(result.current.state).toEqual({ status: 'loading', slow: true })
  })

  it('never flips to slow once the scan has resolved', async () => {
    stubCommandCenterApi(() => Promise.resolve({ kind: 'unavailable' }))
    const { result } = renderHook(() => useCommandCenterStartup({ brainPath: '/brain' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.state).toEqual({ status: 'unavailable' })
    act(() => {
      vi.advanceTimersByTime(COMMAND_CENTER_SLOW_THRESHOLD_MS)
    })
    expect(result.current.state).toEqual({ status: 'unavailable' })
  })
})

describe('spec009#7 useCommandCenterStartup — result states', () => {
  afterEach(() => {
    delete (window as unknown as { api?: unknown }).api
  })

  it('reports not-prepared', async () => {
    stubCommandCenterApi(() => Promise.resolve({ kind: 'not-prepared' }))
    const { result } = renderHook(() => useCommandCenterStartup({ brainPath: '/brain' }))
    await waitFor(() => expect(result.current.state.status).toBe('not-prepared'))
  })

  it('reports a run-error without the raw stderr leaking as UI copy', async () => {
    stubCommandCenterApi(() =>
      Promise.resolve({ kind: 'error', stderr: 'boom: python3 missing', code: 1 })
    )
    const { result } = renderHook(() => useCommandCenterStartup({ brainPath: '/brain' }))
    await waitFor(() => expect(result.current.state.status).toBe('run-error'))
  })

  it('reports a parse-error when the four sections are missing', async () => {
    stubCommandCenterApi(() => Promise.resolve({ kind: 'ok', stdout: 'garbage output' }))
    const { result } = renderHook(() => useCommandCenterStartup({ brainPath: '/brain' }))
    await waitFor(() => expect(result.current.state.status).toBe('parse-error'))
  })

  it('parses a well-formed scan into ready', async () => {
    const stdout = [
      'Waiting for your decision',
      '  nothing is waiting on you',
      '',
      'In progress',
      '  nothing in progress',
      '',
      'Queued',
      '  next 0 · later 0',
      '',
      'Checks',
      '  no findings',
      '0 nodes · 0.0s'
    ].join('\n')
    stubCommandCenterApi(() => Promise.resolve({ kind: 'ok', stdout }))
    const { result } = renderHook(() => useCommandCenterStartup({ brainPath: '/brain' }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))
  })

  it('retry() re-runs the scan', async () => {
    const runStartup = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'unavailable' })
      .mockResolvedValueOnce({ kind: 'not-prepared' })
    stubCommandCenterApi(runStartup)
    const { result } = renderHook(() => useCommandCenterStartup({ brainPath: '/brain' }))
    await waitFor(() => expect(result.current.state.status).toBe('unavailable'))
    act(() => {
      result.current.retry()
    })
    await waitFor(() => expect(result.current.state.status).toBe('not-prepared'))
    expect(runStartup).toHaveBeenCalledTimes(2)
  })
})
