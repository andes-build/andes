import {
  isNativeChatSupportedAgent,
  nativeChatRequiresLocalTranscript
} from '@/lib/native-chat-supported-agent'
import { pickTuiAgent } from '../../../shared/tui-agent-selection'
import {
  ASK_PERMISSION_TUI_AGENT_ARGS,
  stripPermissionBypassArgs
} from '../../../shared/tui-agent-permissions'
import { resolveTuiAgentLaunchArgs } from '../../../shared/tui-agent-launch-defaults'
import { quoteStartupArg } from '../../../shared/tui-agent-startup-shell'
import type { GlobalSettings } from '../../../shared/global-settings-types'
import type { TuiAgent } from '../../../shared/tui-agent'

/**
 * Spec 016. Two rules of simple mode, in one place:
 *
 * 1. A thread only launches an agent whose conversation the app can draw.
 *    `decideInitialAgentTabViewMode` already decides that with
 *    `isNativeChatSupportedAgent` plus the local-transcript condition, so the
 *    agent choice uses the same predicates instead of a second list that would
 *    drift. Any other agent — the machine default included — would fall back to
 *    a raw terminal, which is what simple mode promises not to show.
 * 2. No permission-bypass argument is ever passed. The profile default carries
 *    one for almost every agent (`DEFAULT_TUI_AGENT_ARGS = YOLO_TUI_AGENT_ARGS`,
 *    `tui-agent-launch-defaults.ts`), so it is stripped here rather than in the
 *    shared defaults: developer mode keeps Orca's behavior untouched.
 */
export function listSimpleModeThreadAgents(args: {
  detectedAgentIds: readonly TuiAgent[] | null | undefined
  nativeChatTranscriptIsLocalReadable?: boolean
}): TuiAgent[] {
  return (args.detectedAgentIds ?? []).filter(
    (agent) =>
      isNativeChatSupportedAgent(agent) &&
      (!nativeChatRequiresLocalTranscript(agent) ||
        args.nativeChatTranscriptIsLocalReadable === true)
  )
}

export function resolveSimpleModeThreadAgent(args: {
  defaultTuiAgent: TuiAgent | 'blank' | null | undefined
  detectedAgentIds: readonly TuiAgent[] | null | undefined
  disabledTuiAgents: readonly TuiAgent[] | null | undefined
  nativeChatTranscriptIsLocalReadable?: boolean
}): TuiAgent | null {
  const usable = listSimpleModeThreadAgents(args)
  const preferred =
    args.defaultTuiAgent &&
    args.defaultTuiAgent !== 'blank' &&
    usable.includes(args.defaultTuiAgent)
      ? args.defaultTuiAgent
      : null
  return pickTuiAgent(preferred, usable, args.disabledTuiAgents)
}

/**
 * The configured launch arguments minus every permission-bypass argument, plus
 * the agent's ask-for-permission argument when it has one.
 *
 * Spec 023: `appendSystemPrompt`, when given, rides along as
 * `--append-system-prompt <text>` — system-level context the CLI never draws
 * in the conversation and never titles the session from. Applied only to
 * `claude`: it's the only agent this was verified against
 * (`docs/research/2026-09-04-de-donde-sale-el-titulo-del-hilo/`). Every other
 * agent ignores the argument and keeps its prior args untouched.
 */
export function resolveSimpleModeThreadAgentArgs(
  agent: TuiAgent,
  settings: Pick<GlobalSettings, 'agentDefaultArgs'> | null | undefined,
  appendSystemPrompt?: string | null
): string {
  const stripped = stripPermissionBypassArgs(
    resolveTuiAgentLaunchArgs(agent, settings?.agentDefaultArgs)
  )
  const askArgs = ASK_PERMISSION_TUI_AGENT_ARGS[agent]
  const withAskArgs =
    !askArgs || stripped.includes('--permission-mode')
      ? stripped
      : stripped
        ? `${stripped} ${askArgs}`
        : askArgs
  if (agent !== 'claude' || !appendSystemPrompt) {
    return withAskArgs
  }
  // Why 'posix' here regardless of the eventual launch shell: this string is
  // the same "settings-field" input every other agentArgs string is — it gets
  // tokenized once as portable-Unix text and re-quoted for the real shell at
  // launch time (`tokenizeStartupCommand`/`quoteStartupArg` in
  // `tui-agent-startup-shell.ts`), the same as every other value that flows
  // through this function.
  const flag = `--append-system-prompt ${quoteStartupArg(appendSystemPrompt, 'posix')}`
  return withAskArgs ? `${withAskArgs} ${flag}` : flag
}
