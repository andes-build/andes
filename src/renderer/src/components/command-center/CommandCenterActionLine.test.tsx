// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CommandCenterActionLine } from './CommandCenterActionLine'

afterEach(() => {
  cleanup()
})

describe('spec009#5 CommandCenterActionLine', () => {
  it('shows the suggestion text and an Open thread button that carries its message', () => {
    const onOpenThread = vi.fn()
    render(
      <CommandCenterActionLine
        suggestion={{ text: 'migracion-kyc — waiting on you', message: 'Help me resolve it.' }}
        onOpenThread={onOpenThread}
      />
    )
    expect(screen.getByText('migracion-kyc — waiting on you')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Open thread' }))
    expect(onOpenThread).toHaveBeenCalledWith('Help me resolve it.')
  })

  it('says nothing is urgent and offers no button when there is no suggestion', () => {
    render(<CommandCenterActionLine suggestion={null} onOpenThread={vi.fn()} />)
    expect(screen.getByText('Nothing urgent. Open a thread whenever you want.')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
