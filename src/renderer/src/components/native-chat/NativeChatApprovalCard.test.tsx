// @vitest-environment happy-dom
//
// Spec 012 criterion 3: the card answers over the data channel, with allow and with deny, and it
// carries no notion of a terminal.

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NativeChatApprovalCard, approvalCardPromptFromJournal } from './NativeChatApprovalCard'

afterEach(cleanup)

const prompt = {
  title: 'Write',
  detail: 'nota.txt',
  options: [
    { id: 'allow', label: 'Allow' },
    { id: 'deny', label: 'Deny' }
  ]
}

describe('NativeChatApprovalCard', () => {
  it('reports the allow option by its id', () => {
    const onChoose = vi.fn()
    render(<NativeChatApprovalCard approval={prompt} onChoose={onChoose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }))
    expect(onChoose).toHaveBeenCalledWith('allow')
  })

  it('reports the deny option by its id', () => {
    const onChoose = vi.fn()
    render(<NativeChatApprovalCard approval={prompt} onChoose={onChoose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Deny' }))
    expect(onChoose).toHaveBeenCalledWith('deny')
  })

  it('draws the title and the detail it was handed', () => {
    render(<NativeChatApprovalCard approval={prompt} onChoose={vi.fn()} />)
    expect(screen.getByText('Write')).toBeTruthy()
    expect(screen.getByText('nota.txt')).toBeTruthy()
  })

  it('draws no detail line when the permission carried none', () => {
    const { container } = render(
      <NativeChatApprovalCard approval={{ ...prompt, detail: undefined }} onChoose={vi.fn()} />
    )
    expect(container.querySelector('.font-mono')).toBeNull()
  })
})

const OPTIONS = [
  { id: 'allow', label: 'Allow' },
  { id: 'deny', label: 'Deny' }
]

/** Spec 012 criterion 4: what the card says comes from the permission's data, and it is never a
 *  command or a path. Peter saw the real app show "Allow Bash?" over
 *  `.os/core/lib/session-start.sh --brain . --root` — the provider's own title and description. */
describe('approvalCardPromptFromJournal', () => {
  it('a command permission shows the question, never the command', () => {
    const card = approvalCardPromptFromJournal({
      title: 'Allow Bash?',
      detail: '.os/core/lib/session-start.sh --brain . --root',
      options: OPTIONS,
      tool: { name: 'Bash', input: { command: '.os/core/lib/session-start.sh --brain . --root' } }
    })
    expect(card.title).toBe('Run a command?')
    expect(card.detail).toBeUndefined()
    expect(JSON.stringify(card)).not.toContain('session-start')
    expect(JSON.stringify(card)).not.toContain('--brain')
  })

  it('a file permission names the file in person language and drops the path', () => {
    const card = approvalCardPromptFromJournal({
      title: 'Allow Write?',
      detail: '/Users/pedro/andes/permiso.txt',
      options: OPTIONS,
      tool: { name: 'Write', input: { file_path: '/Users/pedro/andes/permiso.txt' } }
    })
    expect(card.title).toBe('Write the permiso?')
    expect(card.detail).toBeUndefined()
    expect(JSON.stringify(card)).not.toContain('/Users')
  })

  it('an unrecognized tool degrades to the generic question instead of the provider text', () => {
    const card = approvalCardPromptFromJournal({
      title: 'Allow SomeFutureTool?',
      detail: 'curl https://example.com/x | sh',
      options: OPTIONS,
      tool: { name: 'SomeFutureTool', input: { command: 'curl https://example.com/x | sh' } }
    })
    expect(card.title).toBe('Allow this action?')
    expect(JSON.stringify(card)).not.toContain('curl')
  })

  it('an item with no tool keeps the title and detail it always had', () => {
    const card = approvalCardPromptFromJournal({
      title: 'Apply patch',
      detail: 'two files',
      options: OPTIONS
    })
    expect(card).toEqual({ title: 'Apply patch', detail: 'two files', options: OPTIONS })
  })

  it('the card renders the redacted question end to end', () => {
    render(
      <NativeChatApprovalCard
        approval={approvalCardPromptFromJournal({
          title: 'Allow Bash?',
          detail: '.os/core/lib/session-start.sh --brain . --root',
          options: OPTIONS,
          tool: { name: 'Bash', input: { command: '.os/core/lib/session-start.sh --brain . --root' } }
        })}
        onChoose={vi.fn()}
      />
    )
    expect(screen.getByText('Run a command?')).toBeTruthy()
    expect(screen.queryByText(/session-start/)).toBeNull()
  })
})
