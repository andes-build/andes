// @vitest-environment happy-dom

import { act } from 'react'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useWorkspaceFileAutosave,
  WORKSPACE_FILE_AUTOSAVE_DELAY_MS
} from './use-workspace-file-autosave'

function setApi(writeFile: ReturnType<typeof vi.fn>): void {
  ;(window as unknown as { api: { workspaceScope: Record<string, unknown> } }).api = {
    workspaceScope: { writeFile }
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useWorkspaceFileAutosave', () => {
  it('saves by itself after the typing stops, once, not per keystroke (criterion 3)', async () => {
    const writeFile = vi.fn().mockResolvedValue({ outcome: 'saved', modifiedAtMs: 2 })
    setApi(writeFile)
    const { result } = renderHook(() => useWorkspaceFileAutosave('/brain', '/brain/backlog.md', 1))

    expect(result.current.state.status).toBe('idle')

    act(() => {
      result.current.onContentChange('one')
      result.current.onContentChange('one t')
      result.current.onContentChange('one thing')
    })
    expect(result.current.state.status).toBe('pending')
    expect(writeFile).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(WORKSPACE_FILE_AUTOSAVE_DELAY_MS)
      await Promise.resolve()
    })

    expect(writeFile).toHaveBeenCalledTimes(1)
    expect(writeFile).toHaveBeenCalledWith({
      rootPath: '/brain',
      filePath: '/brain/backlog.md',
      content: 'one thing',
      expectedModifiedAtMs: 1
    })
    expect(result.current.state.status).toBe('saved')
  })

  it('writes what is pending when the open file changes, so nothing typed is lost (criterion 3)', async () => {
    const writeFile = vi.fn().mockResolvedValue({ outcome: 'saved', modifiedAtMs: 2 })
    setApi(writeFile)
    const { result, rerender } = renderHook(
      ({ filePath }: { filePath: string }) => useWorkspaceFileAutosave('/brain', filePath, 1),
      { initialProps: { filePath: '/brain/backlog.md' } }
    )

    act(() => {
      result.current.onContentChange('typed and left immediately')
    })

    await act(async () => {
      rerender({ filePath: '/brain/decisions.md' })
      await Promise.resolve()
    })

    expect(writeFile).toHaveBeenCalledTimes(1)
    expect(writeFile.mock.calls[0][0]).toMatchObject({
      filePath: '/brain/backlog.md',
      content: 'typed and left immediately'
    })
  })

  it('says the file had also changed elsewhere (criterion 7)', async () => {
    const writeFile = vi.fn().mockResolvedValue({ outcome: 'changed-elsewhere', modifiedAtMs: 9 })
    setApi(writeFile)
    const { result } = renderHook(() => useWorkspaceFileAutosave('/brain', '/brain/backlog.md', 1))

    act(() => {
      result.current.onContentChange('what the person wrote')
    })
    await act(async () => {
      vi.advanceTimersByTime(WORKSPACE_FILE_AUTOSAVE_DELAY_MS)
      await Promise.resolve()
    })

    expect(result.current.state.status).toBe('saved-over-outside-change')
  })

  it('reports a failed save instead of pretending it saved', async () => {
    const writeFile = vi.fn().mockRejectedValue(new Error('read-only disk'))
    setApi(writeFile)
    const { result } = renderHook(() => useWorkspaceFileAutosave('/brain', '/brain/backlog.md', 1))

    act(() => {
      result.current.onContentChange('text')
    })
    await act(async () => {
      vi.advanceTimersByTime(WORKSPACE_FILE_AUTOSAVE_DELAY_MS)
      await Promise.resolve()
    })

    expect(result.current.state.status).toBe('error')
  })

  it('never writes a file the screen is not editing', () => {
    const writeFile = vi.fn()
    setApi(writeFile)
    const { result } = renderHook(() => useWorkspaceFileAutosave('/brain', null, null))

    act(() => {
      result.current.onContentChange('text')
      vi.advanceTimersByTime(WORKSPACE_FILE_AUTOSAVE_DELAY_MS)
    })

    expect(writeFile).not.toHaveBeenCalled()
  })
})
