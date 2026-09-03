/** The core's own trailing meta (node count/time/version, and an optional
 *  `active-role:` line) — shown small and gray at the foot, never as a card
 *  (spec 009 delegated decision). */
export function CommandCenterFooter({ lines }: { lines: string[] }): React.JSX.Element | null {
  if (lines.length === 0) {
    return null
  }
  return (
    <p data-command-center-footer className="text-[11px] text-muted-foreground">
      {lines.join(' · ')}
    </p>
  )
}
