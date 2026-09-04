import { isSkillsCliAgentKeyShaped } from './skills-cli-agent-keys'

export const ANDES_SKILLS_REPOSITORY_URL = 'https://github.com/andes-build/andes'

export const ORCA_CLI_SKILL_NAME = 'orca-cli'
export const COMPUTER_USE_SKILL_NAME = 'computer-use'
export const ORCHESTRATION_SKILL_NAME = 'orchestration'
export const EPHEMERAL_VMS_SKILL_NAME = 'orca-per-workspace-env'

// Why: `yes` and `agents` default off so every Settings/onboarding string a human
// pastes keeps its interactive prompts and the CLI's own agent detection. Only an
// unattended spawn, which nothing can answer, opts in.
export type AgentFeatureSkillCommandOptions = {
  global?: boolean
  yes?: boolean
  agents?: readonly string[]
}

// Why: shared by both install-args builders below (named skills from the
// Andes repo, and a whole pack from an arbitrary repo) so the two agent
// safety rules — no unattended all-agents install, no value the CLI would
// silently drop — live in exactly one place.
function validateAgentInstallTargets(agents: readonly string[], yes: boolean | undefined): void {
  // Why: -y with no --agent is the one combination that makes `skills add` install
  // into every agent it knows. Refuse it here so no caller can express it.
  if (yes && agents.length === 0) {
    throw new Error('An install target is required when skipping prompts.')
  }
  // Why: a value the skills CLI would drop leaves it with no target at all, which
  // is the same all-agents install as passing no --agent.
  const unusable = agents.find((agent) => !isSkillsCliAgentKeyShaped(agent))
  if (unusable !== undefined) {
    throw new Error(`"${unusable}" is not a usable install target.`)
  }
}

export function buildAgentFeatureSkillInstallArgs(
  skillNames: readonly string[],
  options: AgentFeatureSkillCommandOptions = {}
): string[] {
  if (skillNames.length === 0) {
    throw new Error('At least one skill name is required.')
  }
  const global = options.global ?? true
  const agents = options.agents ?? []
  validateAgentInstallTargets(agents, options.yes)
  // Why: one flag per name remains compatible with both single-value and variadic parsers.
  const skillArgs = skillNames.flatMap((name) => ['--skill', name])
  return [
    'skills',
    'add',
    ANDES_SKILLS_REPOSITORY_URL,
    ...skillArgs,
    ...(global ? ['--global'] : []),
    // Why: an explicit --agent stops `skills add` calling its own detection, whose
    // zero-detected branch installs into all ~75 known agents and litters a bare
    // host with agent config directories it has no agent for.
    ...agents.flatMap((agent) => ['--agent', agent]),
    // Why: without -y `skills add` opens an interactive agent picker and blocks
    // forever on any TTY, which is every ssh session.
    ...(options.yes ? ['-y'] : [])
  ]
}

// Why: the onboarding Skills step (spec 005, criterion 6) installs a whole
// pack from a repo the person types in, with no fixed skill grabbed in code —
// so unlike buildAgentFeatureSkillInstallArgs above, there is no --skill
// filter and no fixed repository constant. Same agent-target validation,
// reused instead of re-implemented.
export function buildSkillsPackInstallArgs(
  repositoryUrl: string,
  options: Pick<AgentFeatureSkillCommandOptions, 'agents' | 'yes'> = {}
): string[] {
  const trimmedRepo = repositoryUrl.trim()
  if (trimmedRepo.length === 0) {
    throw new Error('A skills pack repository is required.')
  }
  const agents = options.agents ?? []
  validateAgentInstallTargets(agents, options.yes)
  return [
    'skills',
    'add',
    trimmedRepo,
    ...agents.flatMap((agent) => ['--agent', agent]),
    ...(options.yes ? ['-y'] : [])
  ]
}

export function buildSkillsPackInstallCommand(
  repositoryUrl: string,
  options: Pick<AgentFeatureSkillCommandOptions, 'agents' | 'yes'> = {}
): string {
  return `npx ${buildSkillsPackInstallArgs(repositoryUrl, options).join(' ')}`
}

export function buildAgentFeatureSkillInstallCommand(
  skillNames: readonly string[],
  options: AgentFeatureSkillCommandOptions = {}
): string {
  return `npx ${buildAgentFeatureSkillInstallArgs(skillNames, options).join(' ')}`
}

export function buildAgentFeatureSkillUpdateArgs(
  skillNames: string | readonly string[],
  options: AgentFeatureSkillCommandOptions = {}
): string[] {
  const rawNames = typeof skillNames === 'string' ? [skillNames] : skillNames
  const names = rawNames.map((name) => name.trim()).filter((name) => name.length > 0)
  if (names.length === 0) {
    throw new Error('A skill name is required.')
  }
  const global = options.global ?? true
  return [
    'skills',
    'update',
    ...names,
    global ? '--global' : '--project',
    ...(options.yes ? ['-y'] : [])
  ]
}

export function buildAgentFeatureSkillUpdateCommand(
  skillNames: string | readonly string[],
  options: AgentFeatureSkillCommandOptions = {}
): string {
  return `npx ${buildAgentFeatureSkillUpdateArgs(skillNames, options).join(' ')}`
}

export const ORCA_CLI_SKILL_INSTALL_COMMAND = buildAgentFeatureSkillInstallCommand([
  ORCA_CLI_SKILL_NAME
])

export const ORCA_CLI_SKILL_UPDATE_COMMAND =
  buildAgentFeatureSkillUpdateCommand(ORCA_CLI_SKILL_NAME)

export const COMPUTER_USE_SKILL_INSTALL_COMMAND = buildAgentFeatureSkillInstallCommand([
  COMPUTER_USE_SKILL_NAME
])

export const COMPUTER_USE_SKILL_UPDATE_COMMAND =
  buildAgentFeatureSkillUpdateCommand(COMPUTER_USE_SKILL_NAME)

export const ORCHESTRATION_SKILL_INSTALL_COMMAND = buildAgentFeatureSkillInstallCommand([
  ORCHESTRATION_SKILL_NAME
])

export const ORCHESTRATION_SKILL_UPDATE_COMMAND =
  buildAgentFeatureSkillUpdateCommand(ORCHESTRATION_SKILL_NAME)

export const EPHEMERAL_VMS_SKILL_INSTALL_COMMAND = buildAgentFeatureSkillInstallCommand([
  EPHEMERAL_VMS_SKILL_NAME
])

export const EPHEMERAL_VMS_SKILL_UPDATE_COMMAND =
  buildAgentFeatureSkillUpdateCommand(EPHEMERAL_VMS_SKILL_NAME)

export const ORCA_CLI_ORCHESTRATION_SKILL_INSTALL_COMMAND = buildAgentFeatureSkillInstallCommand([
  ORCA_CLI_SKILL_NAME,
  ORCHESTRATION_SKILL_NAME
])
