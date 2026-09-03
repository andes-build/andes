import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import type { OnboardingState } from '../../../../../shared/onboarding-state-types'
import type { TuiAgent } from '../../../../../shared/tui-agent'
import {
  SIMPLE_ONBOARDING_STEPS,
  type SimpleOnboardingStepId
} from '../../../../../shared/simple-mode-onboarding-steps'

export type UseSimpleOnboardingFlowResult = {
  stepIndex: number
  totalSteps: number
  currentStepId: SimpleOnboardingStepId
  selectedAgent: TuiAgent | null
  setSelectedAgent: (agent: TuiAgent | null) => void
  detectedSet: Set<TuiAgent>
  isDetectingAgents: boolean
  refreshDetectedAgents: () => Promise<string[]>
  folderPath: string | null
  setFolderPath: (path: string) => void
  canGoNext: boolean
  next: () => void
  back: () => void
  dismiss: () => Promise<void>
}

/** Resolves the next step to land on, skipping "workspace" (ajuste
 *  2026-09-03, 📌 Peter) when the chosen folder already has one. */
async function resolveNextIndex(rawNextIndex: number): Promise<number> {
  if (SIMPLE_ONBOARDING_STEPS[rawNextIndex] !== 'workspace') {
    return rawNextIndex
  }
  return rawNextIndex + 1 < SIMPLE_ONBOARDING_STEPS.length ? rawNextIndex + 1 : rawNextIndex
}

/**
 * Orchestrates the simple-mode onboarding wizard (spec 005, criterion 1) —
 * a wholly separate flow from `useOnboardingFlow`, which stays untouched for
 * developer mode. Each step owns its own business logic (session login,
 * folder preparation, skills install); this hook only owns navigation,
 * persistence, and the state more than one step needs — the agent picked,
 * and the folder path chosen.
 */
export function useSimpleOnboardingFlow(
  onboarding: OnboardingState,
  onOnboardingChange: (state: OnboardingState) => void
): UseSimpleOnboardingFlowResult {
  const settings = useAppStore((s) => s.settings)
  const refreshDetectedAgents = useAppStore((s) => s.refreshDetectedAgents)
  const detectedAgentIds = useAppStore((s) => s.detectedAgentIds)
  const isDetectingAgents = useAppStore((s) => s.isDetectingAgents || s.isRefreshingAgents)

  const initialStep = Math.min(
    Math.max(onboarding.lastCompletedStep + 1, 0),
    SIMPLE_ONBOARDING_STEPS.length - 1
  )
  const [stepIndex, setStepIndex] = useState(initialStep)
  const [selectedAgent, setSelectedAgent] = useState<TuiAgent | null>(
    settings?.defaultTuiAgent && settings.defaultTuiAgent !== 'blank'
      ? settings.defaultTuiAgent
      : null
  )
  const [folderPath, setFolderPath] = useState<string | null>(null)

  const didAutoDetectRef = useRef(false)
  useEffect(() => {
    if (didAutoDetectRef.current) {
      return
    }
    didAutoDetectRef.current = true
    void refreshDetectedAgents()
  }, [refreshDetectedAgents])

  const detectedSet = new Set(detectedAgentIds ?? [])

  const closedRef = useRef(false)
  const persistStep = useCallback(
    async (stepNumber: number, extra: Partial<OnboardingState> = {}) => {
      const nextState = await window.api.onboarding.update({
        lastCompletedStep: Math.max(stepNumber, -1),
        ...extra
      })
      onOnboardingChange(nextState)
    },
    [onOnboardingChange]
  )

  const next = useCallback(() => {
    void (async () => {
      const current = stepIndex
      const leavingStepId = SIMPLE_ONBOARDING_STEPS[current]
      const isLastStep = current === SIMPLE_ONBOARDING_STEPS.length - 1
      // Why: the Settings checklist (criterion 11) reads these same
      // checklist flags to show "done" for its Agent and Folder rows —
      // reused instead of adding a parallel status store.
      const checklistUpdate =
        leavingStepId === 'agent'
          ? { choseAgent: selectedAgent !== null }
          : leavingStepId === 'folder'
            ? { addedFolder: true }
            : undefined
      if (isLastStep) {
        if (!closedRef.current) {
          closedRef.current = true
          await persistStep(current, {
            closedAt: Date.now(),
            outcome: 'completed',
            checklist: { ...onboarding.checklist, ...checklistUpdate, dismissed: false }
          })
          window.setTimeout(() => {
            void window.api.starNag.onboardingCompleted()
          }, 0)
        }
        return
      }
      const rawNextIndex = Math.min(current + 1, SIMPLE_ONBOARDING_STEPS.length - 1)
      const nextIndex =
        SIMPLE_ONBOARDING_STEPS[rawNextIndex] === 'workspace' && folderPath
          ? await (async () => {
              const { hasWorkspaces } = await window.api.onboardingBrain.hasWorkspaces({
                folderPath
              })
              return hasWorkspaces ? await resolveNextIndex(rawNextIndex) : rawNextIndex
            })()
          : rawNextIndex
      const persistedStepNumber = Math.max(current, nextIndex - 1)
      await (checklistUpdate
        ? persistStep(persistedStepNumber, {
            checklist: { ...onboarding.checklist, ...checklistUpdate }
          })
        : persistStep(persistedStepNumber))
      setStepIndex(nextIndex)
    })()
  }, [folderPath, onboarding.checklist, persistStep, selectedAgent, stepIndex])

  const back = useCallback(() => {
    setStepIndex((current) => Math.max(current - 1, 0))
  }, [])

  const dismiss = useCallback(async () => {
    if (closedRef.current) {
      return
    }
    closedRef.current = true
    const nextState = await window.api.onboarding.update({
      closedAt: Date.now(),
      outcome: 'dismissed',
      checklist: { ...onboarding.checklist, dismissed: true }
    })
    onOnboardingChange(nextState)
  }, [onboarding.checklist, onOnboardingChange])

  return {
    stepIndex,
    totalSteps: SIMPLE_ONBOARDING_STEPS.length,
    currentStepId: SIMPLE_ONBOARDING_STEPS[stepIndex],
    selectedAgent,
    setSelectedAgent,
    detectedSet,
    isDetectingAgents,
    refreshDetectedAgents,
    folderPath,
    setFolderPath,
    canGoNext: true,
    next,
    back,
    dismiss
  }
}
