import { describe, expect, it } from 'vitest'
import { resolveActiveWorkspaceScope } from './workspace-scope'

const OPTIONS = [
  { slug: 'tandem-pay', name: 'Tandem Pay', path: '/brain/workspaces/tandem-pay' },
  { slug: 'ops', name: 'Ops', path: '/brain/workspaces/ops' }
]

describe('resolveActiveWorkspaceScope', () => {
  it('resolves to root when no slug is selected (criterion 1: default scope)', () => {
    expect(resolveActiveWorkspaceScope(null, OPTIONS)).toEqual({ kind: 'root' })
  })

  it('resolves to the matching workspace scope', () => {
    expect(resolveActiveWorkspaceScope('ops', OPTIONS)).toEqual({
      kind: 'workspace',
      slug: 'ops',
      name: 'Ops',
      path: '/brain/workspaces/ops'
    })
  })

  it('falls back to root when the selected slug is no longer among the options (criterion 3)', () => {
    expect(resolveActiveWorkspaceScope('deleted-workspace', OPTIONS)).toEqual({ kind: 'root' })
  })
})
