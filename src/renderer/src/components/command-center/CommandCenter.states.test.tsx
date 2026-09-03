// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CommandCenter } from './CommandCenter'

function stubApi(runStartup: (...args: unknown[]) => unknown): void {
  ;(window as unknown as { api: unknown }).api = {
    commandCenter: { runStartup },
    onboardingBrain: { prepare: vi.fn().mockResolvedValue({ alreadyPrepared: true, added: [] }) }
  }
}

afterEach(() => {
  cleanup()
  delete (window as unknown as { api?: unknown }).api
})

describe('spec009#7 CommandCenter — uncomfortable states', () => {
  it('shows a message and a way forward for an unprepared folder, never a blank screen', async () => {
    stubApi(() => Promise.resolve({ kind: 'not-prepared' }))
    render(<CommandCenter brainPath="/brain" worktreeId="w1" />)

    await waitFor(() => expect(screen.getByText("This folder isn't set up yet")).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Prepare this folder' })).toBeTruthy()
  })

  it('shows a message and a Retry for a failed scan, never the raw stderr', async () => {
    stubApi(() =>
      Promise.resolve({
        kind: 'error',
        stderr: 'session-start.sh: line 42: python3: not found',
        code: 1
      })
    )
    render(<CommandCenter brainPath="/brain" worktreeId="w1" />)

    await waitFor(() => expect(screen.getByText("Couldn't read your workspace")).toBeTruthy())
    expect(screen.queryByText(/python3/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
  })

  it('renders every card in its own empty state for a genuinely empty scan', async () => {
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
      '  identity 40/40 · resolver 3 rows',
      '  no findings',
      '2 nodes · 0.1s'
    ].join('\n')
    stubApi(() => Promise.resolve({ kind: 'ok', stdout }))
    render(<CommandCenter brainPath="/brain" worktreeId="w1" />)

    await waitFor(() => expect(screen.getByText('Nothing is waiting on you.')).toBeTruthy())
    expect(screen.getByText('Nothing in progress.')).toBeTruthy()
    // Checks always carries the identity bookkeeping row ahead of "no findings",
    // so it never hits its own translated empty state — it shows the raw row.
    expect(screen.getAllByText('no findings').length).toBeGreaterThan(0)
    expect(screen.getByText('Nothing urgent. Open a thread whenever you want.')).toBeTruthy()
  })
})
