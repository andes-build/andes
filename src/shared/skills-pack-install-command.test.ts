import { describe, expect, it } from 'vitest'
import {
  buildSkillsPackInstallArgs,
  buildSkillsPackInstallCommand
} from './agent-feature-install-commands'

describe('spec005#6 buildSkillsPackInstallArgs/Command', () => {
  it('builds the install command for a single detected agent', () => {
    const args = buildSkillsPackInstallArgs('https://github.com/acme/pack', {
      agents: ['claude'],
      yes: true
    })
    expect(args).toEqual([
      'skills',
      'add',
      'https://github.com/acme/pack',
      '--agent',
      'claude',
      '-y'
    ])
    expect(
      buildSkillsPackInstallCommand('https://github.com/acme/pack', {
        agents: ['claude'],
        yes: true
      })
    ).toBe('npx skills add https://github.com/acme/pack --agent claude -y')
  })

  it('builds the install command for two detected agents', () => {
    const command = buildSkillsPackInstallCommand('https://github.com/acme/pack', {
      agents: ['claude', 'codex'],
      yes: true
    })
    expect(command).toBe(
      'npx skills add https://github.com/acme/pack --agent claude --agent codex -y'
    )
  })

  it('requires a non-empty repository', () => {
    expect(() => buildSkillsPackInstallArgs('  ', { agents: ['claude'], yes: true })).toThrow()
  })
})
