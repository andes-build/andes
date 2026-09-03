import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SimpleAgentStep } from './SimpleAgentStep'

describe('spec005#2 SimpleAgentStep guided install', () => {
  it('shows install commands, docs link, and a search-again button when nothing is detected', () => {
    const html = renderToStaticMarkup(
      <TooltipProvider>
        <SimpleAgentStep
          selectedAgent={null}
          onSelect={vi.fn()}
          detectedSet={new Set()}
          isDetecting={false}
          onRefresh={vi.fn()}
        />
      </TooltipProvider>
    )

    expect(html).toContain('npm install -g @anthropic-ai/claude-code')
    expect(html).toContain('npm install -g @openai/codex')
    expect(html.match(/Docs/g)?.length).toBe(2)
    expect(html).toContain('Search again')
  })

  it('hides the guided install block once an agent is detected', () => {
    const html = renderToStaticMarkup(
      <TooltipProvider>
        <SimpleAgentStep
          selectedAgent="claude"
          onSelect={vi.fn()}
          detectedSet={new Set(['claude'])}
          isDetecting={false}
          onRefresh={vi.fn()}
        />
      </TooltipProvider>
    )

    expect(html).not.toContain('Search again')
    expect(html).not.toContain('npm install -g @anthropic-ai/claude-code')
  })
})
