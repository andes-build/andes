// The live child: one `claude` process, one line-framed JSON stream in each direction.
//
// Codex talks JSON-RPC over an app-server and needed a whole connection layer to match. Claude's
// wire is line-delimited JSON with no request ids of its own except on the control channel, so this
// file is the whole transport — not a port of `codex-app-server-connection.ts`.

import readline from 'node:readline'
import { spawnProcess } from '../../shared/child-process/run-process'

export const CLAUDE_SPAWN_TOKEN_ENV = 'ORCA_AGENT_SESSION_SPAWN_TOKEN'

/** A single output line, already parsed. Frames this host does not model still reach the journal
 *  as bounded provider frames rather than being dropped. */
export type ClaudeStructuredFrame = Record<string, unknown>

export type ClaudeStructuredConnectionHandlers = {
  onFrame: (frame: ClaudeStructuredFrame, retainedBytes: number) => void
  onExit: (error: Error | null) => void
}

export type ClaudeStructuredConnection = {
  pid: number | undefined
  closed: boolean
  send(frame: unknown): void
  close(): Promise<void>
}

export type ClaudeStructuredSpawnRequest = {
  command: string
  args: readonly string[]
  cwd: string
  env: Record<string, string>
}

export function openClaudeStructuredConnection(
  request: ClaudeStructuredSpawnRequest,
  handlers: ClaudeStructuredConnectionHandlers
): ClaudeStructuredConnection {
  // Through the repo's single spawn entry point: it is what makes the six Windows decisions
  // (console visibility, quoting, binary resolution, tree termination) once instead of here.
  const child = spawnProcess({
    program: request.command,
    args: [...request.args],
    cwd: request.cwd,
    env: request.env,
    stdio: ['pipe', 'pipe', 'pipe']
  })
  let closed = false
  let stderr = ''
  child.stderr.on('data', (chunk: Buffer) => {
    // Bounded: a failing child can print without limit, and this text only exists to name the exit.
    stderr = `${stderr}${chunk.toString('utf8')}`.slice(-4096)
  })
  readline.createInterface({ input: child.stdout }).on('line', (line) => {
    if (line.length === 0) {
      return
    }
    let frame: unknown
    try {
      frame = JSON.parse(line)
    } catch {
      // A non-JSON line is the CLI writing something this wire does not carry. Losing it is
      // better than crashing the session on it, and stderr keeps the diagnosis.
      return
    }
    if (typeof frame === 'object' && frame !== null && !Array.isArray(frame)) {
      handlers.onFrame(frame as ClaudeStructuredFrame, Buffer.byteLength(line, 'utf8'))
    }
  })
  const settleExit = (error: Error | null): void => {
    if (closed) {
      return
    }
    closed = true
    handlers.onExit(error)
  }
  child.once('error', (error) => settleExit(error))
  child.once('exit', (code, signal) => {
    settleExit(
      code === 0 || code === null
        ? null
        : new Error(`claude exited with code ${code}${signal ? ` (${signal})` : ''}: ${stderr}`)
    )
  })
  return {
    pid: child.pid,
    get closed() {
      return closed
    },
    send(frame: unknown) {
      if (closed) {
        return
      }
      child.stdin.write(`${JSON.stringify(frame)}\n`)
    },
    close(): Promise<void> {
      return new Promise<void>((resolve) => {
        if (closed) {
          resolve()
          return
        }
        child.once('exit', () => resolve())
        try {
          child.stdin.end()
        } catch {
          // Already gone; the kill below is what proves the exit.
        }
        child.kill('SIGTERM')
      })
    }
  }
}
