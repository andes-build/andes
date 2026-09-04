import { ShieldQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'

/** What the card draws. Every field is a field of the permission itself; nothing here is read off
 *  a terminal screen. */
export type NativeChatApprovalCardPrompt = {
  title: string
  detail?: string
  options: { id: string; label: string }[]
}

export type NativeChatApprovalCardProps = {
  approval: NativeChatApprovalCardPrompt
  /** Reports the id of the option the person picked. What that id means to the agent belongs to
   *  the caller, which is what keeps this card free of any one transport. */
  onChoose: (optionId: string) => void
}

/**
 * Native renderer for an agent tool-approval as an Allow/Deny card.
 *
 * The card answers with the chosen option's id and nothing else. Until spec 012 it sent a literal
 * keystroke instead, which is what made it an imitation of a card rather than one: the buttons were
 * typing into a hidden terminal. The first option reads as the affirmative action and gets the
 * primary styling.
 */
export function NativeChatApprovalCard({
  approval,
  onChoose
}: NativeChatApprovalCardProps): React.JSX.Element {
  return (
    <div className="shrink-0 bg-background">
      <div className="mx-auto w-full max-w-4xl px-3 pt-2 pb-1 sm:px-4">
        <div className="flex w-full flex-col gap-2 rounded-lg border border-input bg-card px-4 py-3 shadow-xs">
          <div className="flex items-start gap-2">
            <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{approval.title}</p>
              {approval.detail ? (
                <p className="mt-0.5 break-words font-mono text-xs text-muted-foreground">
                  {approval.detail}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {approval.options.map((option, index) => (
              <button
                key={`${option.id}-${index}`}
                type="button"
                onClick={() => onChoose(option.id)}
                className={cn(
                  'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  index === 0
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-border bg-background text-foreground hover:bg-accent'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
