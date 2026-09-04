import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  browserWindowGetAllWindowsMock,
  createFromPathMock,
  dockSetIconMock,
  isMock,
  windowSetIconMock
} = vi.hoisted(() => ({
  browserWindowGetAllWindowsMock: vi.fn(),
  createFromPathMock: vi.fn(),
  dockSetIconMock: vi.fn(),
  isMock: { dev: false },
  windowSetIconMock: vi.fn()
}))

vi.mock('electron', () => ({
  app: { dock: { setIcon: dockSetIconMock } },
  BrowserWindow: { getAllWindows: browserWindowGetAllWindowsMock },
  nativeImage: { createFromPath: createFromPathMock }
}))

vi.mock('@electron-toolkit/utils', () => ({
  is: isMock
}))

vi.mock('../../resources/icon.png?asset', () => ({
  default: 'classic-icon'
}))

vi.mock('../../resources/icon-dev.png?asset', () => ({
  default: 'classic-dev-icon'
}))

import { applyAppIcon, getAppIconPath, persistMacDockIcon } from './app-icon'

function waitForQueuedPersistence(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

async function waitForQueuedPersistenceMicrotasks(): Promise<void> {
  for (let i = 0; i < 6; i += 1) {
    await Promise.resolve()
  }
}

function createMockChildProcess(): EventEmitter & { kill: ReturnType<typeof vi.fn> } {
  const childProcess = new EventEmitter() as EventEmitter & { kill: ReturnType<typeof vi.fn> }
  childProcess.kill = vi.fn(() => {
    childProcess.emit('exit')
    return true
  })
  return childProcess
}

function createCompletingExecFile(): (
  file: string,
  args: string[],
  optionsOrCallback: unknown,
  callback?: (error: Error | null) => void
) => void {
  return vi.fn(
    (
      _file: string,
      _args: string[],
      optionsOrCallback: unknown,
      callback?: (error: Error | null) => void
    ) => {
      const onComplete =
        typeof optionsOrCallback === 'function'
          ? (optionsOrCallback as (error: Error | null) => void)
          : callback
      onComplete?.(null)
    }
  )
}

describe('app icon selection', () => {
  beforeEach(() => {
    browserWindowGetAllWindowsMock.mockReset()
    createFromPathMock.mockReset()
    dockSetIconMock.mockReset()
    windowSetIconMock.mockReset()
    isMock.dev = false
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves classic and falls back to it for an invalid icon id', () => {
    expect(getAppIconPath('classic')).toBe('classic-icon')
    expect(getAppIconPath('missing')).toBe('classic-icon')
  })

  it('applies the classic icon to the dock and live windows', () => {
    const image = { isEmpty: () => false }
    createFromPathMock.mockReturnValue(image)
    browserWindowGetAllWindowsMock.mockReturnValue([
      { isDestroyed: () => false, setIcon: windowSetIconMock },
      { isDestroyed: () => true, setIcon: vi.fn() }
    ])

    applyAppIcon('classic')

    expect(createFromPathMock).toHaveBeenCalledWith('classic-icon')
    if (process.platform === 'darwin') {
      expect(dockSetIconMock).toHaveBeenCalledWith(image)
    } else {
      expect(dockSetIconMock).not.toHaveBeenCalled()
    }
    expect(windowSetIconMock).toHaveBeenCalledWith(image)
  })

  it('clears the AppKit icon and Finder metadata on macOS', async () => {
    const execFile = createCompletingExecFile()

    persistMacDockIcon('classic', {
      appBundlePath: '/Applications/Andes.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })
    await waitForQueuedPersistence()

    expect(execFile).toHaveBeenNthCalledWith(
      1,
      '/usr/bin/osascript',
      expect.arrayContaining([
        '-e',
        expect.stringContaining('setIcon:(missing value) forFile:appPath')
      ]),
      expect.objectContaining({
        env: expect.objectContaining({
          ANDES_APP_BUNDLE_PATH: '/Applications/Andes.app'
        }),
        timeout: 10_000
      }),
      expect.any(Function)
    )
    expect(execFile).toHaveBeenCalledWith(
      '/usr/bin/xattr',
      ['-d', 'com.apple.FinderInfo', '/Applications/Andes.app'],
      expect.objectContaining({
        timeout: 10_000
      }),
      expect.any(Function)
    )
    expect(execFile).toHaveBeenCalledWith(
      '/usr/bin/xattr',
      ['-d', 'com.apple.ResourceFork', '/Applications/Andes.app'],
      expect.objectContaining({
        timeout: 10_000
      }),
      expect.any(Function)
    )
  })

  it('clears the Dock icon even for a legacy id from a removed alternate icon', async () => {
    const execFile = createCompletingExecFile()

    persistMacDockIcon('watercolor', {
      appBundlePath: '/Applications/Andes.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })
    await waitForQueuedPersistence()

    expect(execFile).toHaveBeenCalledWith(
      '/usr/bin/osascript',
      expect.arrayContaining([
        '-e',
        expect.stringContaining('setIcon:(missing value) forFile:appPath')
      ]),
      expect.objectContaining({
        env: expect.objectContaining({
          ANDES_APP_BUNDLE_PATH: '/Applications/Andes.app'
        })
      }),
      expect.any(Function)
    )
  })

  it('warns for non-benign failures when clearing Finder custom icon metadata', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const execFile = vi.fn(
      (
        file: string,
        args: string[],
        optionsOrCallback: unknown,
        callback?: (error: Error | null) => void
      ) => {
        const onComplete =
          typeof optionsOrCallback === 'function'
            ? (optionsOrCallback as (error: Error | null) => void)
            : callback
        if (file !== '/usr/bin/xattr') {
          onComplete?.(null)
          return
        }
        onComplete?.(new Error(args[1] === 'com.apple.FinderInfo' ? 'No such xattr' : 'EACCES'))
      }
    )

    persistMacDockIcon('classic', {
      appBundlePath: '/Applications/Andes.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })
    await waitForQueuedPersistence()

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(
      '[app-icon] failed to clear macOS dock icon metadata com.apple.ResourceFork:',
      expect.any(Error)
    )

    warnSpy.mockRestore()
  })

  it('warns when the AppKit icon reset fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const execFile = vi.fn(
      (
        file: string,
        _args: string[],
        optionsOrCallback: unknown,
        callback?: (error: Error | null) => void
      ) => {
        const onComplete =
          typeof optionsOrCallback === 'function'
            ? (optionsOrCallback as (error: Error | null) => void)
            : callback
        onComplete?.(file === '/usr/bin/osascript' ? new Error('reset denied') : null)
      }
    )

    persistMacDockIcon('classic', {
      appBundlePath: '/Applications/Andes.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })
    await waitForQueuedPersistence()

    expect(warnSpy).toHaveBeenCalledWith(
      '[app-icon] failed to clear macOS dock icon:',
      expect.any(Error)
    )

    warnSpy.mockRestore()
  })

  it('skips a superseded request instead of running its clear sequence', async () => {
    const pendingCallbacks: (() => void)[] = []
    const execFile = vi.fn(
      (
        _file: string,
        _args: string[],
        optionsOrCallback: unknown,
        callback?: (error: Error | null) => void
      ) => {
        const onComplete =
          typeof optionsOrCallback === 'function'
            ? (optionsOrCallback as (error: Error | null) => void)
            : callback
        pendingCallbacks.push(() => onComplete?.(null))
      }
    )
    const runFull = (): void =>
      persistMacDockIcon('classic', {
        appBundlePath: '/Applications/Andes.app',
        execFile,
        isDevApp: false,
        platform: 'darwin'
      })
    // Drains one full 3-step clear sequence (AppKit icon, then both xattrs),
    // resolving each pending execFile call as it is issued.
    const drainOneClearSequence = async (): Promise<void> => {
      for (let step = 0; step < 3; step += 1) {
        pendingCallbacks.shift()?.()
        await waitForQueuedPersistence()
      }
    }

    runFull()
    await waitForQueuedPersistence()

    // The first request's work already started (its own generation check
    // already passed), so it is not cancellable — it runs to completion even
    // though two more requests arrive before it finishes.
    expect(execFile).toHaveBeenCalledTimes(1)

    runFull() // superseded before its work ever starts
    runFull() // the new winner

    await drainOneClearSequence()

    // The superseded (middle) request bails without calling execFile at all;
    // the queue moves straight to the winner's own full clear sequence, whose
    // first call may already have fired inside the same flush.
    const callsAfterFirstSequence = execFile.mock.calls.length
    expect(callsAfterFirstSequence).toBeGreaterThanOrEqual(3)

    await drainOneClearSequence()
    await drainOneClearSequence()
    expect(execFile).toHaveBeenCalledTimes(6)
  })

  it('continues macOS dock icon persistence when a command never completes', async () => {
    vi.useFakeTimers()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hungChildProcess = createMockChildProcess()
    const execFile = vi.fn(
      (
        _file: string,
        _args: string[],
        optionsOrCallback: unknown,
        callback?: (error: Error | null) => void
      ) => {
        if (execFile.mock.calls.length === 1) {
          return hungChildProcess
        }
        const onComplete =
          typeof optionsOrCallback === 'function'
            ? (optionsOrCallback as (error: Error | null) => void)
            : callback
        onComplete?.(null)
        return undefined
      }
    )

    persistMacDockIcon('classic', {
      appBundlePath: '/Applications/Andes.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })
    await waitForQueuedPersistenceMicrotasks()

    expect(execFile).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(10_000)
    await waitForQueuedPersistenceMicrotasks()

    expect(hungChildProcess.kill).not.toHaveBeenCalled()
    expect(execFile).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1_000)
    await waitForQueuedPersistenceMicrotasks()

    expect(warnSpy).toHaveBeenCalledWith('[app-icon] timed out clearing macOS dock icon')
    expect(hungChildProcess.kill).toHaveBeenCalledTimes(1)
    // The hung AppKit clear call gives up via its fallback, then the chain
    // still runs both Finder xattr clears.
    expect(execFile).toHaveBeenCalledTimes(3)

    warnSpy.mockRestore()
  })
})
