/**
 * Spec 011 (etapa 1, recortada por la sesión supervisora 2026-09-03): en modo
 * simple, crear un hilo abre la conversación —no una terminal—, se puede
 * escribir y la conversación sigue viva entre vueltas (criterio 1), y la
 * tarjeta de permiso funciona de punta a punta sobre el puente que ya existe
 * hoy (`NativeChatInteractiveCard` → PTY): permitir escribe "1" en el agente,
 * rechazar escribe ESC, y en los dos casos la conversación sigue (criterio
 * 2a). Usa el agente de stub dorado como agente `claude`, así el resultado es
 * determinístico: el criterio 0 de esta spec ya estableció que hoy el permiso
 * llega leyendo la pantalla y mandando teclas, así que probarlo con datos
 * inyectados en el store —el mismo patrón que
 * `native-chat-ask-user-question-card.spec.ts`— ejercita exactamente el
 * camino real sin depender de una sesión de Claude en vivo con crédito real.
 */

import { test, expect } from './helpers/orca-app'
import { waitForActivePaneHookDescriptor } from './helpers/terminal'
import { getActiveTabId, waitForActiveWorktree, waitForSessionReady } from './helpers/store'
import {
  configureGoldenStubAgent,
  getGoldenStubAgentLaunchEnv,
  GOLDEN_STUB_AGENTS,
  launchGoldenStubAgentFromNewTab
} from './helpers/golden-stub-agent'
import {
  clearTerminalPtyWriteLog,
  installTerminalPtyWriteSpy,
  readTerminalPtyWrites
} from './helpers/terminal-pty-write-spy'

const CLAUDE_MENU_ITEM = GOLDEN_STUB_AGENTS.find((agent) => agent.id === 'claude')!.menuItemName

test.describe('Simple mode — el hilo (spec 011, etapa 1)', () => {
  test.use({
    launchEnv: { ...getGoldenStubAgentLaunchEnv(), ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test('crear un hilo abre la conversación, se escribe y el agente responde entre vueltas (criterio 1)', async ({
    orcaPage,
    electronApp
  }) => {
    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)
    await installTerminalPtyWriteSpy(electronApp)
    await configureGoldenStubAgent(orcaPage, { agent: 'claude' })
    await launchGoldenStubAgentFromNewTab(orcaPage, CLAUDE_MENU_ITEM)

    // Simple mode: the new thread opens as a conversation on its own — no
    // toggle to chat view. The newly launched tab is the active one, so its
    // content is what the operator sees; a pre-existing "Terminal 1" tab from
    // before this thread is a separate, unrelated surface (still mounted in
    // the background, as any inactive tab is) and is out of scope here.
    const activeTab = orcaPage.locator('[data-testid="sortable-tab"][data-active="true"]')
    await expect(activeTab).toHaveAttribute('data-tab-title', /Golden Stub Agent|Claude/i)
    await expect(orcaPage.locator('[data-native-chat-root="true"]')).toBeVisible({
      timeout: 15_000
    })
    const tabIdAfterLaunch = await getActiveTabId(orcaPage)

    // Two turns, same thread: each send actually reaches the agent's PTY (the
    // path this etapa keeps, per criterion 0), the tab identity never changes
    // (no reset), and the conversation surface stays mounted throughout.
    const chatRoot = orcaPage.locator('[data-native-chat-root="true"]')
    const composer = chatRoot.getByRole('textbox').first()
    await clearTerminalPtyWriteLog(electronApp)
    await composer.click()
    await composer.fill('Tabs or spaces?')
    await composer.press('Enter')
    await expect
      .poll(() => readTerminalPtyWrites(electronApp).then((writes) => writes.join('')))
      .toContain('Tabs or spaces?')
    await expect(chatRoot).toBeVisible()
    expect(await getActiveTabId(orcaPage)).toBe(tabIdAfterLaunch)

    await clearTerminalPtyWriteLog(electronApp)
    await composer.click()
    await composer.fill('And now?')
    await composer.press('Enter')
    await expect
      .poll(() => readTerminalPtyWrites(electronApp).then((writes) => writes.join('')))
      .toContain('And now?')
    await expect(chatRoot).toBeVisible()
    expect(await getActiveTabId(orcaPage)).toBe(tabIdAfterLaunch)
  })

  test('la tarjeta de permiso: permitir corre la herramienta, rechazar la frena, la conversación sigue (criterio 2a)', async ({
    orcaPage,
    electronApp
  }) => {
    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)
    await installTerminalPtyWriteSpy(electronApp)
    await configureGoldenStubAgent(orcaPage, { agent: 'claude' })
    await launchGoldenStubAgentFromNewTab(orcaPage, CLAUDE_MENU_ITEM)
    await expect(orcaPage.locator('[data-native-chat-root="true"]')).toBeVisible({
      timeout: 15_000
    })

    const descriptor = await waitForActivePaneHookDescriptor(orcaPage)

    // Distinct summaries per call: the card dismisses by content key once
    // answered (mobile parity), so an identical re-seed would stay hidden.
    async function seedApproval(summary: string): Promise<void> {
      await orcaPage.evaluate(
        ({ paneKey, summary }) => {
          window.__store!.getState().setAgentStatus(
            paneKey,
            {
              state: 'working',
              agentType: 'claude',
              prompt: `Write ${summary}`,
              interactivePrompt: JSON.stringify({ approval: { tool: 'Write', summary } })
            },
            'Claude'
          )
        },
        { paneKey: descriptor.paneKey, summary }
      )
    }

    // Deny: the card renders in result-language and its second button writes
    // the literal ESC byte back to the agent — the card never sends a raw path.
    await seedApproval('apunte-de-prueba-1.md')
    await expect(orcaPage.getByText('Allow Write?')).toBeVisible({ timeout: 10_000 })
    await clearTerminalPtyWriteLog(electronApp)
    await orcaPage.getByRole('button', { name: 'Deny' }).click()
    await expect
      .poll(() => readTerminalPtyWrites(electronApp))
      .toEqual(expect.arrayContaining(['\x1b']))
    await expect(orcaPage.getByText('Allow Write?')).toHaveCount(0, { timeout: 10_000 })
    // The conversation survives the denial: the composer is still there.
    await expect(
      orcaPage.locator('[data-native-chat-root="true"]').getByRole('textbox').first()
    ).toBeVisible()

    // Allow: the first button writes "1" — the option that lets the tool run.
    await seedApproval('apunte-de-prueba-2.md')
    await expect(orcaPage.getByText('Allow Write?')).toBeVisible({ timeout: 10_000 })
    await clearTerminalPtyWriteLog(electronApp)
    await orcaPage.getByRole('button', { name: 'Allow' }).click()
    await expect
      .poll(() => readTerminalPtyWrites(electronApp))
      .toEqual(expect.arrayContaining(['1']))
    await expect(orcaPage.getByText('Allow Write?')).toHaveCount(0, { timeout: 10_000 })
    await expect(
      orcaPage.locator('[data-native-chat-root="true"]').getByRole('textbox').first()
    ).toBeVisible()
  })
})
