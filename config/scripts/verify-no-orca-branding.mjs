// spec006#1 / spec006#6 — ningún texto de los catálogos de idiomas dice "Orca", salvo las
// excepciones técnicas declaradas en config/scripts/orca-brand-exceptions.mjs.
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import process from 'node:process'
import { stripLocaleExceptions } from './orca-brand-exceptions.mjs'

const LOCALES_DIR = path.join('src', 'renderer', 'src', 'i18n', 'locales')
const WORD_BOUNDARY_ORCA = /\bOrca\b/g

function flattenLeaves(node, keyPath, out) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const [key, value] of Object.entries(node)) {
      flattenLeaves(value, keyPath ? `${keyPath}.${key}` : key, out)
    }
    return out
  }
  out.push([keyPath, node])
  return out
}

export async function findOrcaMatches(localesDir = LOCALES_DIR) {
  const fileNames = (await fs.readdir(localesDir)).filter((name) => name.endsWith('.json')).sort()

  const matches = []
  for (const fileName of fileNames) {
    const filePath = path.join(localesDir, fileName)
    const catalog = JSON.parse(await fs.readFile(filePath, 'utf8'))
    const leaves = flattenLeaves(catalog, '', [])
    for (const [keyPath, value] of leaves) {
      if (typeof value !== 'string') {
        continue
      }
      const cleaned = stripLocaleExceptions(value)
      if (WORD_BOUNDARY_ORCA.test(cleaned)) {
        matches.push({ file: fileName, key: keyPath, value })
      }
      WORD_BOUNDARY_ORCA.lastIndex = 0
    }
  }
  return matches
}

async function main() {
  const matches = await findOrcaMatches()
  if (matches.length === 0) {
    console.log('0 apariciones de "Orca" fuera de las excepciones declaradas.')
    return 0
  }
  console.error(`${matches.length} apariciones de "Orca" sin excepción:`)
  for (const match of matches.slice(0, 30)) {
    console.error(`  ${match.file} :: ${match.key} => ${JSON.stringify(match.value)}`)
  }
  return 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main())
}
