import {
  isCanonicalGenericRendering,
  overlapsCanonicalRendering
} from './locale-generic-ui-terms.mjs'
import { isScreenCursorContext } from './locale-screen-cursor-exemptions.mjs'
import { BRAND_MISTRANSLATIONS } from './locale-brand-mistranslations.mjs'
import { isStyleValue } from './locale-style-values.mjs'
import { SEARCH_KEYWORD_OVERRIDES } from './locale-search-keyword-overrides.mjs'

export { BRAND_MISTRANSLATIONS } from './locale-brand-mistranslations.mjs'
export { SEARCH_KEYWORD_OVERRIDES } from './locale-search-keyword-overrides.mjs'

const AGENT_CATALOG_PREFIX = 'auto.lib.agent.catalog.'
const OPEN_IN_APP_CATALOG_PREFIX = 'auto.lib.open.in.app.catalog.'

// Why: product names and agent labels stay Latin — MT reads them as common words (Codex→copy, Gemini→zodiac).
export const ENGLISH_ONLY_KEY_PREFIXES = [AGENT_CATALOG_PREFIX, OPEN_IN_APP_CATALOG_PREFIX]

// Only genuine brand, product, and code tokens belong here. Ordinary UI words that happen to
// name a product (agent, terminal, commit, repo, Continue) live in locale-generic-ui-terms.mjs
// and are translated; their product sense is pinned by ENGLISH_ONLY_KEY_PREFIXES instead.
export const NEVER_TRANSLATE_VALUES = new Set([
  'Aider',
  'Amp',
  'Android',
  'Antigravity',
  'Auggie',
  'Autohand Code',
  'Charm',
  'Claude',
  'Claude Agent Teams',
  'Cline',
  'Codebuff',
  'Codex',
  'Command Code',
  'Cursor',
  'Droid',
  'Devin',
  'Gemini',
  'Git',
  'Git Bash',
  'GitHub Copilot',
  'GitLab',
  'Goose',
  'Grok',
  'Hermes',
  'Jira',
  'Kilocode',
  'Kimi',
  'Kiro',
  'Linear',
  'Mistral Vibe',
  'OMP',
  'OpenClaude',
  'OpenClaw',
  'OpenCode',
  'OpenCode Go',
  'Orca',
  'Pi',
  'PostHog',
  'Qwen Code',
  'Rovo Dev',
  'Markdown',
  'VS Code',
  'Warp',
  'Zed',
  'android',
  'codex',
  'gemini',
  'claude',
  'markdown',
  'gh',
  'idle',
  'anthropic',
  'Discord',
  'WSL',
  'wsl',
  'darwin',
  'Nautilus',
  'GitHub',
  'no_proxy',
  'Beta',
  // Round 6: product/tool names, language names, and code tokens that machine
  // translation wrongly localized (e.g. tailscale→尾鱗, Swift→迅速, yarn→糸).
  'Tailscale',
  'tailscale',
  'Ghostty',
  'ghostty',
  'pwsh',
  'yarn',
  'Kagi',
  'kagi',
  'kimi',
  'Bitbucket',
  'bitbucket',
  'GNOME',
  'gnome',
  'iCloud',
  'icloud',
  'ripgrep',
  'PowerShell',
  'powershell',
  'TypeScript',
  'typescript',
  'Mermaid',
  'mermaid',
  'Swift',
  'swift',
  'Rust',
  'rust',
  'Java',
  'java',
  'Go',
  'Python',
  'python',
  'Kotlin',
  'kotlin',
  'Ruby',
  'ruby',
  'Bash',
  'bash',
  'GraphQL',
  'graphql',
  'iOS',
  'iPhone',
  'iPad',
  'ide',
  'IDE',
  'ui',
  'UI',
  'calt',
  'ai',
  'AI',
  'ci',
  'CI',
  'REST',
  'rest',
  'YAML',
  'yaml',
  'yml',
  'XML',
  'SQL',
  'CSS',
  'Token',
  'token',
  'HTTP/1.1',
  'HTTP/2',
  'true',
  'false',
  '/home/user',
  '/home/user/project',
  '/path/to/destination',
  '.orca/issue-command',
  'PLAN.md',
  'feat/mobile-page',
  'sk-...',
  'main',
  'master',
  'HEAD',
  'lint',
  'MD',
  '/home/user/projects',
  'Claude Code',
  // Commands, refs, class strings and code samples: a translated one no longer runs or matches.
  'pnpm install',
  'glab auth login',
  "gh pr list --json number -q '.[0].number'",
  '--model sonnet',
  'localhost, 127.0.0.1, *.internal',
  'packages/web shared/ui',
  'stale-agent-row-{{value0}}',
  'text-foreground',
  'source-control',
  'combined-branch',
  'pr-view',
  'fix-login-flow',
  'my-project',
  'serve-sim',
  'pnpm playwright test',
  'gh auth login',
  'size-4 text-muted-foreground',
  'text-amber-700 dark:text-amber-300',
  'text-emerald-700 dark:text-emerald-300',
  'src/renderer packages/ui',
  'upstream/main',
  'origin/main',
  'example.com',
  'bastion.example.com',
  'dashboard.spec.ts',
  'checkout.spec.ts',
  'login.spec.ts',
  'untitled.md',
  'review src/auth',
  'throw src/auth',
  // Rendered inside <code> or a font-mono element, so they are code the user copies or types.
  '{prompt}',
  '{basePrompt}',
  '{firstPrompt}',
  '{assistantMessage}',
  '/goal',
  '/pricing',
  '/signup',
  'npm run dev',
  'nbformat',
  'orca.yaml',
  'upstream',
  'LIN-329',
  'GH #1799',
  'orca · zsh'
])

