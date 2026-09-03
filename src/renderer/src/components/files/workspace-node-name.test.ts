import { describe, expect, it } from 'vitest'
import { translateWorkspaceNodeName } from './workspace-node-name'

describe('translateWorkspaceNodeName', () => {
  it.each([
    ['README.md', 'What this is'],
    ['context.md', 'What this is'],
    ['decisions.md', 'Decisions'],
    ['learnings.md', 'Learnings'],
    ['backlog.md', 'Backlog'],
    ['initiatives', 'Initiatives'],
    ['research', 'Research']
  ])('translates %s to %s', (fileName, expected) => {
    expect(translateWorkspaceNodeName(fileName)).toBe(expected)
  })

  it('shows an unknown file name as-is (criterion 8)', () => {
    expect(translateWorkspaceNodeName('resolver.md')).toBe('resolver.md')
  })
})
