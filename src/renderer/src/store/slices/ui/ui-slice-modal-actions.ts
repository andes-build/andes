import type { UISlice, UISliceGet, UISliceSet } from './ui-slice-contract'
import { settleEvictedModalData } from '../modal-slot-dismissal'
import { INTERFACE_MODE_SIMPLE } from '../../../../../shared/interface-mode'

// Spec 002, criterion 5: these modal ids are developer-only surfaces
// (cmd-j, workspace-cleanup, new-workspace) — blocked here so every opener
// (button, IPC shortcut bridge, cmd-j quick action, contextual tour) is covered
// by one guard instead of each repeating the interfaceMode check.
const SIMPLE_MODE_BLOCKED_MODALS: ReadonlySet<UISlice['activeModal']> = new Set([
  'worktree-palette',
  'workspace-cleanup',
  'new-workspace-composer'
])

export function createUiModalActions(set: UISliceSet, get: UISliceGet): Partial<UISlice> {
  return {
    activeModal: 'none',
    modalData: {},
    openModal: (modal, data = {}) => {
      if (
        SIMPLE_MODE_BLOCKED_MODALS.has(modal) &&
        get().settings?.interfaceMode === INTERFACE_MODE_SIMPLE
      ) {
        return
      }
      if (modal === 'add-repo' || modal === 'create-worktree') {
        get().recordFeatureInteraction?.('workspace-creation')
      }
      const evicted = get().modalData
      set({
        activeModal: modal,
        modalData: data
      })
      settleEvictedModalData(evicted)
    },
    closeModal: () => {
      const evicted = get().modalData
      set({ activeModal: 'none', modalData: {} })
      settleEvictedModalData(evicted)
    }
  }
}
