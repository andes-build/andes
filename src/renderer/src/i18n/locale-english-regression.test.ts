/**
 * #10770 merged from a base predating #8549, so its stale locale copies
 * overwrote ~185 already-translated strings per locale back to English. Only
 * the English catalog ships now (specs/done/008-un-solo-idioma.md), so this
 * guards the other half of that incident: the same stale base regressed
 * en.json itself for a key whose live source string had already moved on —
 * a present catalog value always beats the English `translate()` fallback,
 * so a stale entry here would render silently, with nothing to signal it.
 */
import { describe, expect, it } from 'vitest'
import en from './locales/en.json'

function lookup(catalog: unknown, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      catalog
    )
  return typeof value === 'string' ? value : undefined
}

// Sampled across the reverted set: an unconditional sidebar filter row, plugin
// command failures on two surfaces, a settings description, and a status-bar
// metric — so a partial re-revert cannot pass by covering one namespace.
const REVERTED_KEYS = [
  'auto.components.sidebar.SidebarFilter.detachedHead',
  'auto.App.pluginCommandFailed',
  'auto.components.WorktreeJumpPalette.pluginCommandFailed',
  'auto.hooks.useSettingsNavigationMetadata.pluginsDescription',
  'auto.components.status.bar.resource.memory.metric.workingSetDescription',
  'auto.components.settings.EphemeralVmsPane.recipesHelp'
]

describe('english catalog regression guard (#10770)', () => {
  it('keeps every historically-reverted key defined in the English catalog', () => {
    for (const key of REVERTED_KEYS) {
      const english = lookup(en, key)
      expect(english, `${key} missing from en.json`).toBeDefined()
      expect(english?.trim()).not.toBe('')
    }
  })

  // The same stale base regressed English itself: the catalog kept pre-plugins
  // copy while EphemeralVmsPane.tsx already shipped the newer sentence, and a
  // present catalog value wins over the source fallback.
  it('keeps the English catalog in step with its live source string', () => {
    expect(lookup(en, 'auto.components.settings.EphemeralVmsPane.recipesHelp')).toBe(
      'Recipes from orca.yaml and enabled plugins show up here, ready to launch a workspace on.'
    )
  })
})
