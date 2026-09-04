import type { StateCreator } from 'zustand'
import type { AppState } from '../types'

/**
 * Whether the operator asked for the Command Center explicitly (spec 009).
 *
 * The Command Center is the home screen of a workspace with no thread open
 * yet (criterion 1). Spec 010 then shipped a "Command Center" item in the
 * simple-mode navigation, which points at the same `terminal` view: without
 * this flag that item does nothing once a thread exists, because the thread
 * owns the view. The flag is what separates "no thread yet, so show the home
 * screen" from "there are threads, and the operator asked to go home".
 *
 * It is deliberately not persisted: coming back to the app with a thread open
 * lands on that thread, which is where the work was.
 */
export type CommandCenterViewSlice = {
  commandCenterRequested: boolean
  /** The navigation item. */
  showCommandCenter: () => void
  /** Opening a thread leaves the home screen; called from `openNewThread`. */
  leaveCommandCenter: () => void
}

export const createCommandCenterViewSlice: StateCreator<
  AppState,
  [],
  [],
  CommandCenterViewSlice
> = (set) => ({
  commandCenterRequested: false,
  showCommandCenter: () => set({ commandCenterRequested: true }),
  leaveCommandCenter: () => set({ commandCenterRequested: false })
})
