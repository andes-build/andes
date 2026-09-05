import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// spec 025 — "El modo claro no es blanco y negro": the light-mode content canvas
// (`--background`) stops being pure white so the dark sidebar doesn't split the
// screen in two, while text contrast and elevated surfaces (cards, popovers,
// menus, fields) keep working. This test reads the tokens straight out of
// main.css instead of hardcoding them here, so it fails the moment a future
// edit drifts from what it asserts.

const CSS_PATH = join(__dirname, 'main.css')
const css = readFileSync(CSS_PATH, 'utf8')

function extractBlock(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) {
    throw new Error(`selector not found: ${selector}`)
  }
  const bodyStart = css.indexOf('{', start) + 1
  const bodyEnd = css.indexOf('\n}', bodyStart)
  if (bodyEnd === -1) {
    throw new Error(`unterminated block: ${selector}`)
  }
  return css.slice(bodyStart, bodyEnd)
}

function readToken(block: string, name: string): string {
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`))
  if (!match) {
    throw new Error(`token not found: --${name}`)
  }
  return match[1].trim()
}

const lightBlock = extractBlock(css, ':root')
const darkBlock = extractBlock(css, '.dark')

function normalizeHex(value: string): string {
  const hex = value.startsWith('#') ? value.slice(1) : value
  const expanded =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex
  return `#${expanded.toLowerCase()}`
}

function hexToRgb(value: string): { r: number; g: number; b: number } {
  const hex = normalizeHex(value).slice(1)
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16)
  }
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const toLinear = (channel: number): number => {
    const normalized = channel / 255
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a))
  const lb = relativeLuminance(hexToRgb(b))
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('spec025 — light-mode canvas is a light gray, not pure white', () => {
  it('criterio 1 — el fondo de contenido en claro no es blanco puro', () => {
    const background = readToken(lightBlock, 'background')
    expect(normalizeHex(background)).not.toBe('#ffffff')
  })

  it('criterio 3 — contraste de texto primario y secundario/deshabilitado contra el fondo nuevo', () => {
    const background = readToken(lightBlock, 'background')
    const foreground = readToken(lightBlock, 'foreground')
    const mutedForeground = readToken(lightBlock, 'muted-foreground')

    // Primary text (--foreground) meets WCAG AA for normal text.
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5)
    // Secondary and disabled text both render as --muted-foreground in this
    // codebase (disabled states dim it further with opacity utilities, e.g.
    // `disabled:opacity-50`); the token itself meets the large-text/UI floor.
    expect(contrastRatio(mutedForeground, background)).toBeGreaterThanOrEqual(3)
  })

  it('criterio 4 — las superficies elevadas (tarjetas, popovers, campos, menús) no se confunden con el fondo', () => {
    const background = normalizeHex(readToken(lightBlock, 'background'))
    const surfaceTokens = ['card', 'popover', 'secondary', 'muted', 'accent', 'input']
    for (const token of surfaceTokens) {
      const value = normalizeHex(readToken(lightBlock, token))
      expect(value, `--${token} debe distinguirse de --background`).not.toBe(background)
    }
  })

  it('criterio 5 — el modo oscuro no cambia', () => {
    // Values pinned from before spec 025: this test fails if a future change to
    // this token list touches dark mode, which spec 025 explicitly leaves alone.
    const expectedDarkTokens: Record<string, string> = {
      background: '#0a0a0a',
      foreground: '#fafafa',
      card: '#171717',
      popover: '#171717',
      secondary: '#262626',
      muted: '#262626',
      'muted-foreground': '#a1a1a1',
      accent: '#404040',
      border: 'rgb(255 255 255 / 0.07)',
      input: 'rgb(255 255 255 / 0.15)',
      sidebar: '#171717',
      'worktree-sidebar': '#2a2a2a'
    }
    for (const [token, expected] of Object.entries(expectedDarkTokens)) {
      expect(readToken(darkBlock, token), `--${token} en .dark`).toBe(expected)
    }
  })

  it('criterio 2 — la barra lateral sigue con sus tokens oscuros de siempre', () => {
    // The dark sidebar tokens (used in light mode too, per the "Why" comment
    // above them in main.css) are untouched by this spec — only the content
    // canvas moved. The visual "sigue leyéndose como una pieza aparte" half of
    // criterio 2 is evidenced by the functional-check screenshots (criterio 8).
    expect(readToken(lightBlock, 'worktree-sidebar')).toBe('#141413')
    expect(readToken(lightBlock, 'sidebar')).toBe('#141413')
  })
})
