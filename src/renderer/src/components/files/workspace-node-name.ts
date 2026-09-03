import { translate } from '@/i18n/i18n'

/** Translates the six system file/folder names the Files tree can show into
 *  their node name (spec 010, criterion 8) — never the raw file name a
 *  non-technical reader would not recognize. A name this system does not
 *  know (resolver.md, tree.md, a workspace's own files, ...) is shown as-is. */
export function translateWorkspaceNodeName(fileName: string): string {
  switch (fileName) {
    case 'README.md':
    case 'context.md':
      return translate('auto.components.files.WorkspaceNodeName.whatThisIs', 'What this is')
    case 'decisions.md':
      return translate('auto.components.files.WorkspaceNodeName.decisions', 'Decisions')
    case 'learnings.md':
      return translate('auto.components.files.WorkspaceNodeName.learnings', 'Learnings')
    case 'backlog.md':
      return translate('auto.components.files.WorkspaceNodeName.backlog', 'Backlog')
    case 'initiatives':
      return translate('auto.components.files.WorkspaceNodeName.initiatives', 'Initiatives')
    case 'research':
      return translate('auto.components.files.WorkspaceNodeName.research', 'Research')
    default:
      return fileName
  }
}
