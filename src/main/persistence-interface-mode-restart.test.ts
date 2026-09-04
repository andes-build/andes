import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rmSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { PersistedState } from '../shared/persisted-state-types'
import { getDefaultPersistedState } from '../shared/constants'
import { testState, createStore, writeDataFile, readDataFile } from './persistence-test-harness'

vi.mock('electron', () => ({
  app: { getPath: () => testState.dir },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (plaintext: string) => Buffer.from(`encrypted:${plaintext}`, 'utf-8'),
    decryptString: (ciphertext: Buffer) => ciphertext.toString('utf-8').slice('encrypted:'.length)
  }
}))
vi.mock('./ssh/ssh-config-parser', () => ({
  loadUserSshConfig: () => [],
  sshConfigHostsToTargets: () => []
}))
vi.mock('./telemetry/client', () => ({ track: vi.fn() }))
vi.mock('./telemetry/cohort-classifier', () => ({ getCohortAtEmit: () => ({}) }))

function persistedWithMode(mode: string): PersistedState {
  const base = getDefaultPersistedState(testState.dir)
  return { ...base, settings: { ...base.settings, interfaceMode: mode } } as PersistedState
}

function diskInterfaceMode(): unknown {
  return (readDataFile() as { settings?: { interfaceMode?: unknown } }).settings?.interfaceMode
}

describe('interfaceMode across a restart', () => {
  beforeEach(() => {
    testState.dir = mkdtempSync(join(tmpdir(), 'orca-test-'))
    delete process.env.ANDES_INTERFACE_MODE
  })
  afterEach(() => {
    delete process.env.ANDES_INTERFACE_MODE
    rmSync(testState.dir, { recursive: true, force: true })
  })

  it('keeps simple on disk when a later save happens with no env override', async () => {
    writeDataFile(persistedWithMode('simple'))
    const store = await createStore()
    expect(store.getSettings().interfaceMode).toBe('simple')
    store.updateSettings({ theme: 'dark' })
    store.flushOrThrow()
    expect(diskInterfaceMode()).toBe('simple')
  })

  it('REPRO: the env override must not be written back to disk', async () => {
    writeDataFile(persistedWithMode('simple'))
    process.env.ANDES_INTERFACE_MODE = 'developer'
    const store = await createStore()
    expect(store.getSettings().interfaceMode).toBe('developer')
    store.updateSettings({ theme: 'dark' })
    store.flushOrThrow()
    expect(diskInterfaceMode()).toBe('simple')
  })
})
