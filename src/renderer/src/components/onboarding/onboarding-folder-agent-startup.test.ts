import { describe, expect, it } from 'vitest'
import { getDefaultOnboardingState, getDefaultSettings } from '../../../../shared/constants'
import {
  buildDismissedOnboardingFolderAgentStartup,
  buildOnboardingFolderAgentStartup,
  shouldSeedFolderAgentAfterDismissedOnboarding
} from '@/lib/onboarding-folder-agent-startup'

describe('buildOnboardingFolderAgentStartup', () => {
  // Spec 016: en modo simple el arranque de la carpeta no lleva el argumento de
  // omisión de permisos que trae el perfil por omisión.
  it('spec016#4 queues the persisted default agent with onboarding telemetry, without the bypass argument', () => {
    const startup = buildOnboardingFolderAgentStartup({
      ...getDefaultSettings('/tmp/orca-workspaces'),
      defaultTuiAgent: 'codex'
    })

    expect(startup).toEqual({
      command: 'codex',
      env: {},
      launchAgent: 'codex',
      launchConfig: {
        agentCommand: 'codex',
        agentArgs: '',
        agentEnv: {}
      },
      sessionOptions: undefined,
      telemetry: {
        agent_kind: 'codex',
        launch_source: 'onboarding',
        request_kind: 'new'
      }
    })
  })

  it('respects the blank terminal preference', () => {
    const startup = buildOnboardingFolderAgentStartup({
      ...getDefaultSettings('/tmp/orca-workspaces'),
      defaultTuiAgent: 'blank'
    })

    expect(startup).toBeUndefined()
  })

  it('omits native-chat preferences from terminal-default folder launches', () => {
    const startup = buildOnboardingFolderAgentStartup({
      ...getDefaultSettings('/tmp/orca-workspaces'),
      defaultTuiAgent: 'codex',
      experimentalNativeChat: true,
      openAgentTabsInChatByDefault: false,
      nativeChatSessionOptions: {
        codex: {
          model: 'gpt-5.2-codex',
          valuesByModel: { 'gpt-5.2-codex': { effort: 'medium' } }
        }
      }
    })

    expect(startup?.command).not.toContain("'-m'")
    expect(startup?.sessionOptions).toBeUndefined()
  })

  it('applies native-chat preferences to chat-default folder launches', () => {
    const startup = buildOnboardingFolderAgentStartup({
      ...getDefaultSettings('/tmp/orca-workspaces'),
      defaultTuiAgent: 'codex',
      experimentalNativeChat: true,
      openAgentTabsInChatByDefault: true,
      nativeChatSessionOptions: {
        codex: {
          model: 'gpt-5.2-codex',
          valuesByModel: { 'gpt-5.2-codex': { effort: 'medium' } }
        }
      }
    })

    expect(startup?.command).toContain("'-m' 'gpt-5.2-codex'")
    expect(startup?.sessionOptions).toEqual({
      model: 'gpt-5.2-codex',
      effort: 'medium'
    })
  })

  it('does not infer an agent from auto mode', () => {
    const startup = buildOnboardingFolderAgentStartup({
      ...getDefaultSettings('/tmp/orca-workspaces'),
      defaultTuiAgent: null
    })

    expect(startup).toBeUndefined()
  })

  it('seeds after a dismissed onboarding run before any project was added', () => {
    expect(
      shouldSeedFolderAgentAfterDismissedOnboarding(
        {
          ...getDefaultOnboardingState(),
          outcome: 'dismissed'
        },
        false
      )
    ).toBe(true)
  })

  it('does not seed after another project was already added outside onboarding', () => {
    expect(
      shouldSeedFolderAgentAfterDismissedOnboarding(
        {
          ...getDefaultOnboardingState(),
          outcome: 'dismissed'
        },
        true
      )
    ).toBe(false)
  })

  it('does not seed after onboarding already added a project', () => {
    expect(
      shouldSeedFolderAgentAfterDismissedOnboarding(
        {
          ...getDefaultOnboardingState(),
          outcome: 'dismissed',
          checklist: { ...getDefaultOnboardingState().checklist, addedFolder: true }
        },
        false
      )
    ).toBe(false)
  })

  it('spec016#6 developer mode keeps the launch arguments Orca always passed', () => {
    const startup = buildOnboardingFolderAgentStartup({
      ...getDefaultSettings('/tmp/orca-workspaces'),
      interfaceMode: 'developer',
      defaultTuiAgent: 'codex'
    })

    expect(startup?.command).toBe("codex '--dangerously-bypass-approvals-and-sandbox'")
  })

  it('spec016#4 seeds no folder agent in simple mode when the default agent has no conversation', () => {
    const startup = buildOnboardingFolderAgentStartup({
      ...getDefaultSettings('/tmp/orca-workspaces'),
      defaultTuiAgent: 'antigravity'
    })

    expect(startup).toBeUndefined()
  })

  it('builds the skipped-onboarding folder startup from the persisted default agent', () => {
    expect(
      buildDismissedOnboardingFolderAgentStartup(
        {
          ...getDefaultSettings('/tmp/orca-workspaces'),
          defaultTuiAgent: 'codex',
          agentCmdOverrides: { codex: 'echo onboarding-folder-agent' }
        },
        { ...getDefaultOnboardingState(), outcome: 'dismissed' },
        false
      )
    ).toEqual({
      command: 'echo onboarding-folder-agent',
      env: {},
      launchAgent: 'codex',
      launchConfig: {
        agentCommand: 'echo onboarding-folder-agent',
        agentArgs: '',
        agentEnv: {}
      },
      sessionOptions: undefined,
      telemetry: {
        agent_kind: 'codex',
        launch_source: 'onboarding',
        request_kind: 'new'
      }
    })
  })
})