export function isEnglishOnlyKey(key) {
  return ENGLISH_ONLY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
}

export function shouldPreserveEnglishValue(enValue, key = '') {
  if (!enValue?.trim()) {
    return true
  }
  if (/^https?:\/\//.test(enValue) || enValue.startsWith('orca://')) {
    return true
  }
  if (isEnglishOnlyKey(key)) {
    return true
  }
  if (isStyleValue(enValue)) {
    return true
  }
  return NEVER_TRANSLATE_VALUES.has(enValue)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function includesPreservedLatinTerm(value, term) {
  if (!/^[A-Za-z_]+$/.test(term)) {
    return value.includes(term)
  }
  return new RegExp(`(^|[^A-Za-z_])${escapeRegExp(term)}($|[^A-Za-z_])`).test(value)
}

function replaceMistranslatedForm(value, wrong, brand, locale) {
  let result = ''
  let cursor = 0
  for (let at = value.indexOf(wrong); at !== -1; at = value.indexOf(wrong, cursor)) {
    const end = at + wrong.length
    result += value.slice(cursor, at)
    result += overlapsCanonicalRendering(brand, locale, value, at, end) ? wrong : brand
    cursor = end
  }
  return result + value.slice(cursor)
}

function applyBrandMistranslationFixes(enValue, localeValue, locale, key = '') {
  let result = localeValue
  const mistranslations = BRAND_MISTRANSLATIONS[locale] ?? {}

  for (const [brand, wrongForms] of Object.entries(mistranslations).sort(
    ([left], [right]) => right.length - left.length
  )) {
    if (!includesPreservedLatinTerm(enValue, brand)) {
      continue
    }
    // Why: terminal/theme "Cursor" labels name the on-screen カーソル, not the Cursor product —
    // skip the revert so カーソル survives for these settings.
    if (isScreenCursorContext(brand, enValue, key)) {
      continue
    }
    if (includesPreservedLatinTerm(result, brand)) {
      continue
    }
    for (const wrong of wrongForms) {
      if (!result.includes(wrong)) {
        continue
      }
      // Why: #12113 — a generic term's correct translation is not a mistranslation; reverting it
      // rewrote ~2000 translated values back to English on every repair run.
      if (isCanonicalGenericRendering(brand, locale, wrong)) {
        continue
      }
      // Why: "Copy identifier" legitimately uses 사본/复制 — only swap when English names the brand.
      if (brand === 'Codex' && /\bCopy\b/i.test(enValue)) {
        continue
      }
      result = replaceMistranslatedForm(result, wrong, brand, locale)
    }
  }

  return result
}

// Why: kept generic (not indexed by a fixed locale list) so a future
// translation pass can repair whatever locale it targets, plugin catalogs
// included — see specs/done/008-un-solo-idioma.md.
export function repairTranslatedValue({ key, enValue, localeValue, locale }) {
  if (shouldPreserveEnglishValue(enValue, key)) {
    return enValue
  }

  let result = localeValue

  if (key.includes('.search.')) {
    const searchOverride = SEARCH_KEYWORD_OVERRIDES[locale]?.[enValue]
    if (searchOverride) {
      result = searchOverride
    }
  }

  result = applyBrandMistranslationFixes(enValue, result, locale, key)

  return result
}

export function collectStringLeaves(value, prefix = '', leaves = []) {
  if (typeof value === 'string') {
    leaves.push({ key: prefix, value })
    return leaves
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return leaves
  }
  for (const [key, child] of Object.entries(value)) {
    collectStringLeaves(child, prefix ? `${prefix}.${key}` : key, leaves)
  }
  return leaves
}

export function setLeaf(catalog, key, translatedValue) {
  const parts = key.split('.')
  let cursor = catalog
  for (let index = 0; index < parts.length - 1; index += 1) {
    cursor = cursor[parts[index]]
  }
  cursor[parts.at(-1)] = translatedValue
}

export function repairCatalog(enCatalog, localeCatalog, locale) {
  const leaves = collectStringLeaves(enCatalog)
  let repaired = 0

  for (const leaf of leaves) {
    const current = leaf.key.split('.').reduce((cursor, part) => cursor?.[part], localeCatalog)
    // Why: en.json carries keys the locale catalog has not been bootstrapped with yet; repair only
    // rewrites values that already exist, so skip instead of crashing on undefined.
    if (typeof current !== 'string') {
      continue
    }
    const next = repairTranslatedValue({
      key: leaf.key,
      enValue: leaf.value,
      localeValue: current,
      locale
    })
    if (next !== current) {
      setLeaf(localeCatalog, leaf.key, next)
      repaired += 1
    }
  }

  return repaired
}

export function repairCacheMap(cache, locale) {
  let repaired = 0
  for (const [enValue, translated] of cache.entries()) {
    const next = shouldPreserveEnglishValue(enValue)
      ? enValue
      : repairTranslatedValue({
          key: '',
          enValue,
          localeValue: translated,
          locale
        })
    if (next !== translated) {
      cache.set(enValue, next)
      repaired += 1
    }
  }
  return repaired
}
