import { INTERFACE_MODE_SIMPLE, type InterfaceMode } from '../../../shared/interface-mode'
import { useAppStore } from '../store'

/** Single point of truth for interface mode in the renderer: the persisted settings
 *  value, never duplicated into UI state. Missing settings (not loaded yet) read as
 *  simple, the default mode. */
export function useInterfaceMode(): InterfaceMode {
  return useAppStore((state) => state.settings?.interfaceMode ?? INTERFACE_MODE_SIMPLE)
}
