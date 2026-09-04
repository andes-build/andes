// @vitest-environment happy-dom
//
// Spec 012 criterion 3: the card answers over the data channel, with allow and with deny, and it
// carries no notion of a terminal.

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NativeChatApprovalCard } from './NativeChatApprovalCard'

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
