import { beforeEach, describe, expect, it, vi } from 'vitest'

const openNewThread = vi.fn()

vi.mock('@/components/sidebar/workspace-scope/open-new-thread', () => ({
  openNewThread: (...args: unknown[]) => openNewThread(...args)
}))

import { openCommandCenterThread } from './command-center-agent-launch'

/**
 * Spec 009, criterion 6, resolved against the thread that landed in `main`:
 * a Command Center button opens a *thread* — the same one the New thread
 * button opens — with the first message already written. It never builds a
 * second launch path of its own, which is what would silently lose the
 * conversation-capable agent (spec 016) and the stamped scope (spec 019).
 */
describe('spec009#6 openCommandCenterThread', () => {
  beforeEach(() => {
    openNewThread.mockReset()
    openNewThread.mockResolvedValue(true)
  })

  it('opens a thread, handing the clicked item over as the seed message', async () => {
    await openCommandCenterThread('Help me resolve "migracion-kyc" — it is waiting on you.')

    expect(openNewThread).toHaveBeenCalledTimes(1)
    expect(openNewThread).toHaveBeenCalledWith({
      seedMessage: 'Help me resolve "migracion-kyc" — it is waiting on you.'
    })
  })

  it('reports the thread that could not start instead of swallowing it', async () => {
    openNewThread.mockResolvedValue(false)
    await expect(openCommandCenterThread('anything')).resolves.toBe(false)
  })
})
