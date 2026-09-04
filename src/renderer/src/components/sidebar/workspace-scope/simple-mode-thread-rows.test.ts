import { describe, expect, it } from 'vitest'
import { buildSimpleModeThreadRows, type SimpleModeThreadTab } from './simple-mode-thread-rows'

function tab(overrides: Partial<SimpleModeThreadTab> & { id: string }): SimpleModeThreadTab {
  return {
    threadScope: { kind: 'root' },
    customTitle: null,
    aiVaultTitle: null,
    createdAt: 0,
    ...overrides
  }
}

/**
 * Spec 013, criterion 2: only the active workspace scope's threads, ranked
 * by activity, with the open one flagged. Three threads across two
 * workspaces: only the matching workspace's threads come back.
 */
describe('buildSimpleModeThreadRows (spec 013, criterion 2)', () => {
  const tabs: SimpleModeThreadTab[] = [
    tab({
      id: 'tab-root',
      threadScope: { kind: 'root' },
      createdAt: 1_000,
      customTitle: 'My work thread'
    }),
    tab({
      id: 'tab-andes-old',
      threadScope: { kind: 'workspace', slug: 'andes', name: 'Andes' },
      createdAt: 1_000,
      customTitle: 'Older Andes thread'
    }),
    tab({
      id: 'tab-andes-new',
      threadScope: { kind: 'workspace', slug: 'andes', name: 'Andes' },
      createdAt: 2_000,
      customTitle: 'Newer Andes thread'
    }),
    tab({
      id: 'tab-other-workspace',
      threadScope: { kind: 'workspace', slug: 'tandem-pay', name: 'Tandem Pay' },
      createdAt: 3_000,
      customTitle: 'Tandem Pay thread'
    })
  ]

  it('only returns threads of the active workspace scope', () => {
    const rows = buildSimpleModeThreadRows({
      tabs,
      worktreeId: 'wt-1',
      activeWorkspaceScopeSlug: 'andes',
      activeTabId: null,
      newThreadFallbackTitle: 'New thread',
      now: 10_000
    })

    expect(rows.map((row) => row.id).sort()).toEqual(['tab-andes-new', 'tab-andes-old'].sort())
  })

  it('only returns root-scoped threads for "My work"', () => {
    const rows = buildSimpleModeThreadRows({
      tabs,
      worktreeId: 'wt-1',
      activeWorkspaceScopeSlug: null,
      activeTabId: null,
      newThreadFallbackTitle: 'New thread',
      now: 10_000
    })

    expect(rows.map((row) => row.id)).toEqual(['tab-root'])
  })

  it('orders threads within a scope newest first when neither needs attention', () => {
    const rows = buildSimpleModeThreadRows({
      tabs,
      worktreeId: 'wt-1',
      activeWorkspaceScopeSlug: 'andes',
      activeTabId: null,
      newThreadFallbackTitle: 'New thread',
      now: 10_000
    })

    expect(rows.map((row) => row.id)).toEqual(['tab-andes-new', 'tab-andes-old'])
  })

  it('flags the currently open thread', () => {
    const rows = buildSimpleModeThreadRows({
      tabs,
      worktreeId: 'wt-1',
      activeWorkspaceScopeSlug: 'andes',
      activeTabId: 'tab-andes-old',
      newThreadFallbackTitle: 'New thread',
      now: 10_000
    })

    expect(rows.find((row) => row.id === 'tab-andes-old')?.isActive).toBe(true)
    expect(rows.find((row) => row.id === 'tab-andes-new')?.isActive).toBe(false)
  })

  it('resolves each row title the same way the thread header does', () => {
    const rows = buildSimpleModeThreadRows({
      tabs,
      worktreeId: 'wt-1',
      activeWorkspaceScopeSlug: null,
      activeTabId: null,
      newThreadFallbackTitle: 'New thread'
    })

    expect(rows[0]?.title).toBe('My work thread')
  })

  it('a thread with no CLI or manual title falls back to "New thread"', () => {
    const rows = buildSimpleModeThreadRows({
      tabs: [tab({ id: 'tab-fresh', threadScope: { kind: 'root' }, customTitle: null })],
      worktreeId: 'wt-1',
      activeWorkspaceScopeSlug: null,
      activeTabId: null,
      newThreadFallbackTitle: 'New thread'
    })

    expect(rows[0]?.title).toBe('New thread')
  })
})
