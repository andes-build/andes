import { describe, expect, it } from 'vitest'
import type { NativeChatBlock } from '../../../../shared/native-chat-types'
import { describeToolActivity } from './native-chat-activity-phrase'

const TOOL_NAMES = ['Bash', 'Read', 'Write', 'Grep', 'Task'] as const

const FIXTURES: Record<(typeof TOOL_NAMES)[number], NativeChatBlock> = {
  Bash: {
    type: 'tool-call',
    name: 'Bash',
    input: { command: 'cat /Users/pedro/products/andes/decisions.md | grep secret' }
  },
  Read: {
    type: 'tool-call',
    name: 'Read',
    input: { file_path: '/Users/pedro/products/andes/docs/payment-provider-decision.md' }
  },
  Write: {
    type: 'tool-call',
    name: 'Write',
    input: { file_path: '/Users/pedro/products/andes/specs/013-el-hilo-se-ve-como-un-hilo.md' }
  },
  Grep: {
    type: 'tool-call',
    name: 'Grep',
    input: { pattern: 'ANDES_INTERFACE_MODE', path: '/Users/pedro/products/andes/src' }
  },
  Task: {
    type: 'tool-call',
    name: 'Task',
    input: { description: 'Audit the localization catalog', prompt: 'grep -rn foo /etc/passwd' }
  }
}

/**
 * Spec 013, criterion 7. Rubric: present-tense verb + what is being looked
 * at or written, never the tool's own name, a path, or a filename — "reading
 * the payment provider decision" is right, "reading decisions.md" is wrong.
 */
describe('describeToolActivity (spec 013, criterion 7)', () => {
  it.each(TOOL_NAMES)(
    'never leaks the literal tool identifier, a path, or a backtick for %s',
    (name) => {
      const phrase = describeToolActivity(FIXTURES[name])
      // The literal call name as the CLI/API spells it (case-sensitive: "Read"/"Bash"/…,
      // not the ordinary English words "reading" or "task" the phrase is allowed to use).
      expect(phrase).not.toMatch(new RegExp(`\\b${name}\\b`))
      expect(phrase).not.toContain('/')
      expect(phrase).not.toContain('`')
      expect(phrase).not.toContain('.md')
      // Present-tense verb, sentence case, no trailing artifacts.
      expect(phrase).toMatch(/^[A-Z][a-z]+ (a |the |for )?.+[^.]$|^Working…$/)
    }
  )

  it('Read with a file path: a humanized subject, never the filename', () => {
    expect(describeToolActivity(FIXTURES.Read)).toBe('Reading the payment provider decision')
  })

  it('Write with a file path: a humanized subject, never the filename', () => {
    expect(describeToolActivity(FIXTURES.Write)).toBe('Writing the 013 el hilo se ve como un hilo')
  })

  it('Read with no derivable path: a generic phrase, not "Working…"', () => {
    expect(describeToolActivity({ type: 'tool-call', name: 'Read', input: {} })).toBe(
      'Reading a file'
    )
  })

  it('Bash never echoes the command, whatever it contains', () => {
    expect(describeToolActivity(FIXTURES.Bash)).toBe('Running a command')
  })

  it('Grep never echoes the pattern or the search path', () => {
    expect(describeToolActivity(FIXTURES.Grep)).toBe('Searching the files')
  })

  it('Task never echoes its description or prompt', () => {
    expect(describeToolActivity(FIXTURES.Task)).toBe('Delegating a task')
  })

  it('an unrecognized tool degrades to "Working…" and nothing else', () => {
    expect(
      describeToolActivity({
        type: 'tool-call',
        name: 'SomeFutureTool',
        input: { anything: '/etc/passwd' }
      })
    ).toBe('Working…')
  })

  it('a tool result shows "Working…" when it is not an error', () => {
    expect(
      describeToolActivity({ type: 'tool-result', output: '/Users/pedro/secret-file.txt' })
    ).toBe('Working…')
  })

  it('a failed tool result never echoes the error output', () => {
    expect(
      describeToolActivity({
        type: 'tool-result',
        output: 'bash: /usr/bin/foo: command not found',
        isError: true
      })
    ).toBe('Ran into a problem')
  })
})
