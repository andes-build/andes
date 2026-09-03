import type React from 'react'
import classicIconUrl from '../../../../../resources/icon.png?url'
import { normalizeAppIconId, type AppIconId } from '../../../../shared/app-icon'
import { translate } from '@/i18n/i18n'

const APP_ICON_URLS = {
  classic: classicIconUrl
} satisfies Record<AppIconId, string>

type AppIconSelectorProps = {
  value: AppIconId
}

// Andes ships a single app icon (spec 014) — no alternates left to cycle through.
export function AppIconSelector({ value }: AppIconSelectorProps): React.JSX.Element {
  const selected = normalizeAppIconId(value)

  return (
    <div className="flex items-center justify-center gap-2">
      <img
        src={APP_ICON_URLS[selected]}
        alt={translate('auto.components.settings.AppIconSelector.415fa76f64', 'Selected app icon')}
        className="size-24 rounded-2xl object-contain"
      />
    </div>
  )
}
