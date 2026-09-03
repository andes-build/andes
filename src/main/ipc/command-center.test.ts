import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const handlers = new Map<string, (event: unknown, args: unknown) => unknown>()

vi.mock('electron', () => ({
  ipcMain: {
    removeHandler: vi.fn(),
    handle: (channel: string, listener: (event: unknown, args: unknown) => unknown) => {
      handlers.set(channel, listener)
    }
  },
  app: { isPackaged: false, getAppPath: () => process.cwd() }
}))

import { registerCommandCenterHandlers } from './command-center'

describe('spec009#7 commandCenter:runStartup — not-prepared', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'andes-command-center-ipc-'))
    handlers.clear()
    registerCommandCenterHandlers()
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('reports not-prepared for a folder missing .os/core, without running the script', async () => {
    const brainPath = join(tempDir, 'plain-folder')
    mkdirSync(brainPath, { recursive: true })
    const handler = handlers.get('commandCenter:runStartup')
    if (!handler) {
      throw new Error('handler not registered')
    }

    const result = await handler(null, { brainPath, scope: { type: 'root' } })

    expect(result).toEqual({ kind: 'not-prepared' })
  })
})
