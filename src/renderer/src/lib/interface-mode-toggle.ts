import {
  INTERFACE_MODE_DEVELOPER,
  INTERFACE_MODE_SIMPLE,
  type InterfaceMode
} from '../../../shared/interface-mode'

/** Hidden developer-mode door: Option-click the Advanced title flips the mode. */
export function nextInterfaceModeOnAltClick(current: InterfaceMode): InterfaceMode {
  return current === INTERFACE_MODE_DEVELOPER ? INTERFACE_MODE_SIMPLE : INTERFACE_MODE_DEVELOPER
}
