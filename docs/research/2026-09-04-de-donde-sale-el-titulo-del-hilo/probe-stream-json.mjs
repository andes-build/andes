import { spawn } from 'node:child_process'

const cwd = process.argv[2]
const turns = process.argv.slice(3)

const child = spawn(
  'claude',
  [
    '--output-format',
    'stream-json',
    '--verbose',
    '--input-format',
    'stream-json',
    '--permission-prompt-tool',
    'stdio',
    '--model',
    'haiku'
  ],
  { cwd, stdio: ['pipe', 'pipe', 'pipe'] }
)

let buf = ''
let pending = 0
let sessionId = null
child.stdout.on('data', (d) => {
  buf += d.toString()
  let i
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i)
    buf = buf.slice(i + 1)
    if (!line.trim()) {
      continue
    }
    let f
    try {
      f = JSON.parse(line)
    } catch {
      continue
    }
    if (f.session_id && !sessionId) {
      sessionId = f.session_id
    }
    if (f.type === 'result') {
      pending--
      next()
    }
  }
})
child.stderr.on('data', (d) => process.stderr.write(d))

let idx = 0
function next() {
  if (idx >= turns.length) {
    setTimeout(() => {
      child.stdin.end()
    }, 3000)
    return
  }
  const text = turns[idx++]
  pending++
  child.stdin.write(
    `${JSON.stringify({
      type: 'user',
      message: { role: 'user', content: [{ type: 'text', text }] }
    })}\n`
  )
}
next()

child.on('close', () => {
  console.log(`SESSION_ID=${sessionId}`)
})
