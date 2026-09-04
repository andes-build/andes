// Spec 012 criterion 9 — the whole path in the real app, with the real `claude`.
//
// Asks for something that needs a permission, allows it in one thread and denies it in another,
// and saves one screenshot per step under docs/research/.
//
// Never activates its own window: two dev instances share `build.andes.dev`, so a click or an
// `System Events` activation can steal the focus of somebody else's window. Everything here goes
// through the debugging port.
//
// Usage: node config/scripts/spec-012-functional-check.mjs

import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const outDir = path.join(rootDir, 'docs', 'research', '2026-09-04-chequeo-funcional-spec-012')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port, '127.0.0.1')
  })
}

async function pickFreePort() {
  for (let port = 9733; port < 9833; port += 1) {
    if (await isPortFree(port)) {
      return port
    }
  }
  throw new Error('no free CDP port')
}

/** Short on purpose: the local daemon listens on a Unix socket under this path and macOS caps
 *  those at ~104 characters (gotcha in CLAUDE.md). */
function createProfile() {
  const dir = mkdtempSync(path.join('/tmp', 'a12-'))
  writeFileSync(
    path.join(dir, 'orca-data.json'),
    `${JSON.stringify(
      {
        settings: {
          telemetry: {
            optedIn: false,
            installId: '00000000-0000-4000-8000-000000000000',
            existedBeforeTelemetryRelease: false
          },
          // The structured lane is behind these three; the check has to turn all of them on, and
          // simple mode is the surface the criterion is about.
          experimentalNativeChat: true,
          experimentalStructuredNativeChat: true,
          openAgentTabsInChatByDefault: true,
          interfaceMode: 'simple'
        },
        onboarding: { flowVersion: 4, closedAt: 1, outcome: 'completed', lastCompletedStep: 5 },
        ui: { contextualToursAutoEligible: false, featureTipsSeenIds: [] }
      },
      null,
      2
    )}\n`
  )
  return dir
}

async function waitForCdp(port) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 180000) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`)
      if (response.ok && (await response.json()).some?.((target) => target.type)) {
        return
      }
    } catch {
      // Not up yet.
    }
    await delay(500)
  }
  throw new Error('timed out waiting for the debugging port')
}

async function main() {
  mkdirSync(outDir, { recursive: true })
  const userDataDir = createProfile()
  const cdpPort = await pickFreePort()
  // The workspace the thread runs in: a scratch folder, so nothing the agent does touches the repo.
  const workspace = mkdtempSync(path.join('/tmp', 'a12-ws-'))
  writeFileSync(path.join(workspace, 'LEEME.md'), 'espacio de prueba de la spec 012\n')

  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  Object.assign(env, {
    NODE_ENV: 'development',
    ORCA_DEV_USER_DATA_PATH: userDataDir,
    ORCA_SKIP_DEV_WEB_PREPARE: '1',
    REMOTE_DEBUGGING_PORT: String(cdpPort),
    VITE_EXPOSE_STORE: 'true'
  })
  // HOME stays the person's own: Claude signs in against it and spec 012 does not touch that layer.
  const child = spawn(
    process.execPath,
    [path.join('config', 'scripts', 'run-electron-vite-dev.mjs')],
    { cwd: rootDir, env, stdio: ['ignore', 'pipe', 'pipe'] }
  )
  child.stdout.on('data', (chunk) => process.stdout.write(`[app] ${chunk}`))
  child.stderr.on('data', (chunk) => process.stderr.write(`[app!] ${chunk}`))

  let browser = null
  try {
    await waitForCdp(cdpPort)
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
    const page = browser.contexts().flatMap((context) => context.pages())[0]
    await page.waitForLoadState('domcontentloaded')
    const shot = (name) => page.screenshot({ path: path.join(outDir, `${name}.png`) })
    await delay(8000)
    await shot('01-app-abierta')
    console.log(`SPEC012 ${JSON.stringify({ workspace, userDataDir, cdpPort })}`)
    // The rest of the walk is driven from the session that runs this script, so each step can be
    // read before the next one: the app stays up until it is stopped.
    await delay(1000 * 60 * 30)
  } finally {
    await browser?.close().catch(() => {})
    child.kill('SIGTERM')
    await delay(2000)
    rmSync(userDataDir, { recursive: true, force: true })
  }
}

await main()
