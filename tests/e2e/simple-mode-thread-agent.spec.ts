/**
 * Spec 016: en modo simple, "New thread" lanza un agente con conversación y
 * nunca con un argumento de omisión de permisos.
 *
 * Los dos fallos que estas pruebas fijan, vistos por Peter en la app:
 *
 * 1. El hilo abría "Terminal 2" corriendo `agy '--dangerously-skip-permissions'`
 *    —Antigravity, el agente por omisión de la máquina—, que no tiene
 *    conversación, así que el modo simple mostraba la terminal cruda.
 * 2. Ese argumento anula el pedido de permiso: sin pregunta del agente no hay
 *    tarjeta de permitir/rechazar.
 *
 * La detección se siembra en el store en vez de depender de qué binarios haya
 * en el PATH de la máquina que corre la prueba: lo que se prueba es la decisión
 * del modo simple, no el detector.
 */

import { test, expect } from './helpers/orca-app'
import { waitForActiveWorktree, waitForSessionReady } from './helpers/store'
import { configureGoldenStubAgent, getGoldenStubAgentLaunchEnv } from './helpers/golden-stub-agent'

/** Deja la detección de agentes con exactamente esta lista, para cualquier contexto. */
async function seedDetectedAgents(
  orcaPage: Parameters<typeof waitForActiveWorktree>[0],
  agents: string[]
): Promise<void> {
  await orcaPage.evaluate(async (agents) => {
    const store = window.__store!
    const worktreeId = store.getState().activeWorktreeId
    await store.getState().ensureDetectedAgents(worktreeId)
    const byContext = { ...store.getState().localDetectedAgentIdsByContext }
    for (const key of Object.keys(byContext)) {
      byContext[key] = agents as never
    }
    store.setState({ detectedAgentIds: agents as never, localDetectedAgentIdsByContext: byContext })
  }, agents)
}

function countTabs(orcaPage: Parameters<typeof waitForActiveWorktree>[0]): Promise<number> {
  return orcaPage.evaluate(() => {
    const state = window.__store!.getState()
    return (state.tabsByWorktree[state.activeWorktreeId!] ?? []).length
  })
}

test.describe('Simple mode — el hilo usa el agente correcto (spec 016)', () => {
  test.use({
    launchEnv: { ...getGoldenStubAgentLaunchEnv(), ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test('spec016#7 el comando lanzado no lleva ningún argumento de omisión de permisos', async ({
    orcaPage
  }) => {
    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)
    await configureGoldenStubAgent(orcaPage, {
      agent: 'claude',
      agentArgs: '--dangerously-skip-permissions --model opus'
    })
    // El agente por omisión de la máquina es Antigravity: el hilo tiene que
    // ignorarlo porque no tiene conversación.
    await orcaPage.evaluate(async () => {
      await window.__store!.getState().updateSettings({ defaultTuiAgent: 'antigravity' })
    })
    await seedDetectedAgents(orcaPage, ['antigravity', 'claude'])

    await orcaPage.locator('[data-testid="simple-mode-nav-new-thread"]').click()

    await expect
      .poll(
        () =>
          orcaPage.evaluate(() => {
            const state = window.__store!.getState()
            const tab = (state.tabsByWorktree[state.activeWorktreeId!] ?? []).at(-1)
            return tab && state.pendingStartupByTabId?.[tab.id] ? (tab.launchAgent ?? null) : null
          }),
        { timeout: 20_000 }
      )
      .toBe('claude')

    const launch = await orcaPage.evaluate(() => {
      const state = window.__store!.getState()
      const tab = (state.tabsByWorktree[state.activeWorktreeId!] ?? []).at(-1)!
      const startup = state.pendingStartupByTabId![tab.id]!
      return {
        agent: tab.launchAgent ?? null,
        command: String(startup.command),
        argsOverride: startup.agentArgsOverride ?? null
      }
    })

    expect(launch.agent).toBe('claude')
    expect(launch.command).not.toContain('--dangerously-skip-permissions')
    expect(launch.command).not.toContain('agy')
    expect(launch.argsOverride).toBe('--model opus')

    // Ningún argumento de omisión de permisos de ningún agente del catálogo.
    const bypassFound = await orcaPage.evaluate((command) => {
      const args = [
        '--dangerously-skip-permissions',
        '--dangerously-bypass-approvals-and-sandbox',
        '--yolo',
        '--yes-always',
        '--dangerously-allow-all',
        '--trust-all-tools',
        '--unrestricted',
        '--auto-approve',
        '--approval-mode yolo',
        '--permission-mode bypassPermissions',
        '--permission-mode bypass',
        '--auto high'
      ]
      return args.filter((arg) => command.includes(arg))
    }, launch.command)
    expect(bypassFound).toEqual([])

    await expect(orcaPage.locator('[data-native-chat-root="true"]')).toBeVisible({
      timeout: 20_000
    })
  })

  test('spec016#8 sin agente con conversación no abre terminal: avisa y ofrece una acción', async ({
    orcaPage
  }) => {
    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)
    await orcaPage.evaluate(async () => {
      await window.__store!.getState().updateSettings({ defaultTuiAgent: 'antigravity' })
    })
    await seedDetectedAgents(orcaPage, ['antigravity', 'gemini'])
    const tabsBefore = await countTabs(orcaPage)

    await orcaPage.locator('[data-testid="simple-mode-nav-new-thread"]').click()

    await expect(orcaPage.getByText('Claude Code is not installed')).toBeVisible({
      timeout: 20_000
    })
    await expect(
      orcaPage.locator('[data-sonner-toast]').getByRole('button', { name: 'Agents & skills' })
    ).toBeVisible()
    expect(await countTabs(orcaPage)).toBe(tabsBefore)
  })
})
