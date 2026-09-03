/** Result of preparing a folder's structure (spec 005, criterion 5 — "Preparar la carpeta"). */
export type OnboardingBrainPrepareResult = {
  alreadyPrepared: boolean
  added: string[]
}

/** Result of creating a brand-new folder for "Crear una nueva" (criterion 4). */
export type OnboardingBrainCreateFolderResult = {
  path: string
}

/** Whether the chosen folder already has a workspace (spec 005 ajuste del
 *  2026-09-03, 📌 Peter) — the "Tu primer workspace" step skips itself when true. */
export type OnboardingBrainHasWorkspacesResult = {
  hasWorkspaces: boolean
}

/** Result of creating the first workspace (spec 005 ajuste del 2026-09-03, 📌 Peter). */
export type OnboardingBrainCreateWorkspaceResult = {
  workspaceRelativePath: string
}
