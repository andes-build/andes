// Spec 024 criterion 10 — the whole path in the real app: open Files, open a document, write on it,
// leave, come back, and check the disk. One screenshot per step under docs/research/.
//
// Never activates its own window: two dev instances share `build.andes.dev`, so a click or an
// `System Events` activation can steal the focus of somebody else's window (gotcha in CLAUDE.md).
// Everything here goes through the debugging port.
//
// It writes only inside a scratch folder it creates in /tmp. It never touches anyone's own folder.
//
// Usage: node config/scripts/spec-024-functional-check.mjs

import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const outDir = path.join(rootDir, 'docs', 'research', '2026-09-04-chequeo-funcional-spec-024')
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
  for (let port = 9834; port < 9934; port += 1) {
    if (await isPortFree(port)) {
      return port
    }
  }
  throw new Error('no free CDP port')
}

/** Short on purpose: the local daemon listens on a Unix socket under this path and macOS caps
 *  those at ~104 characters (gotcha in CLAUDE.md). */
function createProfile() {
  const dir = mkdtempSync(path.join('/tmp', 'a24-'))
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

/** A scratch folder shaped like the folder Andes opens: one workspace with its documents. */
function createFolder() {
  const dir = mkdtempSync(path.join('/tmp', 'a24-f-'))
  const workspace = path.join(dir, 'workspaces', 'demo')
  mkdirSync(workspace, { recursive: true })
  writeFileSync(path.join(workspace, 'README.md'), '# Demo\n\nWhat it is.\n')
  writeFileSync(path.join(workspace, 'decisions.md'), '# Decisions\n\nAs it was on disk.\n')
  writeFileSync(path.join(workspace, 'orca.yaml'), 'a: 1\n')
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
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  const userDataDir = createProfile()
  const folder = createFolder()
  const documentPath = path.join(folder, 'workspaces', 'demo', 'decisions.md')
  const cdpPort = await pickFreePort()

  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  Object.assign(env, {
    NODE_ENV: 'development',
    ORCA_DEV_USER_DATA_PATH: userDataDir,
    ORCA_SKIP_DEV_WEB_PREPARE: '1',
    REMOTE_DEBUGGING_PORT: String(cdpPort),
    VITE_EXPOSE_STORE: 'true'
  })
  const child = spawn(
    process.execPath,
    [path.join('config', 'scripts', 'run-electron-vite-dev.mjs')],
    {
      cwd: rootDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )
  child.stdout.on('data', (chunk) => process.stdout.write(`[app] ${chunk}`))
  child.stderr.on('data', (chunk) => process.stderr.write(`[app!] ${chunk}`))

  let browser = null
  let failure = null
  try {
    await waitForCdp(cdpPort)
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
    const page = browser.contexts().flatMap((context) => context.pages())[0]
    await page.waitForLoadState('domcontentloaded')
    const shot = (name) => page.screenshot({ path: path.join(outDir, `${name}.png`) })
    await delay(9000)
    await shot('01-app-abierta')

    // Open the scratch folder the same way the onboarding step does.
    await page.evaluate(async (folderPath) => {
      const store = window.__store.getState()
      const group = await store.createProjectGroup('Demo')
      const workspace = await store.createFolderWorkspace({
        projectGroupId: group.id,
        name: 'Demo',
        folderPath
      })
      window.__store.getState().setActiveFolderWorkspace(workspace.id)
      window.__store.getState().setActiveView('terminal')
    }, folder)
    await delay(4000)
    await shot('02-carpeta-abierta')

    await page.getByTestId('workspace-scope-selector').click()
    await delay(500)
    await page.getByTestId('workspace-scope-option-demo').click()
    await delay(1500)
    await page.getByTestId('simple-mode-nav-files').click()
    await page.getByTestId('workspace-file-tree').waitFor({ timeout: 20000 })
    await delay(1500)
    await shot('03-pantalla-de-archivos')

    await page.getByTestId('workspace-file-tree').getByText('Decisions').click()
    await page.getByTestId('workspace-file-editor').waitFor({ timeout: 20000 })
    await delay(1500)
    await shot('04-documento-abierto-con-formato')

    const editor = page.getByTestId('workspace-file-editor').locator('.ProseMirror')
    await editor.click()
    await page.keyboard.press('End')
    await page.keyboard.type(' Escrito en el chequeo funcional.')
    await delay(150)
    await shot('05-escribiendo-y-guardando-solo')

    await page
      .getByTestId('workspace-file-save-status')
      .getByText('Saved')
      .waitFor({ timeout: 20000 })
    await delay(500)
    await shot('06-guardado-sin-boton')

    // Type a heading and see it become a heading, not the literal marks.
    await page.keyboard.press('Enter')
    await page.keyboard.type('## Un titulo escrito ahora')
    await delay(1500)
    await shot('07-el-titulo-se-ve-como-titulo')

    // Leave the screen and come back: the document shows what the disk now has.
    await page.getByTestId('workspace-file-tree').getByText('What this is').click()
    await delay(1500)
    await page.getByTestId('workspace-file-tree').getByText('Decisions').click()
    await delay(2500)
    await shot('08-vuelve-y-el-texto-esta')

    // A file that is not a document stays read-only.
    await page.getByTestId('workspace-file-tree').getByText('orca.yaml').click()
    await delay(2000)
    await shot('09-un-archivo-que-no-es-documento-no-se-edita')

    const onDisk = readFileSync(documentPath, 'utf8')
    writeFileSync(path.join(outDir, 'documento-en-disco.md'), onDisk)
    console.log('--- decisions.md on disk ---')
    console.log(onDisk)
    if (!onDisk.includes('Escrito en el chequeo funcional.')) {
      throw new Error('what was typed did not reach the disk')
    }
    if (!onDisk.includes('## Un titulo escrito ahora')) {
      throw new Error('the heading did not reach the disk as a heading')
    }
    console.log('SPEC024 functional check OK')
  } catch (error) {
    failure = error
  } finally {
    await browser?.close().catch(() => {})
    child.kill('SIGTERM')
    await delay(2000)
    rmSync(userDataDir, { recursive: true, force: true })
    rmSync(folder, { recursive: true, force: true })
  }
  if (failure) {
    console.error(failure)
    process.exitCode = 1
  }
}

await main()
