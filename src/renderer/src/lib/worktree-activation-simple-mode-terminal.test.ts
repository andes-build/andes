/**
 * Spec 016. Agregar una carpeta en modo simple abría "Terminal 1" sola: la
 * activación sembraba una terminal cuando el espacio no tenía ninguna pestaña.
 * En modo simple esa superficie no existe — el hilo se abre a propósito desde
 * "New thread"—, y en modo desarrollo nada cambia.
 */

import { describe, expect, it } from 'vitest'
import { ensureWorktreeHasInitialTerminal } from './worktree-initial-terminal-seeding'
import {
  createMockStore,
  registerWorktreeActivationReset
} from './worktree-activation-test-harness'

registerWorktreeActivationReset()

describe('ensureWorktreeHasInitialTerminal (spec 016)', () => {
  it('spec016#5 simple mode seeds no terminal on activation', () => {
    const store = createMockStore({ settings: { interfaceMode: 'simple' } })

    const tabId = ensureWorktreeHasInitialTerminal(store, 'wt-1')

    expect(tabId).toBeNull()
    expect(store.createTab).not.toHaveBeenCalled()
  })

  it('spec016#5 simple mode still creates the surface explicit launch work asks for', () => {
    const store = createMockStore({ settings: { interfaceMode: 'simple' } })

    ensureWorktreeHasInitialTerminal(store, 'wt-1', { command: 'claude' })

    expect(store.createTab).toHaveBeenCalled()
    expect(store.queueTabStartupCommand).toHaveBeenCalledWith('tab-1', { command: 'claude' })
  })

  it('spec016#6 developer mode keeps seeding its terminal', () => {
    const store = createMockStore({ settings: { interfaceMode: 'developer' } })

    ensureWorktreeHasInitialTerminal(store, 'wt-1')

    expect(store.createTab).toHaveBeenCalledWith('wt-1', undefined, undefined, {
      pendingActivationSpawn: true
    })
  })
})
