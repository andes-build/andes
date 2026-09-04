import React from 'react'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type RecentThreadSummary = {
  id: string
  title: string
  timestampLabel: string
  /** Spec 013, criterion 2: the thread currently open in the terminal view. */
  isActive?: boolean
}

export type RecentThreadsSectionProps = {
  threads: RecentThreadSummary[]
  onSelectThread: (id: string) => void
  onViewHistory: () => void
}

/** "Recent threads" under the scope selector (spec 010, criterion 5). Purely
 *  props-driven: the per-workspace conversation history this reads from is
 *  not built yet (Andes threads are per opened folder today, not per
 *  AI First OS workspace — see decisions.md), so callers pass `[]` until
 *  that exists; the component and its empty state are real either way. */
export function RecentThreadsSection({
  threads,
  onSelectThread,
  onViewHistory
}: RecentThreadsSectionProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1 px-2 py-2" data-testid="recent-threads-section">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/50">
          {translate('auto.components.workspaceScope.RecentThreadsSection.title', 'Recent threads')}
        </span>
        <Button variant="ghost" size="xs" className="h-5 px-1 text-[11px]" onClick={onViewHistory}>
          {translate(
            'auto.components.workspaceScope.RecentThreadsSection.viewHistory',
            'View history'
          )}
        </Button>
      </div>
      {threads.length === 0 ? (
        <div className="px-0.5 py-1 text-[12px] text-sidebar-foreground/50">
          {translate(
            'auto.components.workspaceScope.RecentThreadsSection.empty',
            'No recent threads yet'
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              data-testid="recent-thread-row"
              data-active={thread.isActive ? 'true' : 'false'}
              aria-current={thread.isActive ? 'true' : undefined}
              onClick={() => onSelectThread(thread.id)}
              className={cn(
                'flex items-center justify-between rounded-md px-2 py-1 text-left text-[12px]',
                thread.isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-foreground/8'
              )}
            >
              <span className="truncate">{thread.title}</span>
              <span className="shrink-0 text-[10px] text-sidebar-foreground/45">
                {thread.timestampLabel}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
