// Spec 012 criterion 1 — the de-risking step, run against the real `claude` binary.
//
// Spends the person's own quota, so it stays behind ANDES_EVAL_CLAUDE_REAL=1 and asks for the
// smallest thing that still needs a permission: writing one short file.
//
// What it proves: the permission arrives as a data frame our code reads, our answer travels back
// down the same channel, and allow and deny end differently — the file is there, or it is not.

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import readline from 'node:readline'
import { describe, expect, it } from 'vitest'
import {
  CLAUDE_STRUCTURED_LAUNCH_ARGS,
  buildClaudeStructuredInitializeRequest,
  buildClaudeStructuredPermissionResponse,
  buildClaudeStructuredUserMessage,
  readClaudeStructuredPermissionRequest,
  type ClaudeStructuredPermissionRequest
} from './claude-structured-stream-protocol'

const ENABLED = process.env.ANDES_EVAL_CLAUDE_REAL === '1'
const TIMEOUT_MS = Number(process.env.ANDES_EVAL_CLAUDE_TIMEOUT_MS ?? 180000)

type Outcome = {
  permission: ClaudeStructuredPermissionRequest | null
  fileWritten: boolean
}

async function runOneTurn(decision: 'allow' | 'deny'): Promise<Outcome> {
  const cwd = mkdtempSync(join(tmpdir(), 'andes-claude-permission-'))
  const target = join(cwd, 'nota.txt')
  const child = spawn('claude', [...CLAUDE_STRUCTURED_LAUNCH_ARGS, '--model', 'sonnet'], {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe']
  }) as ChildProcessWithoutNullStreams
  const send = (frame: unknown): void => {
    child.stdin.write(`${JSON.stringify(frame)}\n`)
  }
  let permission: ClaudeStructuredPermissionRequest | null = null
  try {
    await new Promise<void>((resolve) => {
      const stop = (): void => {
        clearTimeout(timer)
        resolve()
      }
      const timer = setTimeout(stop, TIMEOUT_MS)
      readline.createInterface({ input: child.stdout }).on('line', (line) => {
        let frame: unknown
        try {
          frame = JSON.parse(line)
        } catch {
          return
        }
        const request = readClaudeStructuredPermissionRequest(frame)
        if (request) {
          permission = request
          send(
            buildClaudeStructuredPermissionResponse({
              requestId: request.requestId,
              input: request.input,
              decision,
              denyMessage: 'denied by the spec 012 criterion 1 check'
            })
          )
        }
        if ((frame as { type?: string }).type === 'result') {
          setTimeout(stop, 500)
        }
      })
      child.once('close', stop)
      send(buildClaudeStructuredInitializeRequest('andes-criterion-1'))
      send(
        buildClaudeStructuredUserMessage(
          'Write the file nota.txt here with the single line "ok". Nothing else.'
        )
      )
    })
    return { permission, fileWritten: existsSync(target) }
  } finally {
    child.stdin.end()
    child.kill('SIGTERM')
    rmSync(cwd, { recursive: true, force: true })
  }
}

describe.runIf(ENABLED)('spec 012 criterion 1 — Claude hands the permission over as data', () => {
  it(
    'allows: the permission arrives as a frame and the allowed write happens',
    async () => {
      const outcome = await runOneTurn('allow')
      expect(outcome.permission).not.toBeNull()
      expect(outcome.permission?.toolName).toBe('Write')
      expect(outcome.permission?.title.length).toBeGreaterThan(0)
      expect(outcome.fileWritten).toBe(true)
    },
    TIMEOUT_MS + 30000
  )

  it(
    'denies: the same permission arrives and the denied write never happens',
    async () => {
      const outcome = await runOneTurn('deny')
      expect(outcome.permission).not.toBeNull()
      expect(outcome.permission?.toolName).toBe('Write')
      expect(outcome.fileWritten).toBe(false)
    },
    TIMEOUT_MS + 30000
  )
})
