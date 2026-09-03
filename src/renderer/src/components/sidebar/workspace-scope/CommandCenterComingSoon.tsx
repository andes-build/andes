import React from 'react'
import { translate } from '@/i18n/i18n'

/** Placeholder for the Command Center screen (spec 009's own territory —
 *  not built here). Keeps the "Command Center" nav entry required by spec
 *  010, criterion 4 from opening a blank/broken page before spec 009 lands
 *  its real content under the same `activeView: 'command-center'`. */
export function CommandCenterComingSoon(): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
      <h1 className="font-serif text-xl text-foreground">
        {translate(
          'auto.components.workspaceScope.CommandCenterComingSoon.title',
          'Command Center'
        )}
      </h1>
      <p className="text-sm text-muted-foreground">
        {translate(
          'auto.components.workspaceScope.CommandCenterComingSoon.description',
          'Coming soon.'
        )}
      </p>
    </div>
  )
}

export default CommandCenterComingSoon
