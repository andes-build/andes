/**
 * Spec 015: en modo simple, "New thread" lanza el agente detectado y la
 * conversación recibe su respuesta.
 *
 * El fallo que esta prueba fija: hasta la spec 015, "New thread" creaba una
 * pestaña de terminal con la vista de chat encima y nunca encolaba el comando
 * de arranque del agente, así que el PTY abría un shell pelado. Lo escrito no
 * llegaba a ningún agente y nada se dibujaba de vuelta.
 *
 * El agente es el stub dorado con `--transcript`: cada línea enviada se
 * responde en una transcripción con formato Claude, así el ida y vuelta es
 * real y determinístico, sin gastar crédito de una sesión en vivo.
 */

import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test, expect } from './helpers/orca-app'
import { waitForActiveWorktree, waitForSessionReady } from './helpers/store'
import { waitForActivePaneHookDescriptor } from './helpers/terminal'
import { configureGoldenStubAgent, getGoldenStubAgentLaunchEnv } from './helpers/golden-stub-agent'

test.describe('Simple mode — el hilo responde (spec 015)', () => {
  test.use({
    launchEnv: { ...getGoldenStubAgentLaunchEnv(), ANDES_INTERFACE_MODE: 'simple' },
    orcaAppExtraArgs: ['--lang=en-US']
  })

  test('spec015#5 New thread lanza el agente y la respuesta llega a la conversación', async ({
    orcaPage
  }) => {
    const transcriptDir = mkdtempSync(path.join(os.tmpdir(), 'andes-spec015-'))
    const transcriptPath = path.join(transcriptDir, 'thread.jsonl')
    const sessionId = randomUUID()
    writeFileSync(transcriptPath, '')

    try {
      await waitForSessionReady(orcaPage)
      await waitForActiveWorktree(orcaPage)
      await configureGoldenStubAgent(orcaPage, {
        agent: 'claude',
        agentArgs: `--transcript ${transcriptPath} --session ${sessionId}`
      })

      const tabsBefore = await orcaPage.evaluate(() => {
        const state = window.__store!.getState()
        return (state.tabsByWorktree[state.activeWorktreeId!] ?? []).length
      })

      await orcaPage.locator('[data-testid="simple-mode-nav-new-thread"]').click()

      // La pestaña nueva nace con el agente puesto y con un comando de arranque
      // encolado: eso es lo que la distingue de un shell pelado.
      await expect
        .poll(
          () =>
            orcaPage.evaluate(() => {
              const state = window.__store!.getState()
              const tabs = state.tabsByWorktree[state.activeWorktreeId!] ?? []
              return tabs.at(-1)?.launchAgent ?? null
            }),
          { timeout: 20_000 }
        )
        .toBe('claude')
      expect(
        await orcaPage.evaluate(() => {
          const state = window.__store!.getState()
          return (state.tabsByWorktree[state.activeWorktreeId!] ?? []).length
        })
      ).toBe(tabsBefore + 1)

      const chatRoot = orcaPage.locator('[data-native-chat-root="true"]')
      await expect(chatRoot).toBeVisible({ timeout: 20_000 })

      // El hilo no tiene hook que le declare la transcripción del stub, así que
      // se la apuntamos: es el mismo patrón de
      // `native-chat-ask-user-question-card.spec.ts`.
      const descriptor = await waitForActivePaneHookDescriptor(orcaPage)
      await orcaPage.evaluate(
        ({ paneKey, worktreeId, sessionId, transcriptPath }) => {
          window
            .__store!.getState()
            .setAgentStatus(
              paneKey,
              { state: 'working', agentType: 'claude', prompt: 'spec 015' },
              'Claude',
              undefined,
              { worktreeId },
              { providerSession: { key: 'session_id', id: sessionId, transcriptPath } }
            )
        },
        {
          paneKey: descriptor.paneKey,
          worktreeId: descriptor.worktreeId,
          sessionId,
          transcriptPath
        }
      )

      const composer = chatRoot.getByRole('textbox').first()
      await composer.click()
      await composer.fill('hola')
      await composer.press('Enter')

      await expect(orcaPage.getByText('GOLDEN_STUB_REPLY to: hola')).toBeVisible({
        timeout: 30_000
      })
    } finally {
      rmSync(transcriptDir, { recursive: true, force: true })
    }
  })
})
