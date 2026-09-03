import { describe, expect, it } from 'vitest'
import { CODEX_SESSION_OPTION_CATALOG } from '../../../shared/agent-session-option-catalog-claude-codex'

const localizedEffortValues = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'] as const

const codexEffortValues = new Set(
  [
    ...CODEX_SESSION_OPTION_CATALOG.models.flatMap((model) => model.options),
    ...(CODEX_SESSION_OPTION_CATALOG.unknownModelOptions ?? [])
  ].flatMap((option) =>
    option.id === 'effort' && option.kind.type === 'select'
      ? option.kind.choices.map((choice) => choice.value)
      : []
  )
)

describe('native chat locale copy', () => {
  it('covers every Codex effort choice', () => {
    expect([...codexEffortValues].sort()).toEqual([...localizedEffortValues].sort())
  })
})
