import React, { useState } from 'react'
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkspaceFileTreeNode } from '../../../../shared/workspace-scope-types'
import { translateWorkspaceNodeName } from './workspace-node-name'

type WorkspaceFileTreeRowProps = {
  node: WorkspaceFileTreeNode
  depth: number
  selectedPath: string | null
  onSelectFile: (node: WorkspaceFileTreeNode) => void
}

function WorkspaceFileTreeRow({
  node,
  depth,
  selectedPath,
  onSelectFile
}: WorkspaceFileTreeRowProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(depth < 1)
  const label = translateWorkspaceNodeName(node.name)
  const isSelected = !node.isDirectory && node.path === selectedPath

  return (
    <div>
      <button
        type="button"
        onClick={() => (node.isDirectory ? setExpanded((prev) => !prev) : onSelectFile(node))}
        aria-current={isSelected ? 'true' : undefined}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[13px] transition-colors',
          isSelected ? 'bg-accent text-accent-foreground' : 'text-foreground/80 hover:bg-accent/60'
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {node.isDirectory ? (
          expanded ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {node.isDirectory ? (
          <Folder className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <File className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{label}</span>
      </button>
      {node.isDirectory && expanded && node.children && node.children.length > 0 ? (
        <div>
          {node.children.map((child) => (
            <WorkspaceFileTreeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export type WorkspaceFileTreePaneProps = {
  root: WorkspaceFileTreeNode[]
  selectedPath: string | null
  onSelectFile: (node: WorkspaceFileTreeNode) => void
}

export function WorkspaceFileTreePane({
  root,
  selectedPath,
  onSelectFile
}: WorkspaceFileTreePaneProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5 p-1.5" data-testid="workspace-file-tree">
      {root.map((node) => (
        <WorkspaceFileTreeRow
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  )
}
