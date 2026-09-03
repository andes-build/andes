import React from 'react'
import { BookOpen, LayoutGrid, MessageSquarePlus, MoreHorizontal, FileText } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

/** Opens a real conversation with the agent (spec 010, criterion 3): a fresh
 *  tab on the active folder, launching the detected coding agent CLI in chat
 *  view mode — the existing "experimental conversation" (Orca's
 *  `viewMode: 'chat'`) that spec 011 is building the real thread surface on
 *  top of. Falls back to a plain new tab (still a real, working agent
 *  session — never an empty screen) when no agent is detected yet. Never
 *  touches native-chat/ itself: this is the same public `createTab` action
 *  any terminal-pane caller uses. */
function openNewThread(): void {
  const state = useAppStore.getState()
  const worktreeId = state.activeWorktreeId
  if (!worktreeId) {
    return
  }
  const launchAgent = state.detectedAgentIds?.[0]
  state.setActiveView('terminal')
  state.createTab(worktreeId, undefined, undefined, {
    viewMode: 'chat',
    activate: true,
    recordInteraction: true,
    ...(launchAgent ? { launchAgent } : {})
  })
}

type SimpleModeNavItemProps = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  onClick: () => void
  testId: string
}

function SimpleModeNavItem({
  icon: Icon,
  label,
  active,
  onClick,
  testId
}: SimpleModeNavItemProps): React.JSX.Element {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium tracking-tight transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/8'
      )}
    >
      <Icon className={cn('size-4 shrink-0', !active && 'text-sidebar-foreground/40')} />
      <span className="flex-1">{label}</span>
    </button>
  )
}

/** The simple-mode navigation (spec 010, criterion 4): exactly New thread,
 *  Command Center, Files, Agents & skills, More — nothing from the
 *  developer-mode nav (worktree palette, Automations, Artifacts, ...). */
export function SimpleModeNav(): React.JSX.Element {
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const openFilesPage = useAppStore((s) => s.openFilesPage)
  const openSkillsPage = useAppStore((s) => s.openSkillsPage)
  const openSettings = useAppStore((s) => s.openSettingsPage)

  return (
    <nav
      className="flex flex-col gap-0.5 px-2 pt-2 pb-1"
      data-testid="simple-mode-nav"
      aria-label={translate('auto.components.workspaceScope.SimpleModeNav.newThread', 'New thread')}
    >
      <SimpleModeNavItem
        testId="simple-mode-nav-new-thread"
        icon={MessageSquarePlus}
        label={translate('auto.components.workspaceScope.SimpleModeNav.newThread', 'New thread')}
        active={false}
        onClick={openNewThread}
      />
      <SimpleModeNavItem
        testId="simple-mode-nav-command-center"
        icon={LayoutGrid}
        label={translate(
          'auto.components.workspaceScope.SimpleModeNav.commandCenter',
          'Command Center'
        )}
        active={activeView === 'terminal'}
        onClick={() => setActiveView('terminal')}
      />
      <SimpleModeNavItem
        testId="simple-mode-nav-files"
        icon={FileText}
        label={translate('auto.components.workspaceScope.SimpleModeNav.files', 'Files')}
        active={activeView === 'files'}
        onClick={openFilesPage}
      />
      <SimpleModeNavItem
        testId="simple-mode-nav-agents-and-skills"
        icon={BookOpen}
        label={translate(
          'auto.components.workspaceScope.SimpleModeNav.agentsAndSkills',
          'Agents & skills'
        )}
        active={activeView === 'skills'}
        onClick={openSkillsPage}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-testid="simple-mode-nav-more"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium tracking-tight text-sidebar-foreground/70 transition-colors hover:bg-sidebar-foreground/8"
          >
            <MoreHorizontal className="size-4 shrink-0 text-sidebar-foreground/40" />
            <span className="flex-1">
              {translate('auto.components.workspaceScope.SimpleModeNav.more', 'More')}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={openSettings}>
            {translate('auto.components.workspaceScope.SimpleModeMoreMenu.settings', 'Settings')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
