import React from 'react'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import type { WorkspaceFileSaveState } from './use-workspace-file-autosave'

/** Says what happened to what the person wrote, with nothing to press
 *  (spec 024, criterion 3). */
export function WorkspaceFileSaveStatus({
  state
}: {
  state: WorkspaceFileSaveState
}): React.JSX.Element {
  const label = describeSaveState(state)
  return (
    <span
      data-testid="workspace-file-save-status"
      aria-live="polite"
      className={cn(
        'truncate text-xs',
        state.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
      )}
    >
      {label}
    </span>
  )
}

export function describeSaveState(state: WorkspaceFileSaveState): string {
  switch (state.status) {
    case 'idle':
      return translate('auto.components.files.WorkspaceFileSaveStatus.idle', 'Saves as you write')
    case 'pending':
    case 'saving':
      return translate('auto.components.files.WorkspaceFileSaveStatus.saving', 'Saving…')
    case 'saved':
      return translate('auto.components.files.WorkspaceFileSaveStatus.saved', 'Saved')
    case 'saved-over-outside-change':
      return translate(
        'auto.components.files.WorkspaceFileSaveStatus.savedOverOutsideChange',
        'Saved. This file had also changed somewhere else, and what you wrote is what was kept.'
      )
    case 'error':
      return translate(
        'auto.components.files.WorkspaceFileSaveStatus.error',
        'Could not save this file.'
      )
  }
}
