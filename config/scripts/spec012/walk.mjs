// Spec 012, criterion 9 — drives the running dev app over the debugging port.
//
// Steps are separate invocations on purpose: the session that runs this reads each one before the
// next, and the app stays up in between. Never activates the window (see the sibling launcher).
//
// Usage: node config/scripts/spec012/walk.mjs <cdpPort> <step> [arg]
import { chromium } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [port, step, arg] = process.argv.slice(2)
const rootDir = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const outDir = path.join(rootDir, 'docs', 'research', '2026-09-04-chequeo-funcional-spec-012')
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`)
const page = browser.contexts().flatMap((c) => c.pages())[0]
const shot = (name) => page.screenshot({ path: path.join(outDir, `${name}.png`) })

const state = () =>
  page.evaluate(() => {
    const s = window.__store.getState()
    const w = s.activeWorktreeId
    return {
      worktree: w,
      activeTabType: s.activeTabType,
      unifiedTabs: (s.unifiedTabsByWorktree?.[w] ?? []).map((t) => ({
        id: t.id,
        contentType: t.contentType,
        agent: t.agentSessionAgent
      })),
      approvalCards: Array.from(document.querySelectorAll('[data-native-chat-approval-card]')).map(
        (n) => n.textContent
      ),
      text: document.body.innerText.slice(-1200)
    }
  })

if (step === 'setup') {
  await shot('01-app-abierta')
  await page.evaluate(async (folder) => {
    const s = window.__store.getState()
    await s.updateSettings({ defaultTuiAgent: 'claude' })
    await s.addNonGitFolder(folder)
  }, arg)
  await page.waitForTimeout(4000)
  await shot('02-carpeta-agregada')
} else if (step === 'thread') {
  await page.getByTestId('simple-mode-nav-new-thread').click()
  await page.waitForTimeout(20000)
} else if (step === 'ask') {
  const composer = page.getByPlaceholder(/message/i).last()
  await composer.click()
  await composer.fill(arg)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(25000)
} else if (step === 'click') {
  await page
    .getByRole('button', { name: new RegExp(arg, 'i') })
    .last()
    .click()
  await page.waitForTimeout(15000)
} else if (step?.startsWith('shot:')) {
  await shot(step.slice('shot:'.length))
}
console.log(JSON.stringify(await state(), null, 2))
await browser.close()
