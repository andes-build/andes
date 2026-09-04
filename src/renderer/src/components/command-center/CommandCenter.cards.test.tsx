// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  isCommandCenterStartupParseError,
  parseCommandCenterStartupOutput
} from '../../../../shared/command-center-startup-output'
import { CommandCenterWaitingCard } from './CommandCenterWaitingCard'
import { CommandCenterInProgressCard } from './CommandCenterInProgressCard'
import { CommandCenterQueueCard } from './CommandCenterQueueCard'
import { CommandCenterChecksCard } from './CommandCenterChecksCard'

const FIXTURES_DIR = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'shared',
  '__fixtures__',
  'command-center-startup-output'
)

function loadFullOutput() {
  const raw = readFileSync(join(FIXTURES_DIR, 'full.txt'), 'utf8')
  const parsed = parseCommandCenterStartupOutput(raw)
  if (isCommandCenterStartupParseError(parsed)) {
    throw new Error('fixture failed to parse')
  }
  return parsed
}

afterEach(() => {
  cleanup()
})

describe('spec009#3 CommandCenterWaitingCard — primary card', () => {
  it('renders the initiative name, what it is waiting on, and a Resolve button per row', () => {
    const output = loadFullOutput()
    const onResolve = vi.fn()
    render(<CommandCenterWaitingCard section={output.waiting} onResolve={onResolve} />)

    expect(screen.getByText('migracion-kyc')).toBeTruthy()
    expect(screen.getByText('waiting on you')).toBeTruthy()
    const button = screen.getByRole('button', { name: 'Resolve' })
    fireEvent.click(button)
    expect(onResolve).toHaveBeenCalledWith('migracion-kyc — waiting on you')
  })

  it('carries the primary-size marker so it renders larger than the other cards', () => {
    const output = loadFullOutput()
    const { container } = render(
      <CommandCenterWaitingCard section={output.waiting} onResolve={() => {}} />
    )
    const card = container.querySelector('[data-command-center-card="waiting"]')
    expect(card?.getAttribute('data-command-center-card-size')).toBe('primary')
    expect(card?.className).toContain('col-span-3')
  })
})

describe('spec009#4 the three secondary cards', () => {
  it('In progress shows the section content as-is', () => {
    const output = loadFullOutput()
    render(<CommandCenterInProgressCard section={output.inProgress} />)
    expect(screen.getByText('checkout-link · now · active')).toBeTruthy()
  })

  it('Queued shows the next/later counts and the backlog line', () => {
    const output = loadFullOutput()
    render(<CommandCenterQueueCard section={output.queue} />)
    expect(screen.getByText('1', { selector: 'div' })).toBeTruthy()
    expect(screen.getByText('backlog: 1 ready of 1 pending')).toBeTruthy()
  })

  it('Checks shows each finding with a View button', () => {
    const output = loadFullOutput()
    const onView = vi.fn()
    render(<CommandCenterChecksCard section={output.checks} onView={onView} />)
    expect(screen.getByText('capability not installed: position role "cpo"')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0])
    expect(onView).toHaveBeenCalledWith('identity 9/40 · resolver 4 rows')
  })

  it('all three secondary cards carry the secondary-size marker', () => {
    const output = loadFullOutput()
    const { container: inProgress } = render(
      <CommandCenterInProgressCard section={output.inProgress} />
    )
    const { container: queue } = render(<CommandCenterQueueCard section={output.queue} />)
    const { container: checks } = render(
      <CommandCenterChecksCard section={output.checks} onView={() => {}} />
    )
    for (const container of [inProgress, queue, checks]) {
      const card = container.querySelector('[data-command-center-card-size]')
      expect(card?.getAttribute('data-command-center-card-size')).toBe('secondary')
    }
  })
})
