import { useInterfaceMode } from '@/hooks/useInterfaceMode'
import { INTERFACE_MODE_SIMPLE } from '../../../../shared/interface-mode'

/** Spec 013, criterion 7: only simple mode redacts tool activity to plain
 *  language; developer mode keeps the raw tool line (criterion 9). */
export function usePlainLanguageActivity(): boolean {
  return useInterfaceMode() === INTERFACE_MODE_SIMPLE
}
