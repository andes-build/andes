import { INTERFACE_MODE_SIMPLE, type InterfaceMode } from './interface-mode'

/**
 * Development surfaces criterion 5 (spec 002) keeps unreachable by command, shortcut, or menu
 * in simple mode. Nothing here is a single dispatcher — Andes has none — so each surface is
 * gated at its own real entry point (see the call sites this list documents) and this module
 * exists so every gate and every test read the same 15 names.
 */
export const SIMPLE_MODE_BLOCKED_SURFACES = [
  'browser-pane',
  'emulator-pane',
  'pull-request-page',
  'task-page',
  'dashboard',
  'dashboard-popout',
  'artifacts',
  'automations',
  'floating-terminal',
  'terminal-quick-commands',
  'cmd-j',
  'stats',
  'pet',
  'workspace-cleanup',
  'new-workspace'
] as const

export type SimpleModeBlockedSurface = (typeof SIMPLE_MODE_BLOCKED_SURFACES)[number]

export function isSurfaceAvailableInInterfaceMode(
  _surface: SimpleModeBlockedSurface,
  interfaceMode: InterfaceMode
): boolean {
  return interfaceMode !== INTERFACE_MODE_SIMPLE
}
