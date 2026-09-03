// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSimpleOnboardingFlow } from './use-simple-onboarding-flow'
import type { OnboardingState } from '../../../../../shared/onboarding-state-types'

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      settings: { defaultTuiAgent: 'blank' },
      refreshDetectedAgents: vi.fn().mockResolvedValue([]),
      detectedAgentIds: [],
      isDetectingAgents: false,
      isRefreshingAgents: false
    })
}))

const baseOnboarding: OnboardingState = {
  flowVersion: 1,
  closedAt: null,
  outcome: null,
  lastCompletedStep: -1,
  checklist: {
    addedRepo: false,
    choseAgent: false,
    ranFirstAgent: false,
    ranSecondAgentOnSameTask: false,
    triedCmdJ: false,
    shapedSidebar: false,
    reviewedDiff: false,
    openedPr: false,
    addedFolder: false,
    openedFile: false,
    ranAgentOnFile: false,
    dismissed: false
  }
}

function setApi(hasWorkspaces: boolean): void {
  ;(
    window as unknown as {
      api: {
        onboarding: { update: (updates: unknown) => Promise<OnboardingState> }
        onboardingBrain: { hasWorkspaces: () => Promise<{ hasWorkspaces: boolean }> }
        starNag: { onboardingCompleted: () => Promise<void> }
      }
    }
  ).api = {
    onboarding: {
      update: (updates: unknown) =>
        Promise.resolve({ ...baseOnboarding, ...(updates as object) }) as Promise<OnboardingState>
    },
    onboardingBrain: {
      hasWorkspaces: () => Promise.resolve({ hasWorkspaces })
    },
    starNag: { onboardingCompleted: () => Promise.resolve() }
  }
}

let root: Root | null = null
let container: HTMLDivElement | null = null
let currentResult: ReturnType<typeof useSimpleOnboardingFlow> | null = null

afterEach(() => {
  if (root && container) {
    act(() => root!.unmount())
    container.remove()
  }
  root = null
  container = null
  currentResult = null
})

function TestHarness({ onboarding }: { onboarding: OnboardingState }): null {
  currentResult = useSimpleOnboardingFlow(onboarding, () => {})
  return null
}

function render(onboarding: OnboardingState): void {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(<TestHarness onboarding={onboarding} />)
  })
}

describe('ajuste 2026-09-03 (📌 Peter) — el paso workspace se saltea con workspaces existentes', () => {
  it('skips "workspace" when the chosen folder already has one', async () => {
    setApi(true)
    render(baseOnboarding)
    act(() => currentResult!.setFolderPath('/tmp/existing-folder'))
    await act(async () => {
      currentResult!.next() // welcome -> agent
    })
    await act(async () => {
      currentResult!.next() // agent -> session
    })
    await act(async () => {
      currentResult!.next() // session -> folder
    })
    await act(async () => {
      currentResult!.next() // folder -> install
    })
    await act(async () => {
      currentResult!.next() // install -> (workspace skipped) -> skills
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(currentResult!.currentStepId).toBe('skills')
  })

  it('does not skip "workspace" when the folder has none yet', async () => {
    setApi(false)
    render(baseOnboarding)
    act(() => currentResult!.setFolderPath('/tmp/new-folder'))
    await act(async () => {
      currentResult!.next() // welcome -> agent
    })
    await act(async () => {
      currentResult!.next() // agent -> session
    })
    await act(async () => {
      currentResult!.next() // session -> folder
    })
    await act(async () => {
      currentResult!.next() // folder -> install
    })
    await act(async () => {
      currentResult!.next() // install -> workspace
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(currentResult!.currentStepId).toBe('workspace')
  })
})
