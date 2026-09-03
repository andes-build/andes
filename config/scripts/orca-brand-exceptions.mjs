// Fuente única de las excepciones técnicas de la spec 006 (restos de la marca Orca), actualizada
// por la spec 007 (el comando se llama andes) al cerrar las dos entradas que dependían del
// binario sin renombrar.
// Cada entrada documenta un lugar donde "Orca" sigue apareciendo a propósito porque nombra
// algo real que el sistema usa, no la marca visible del producto. `evals/run.sh` (spec006#1,
// spec006#6) importa este archivo en vez de tener la lista escrita dos veces.
//
// `localeValuePatterns` son los patrones que aplican dentro de los catálogos de idiomas
// (src/renderer/src/i18n/locales/*.json): un valor que solo contiene texto exceptuado no
// cuenta para el conteo de "Orca" del criterio 1. Las demás entradas (`otherExceptions`)
// documentan el resto de la lista de "no se toca" del criterio 6 que vive fuera de los
// catálogos, para que el archivo sea la única lista y no una lista más entre varias.

export const localeValuePatterns = [
  {
    // `orca.yaml`: formato de configuración de proyecto, no es marca (ver Estado previo de la
    // spec 006). Ya no matchea \bOrca\b por ser minúscula, pero se declara para dejar la lista
    // completa en un solo lugar.
    pattern: /`?orca\.yaml`?/gi,
    reason: 'orca.yaml es el formato de configuración de proyecto, no es marca'
  }
]

export const otherExceptions = [
  {
    location: 'src/renderer/src/components/**/*.test.ts(x)? (fixtures de fuente monoespaciada)',
    reason: '"Orca Nerd Font Symbols" es el nombre de una fuente empaquetada, no se renombra'
  },
  {
    location: 'src/shared/plugins/plugin-marketplace.ts, src/main/plugins/plugin-install-trust.ts',
    reason:
      'marketplace de plugins de terceros: sigue siendo el de Orca (stablyai), decidido en Gate 1 de la spec 006 — fuera de alcance'
  },
  {
    location: 'src/main/runtime/orca-runtime-tests/',
    reason: 'carpeta de tests, no es interfaz visible'
  },
  {
    location: 'vendor/ai-first-os-core/',
    reason: 'código de terceros vendorizado, versionado tal cual llega'
  }
]

/**
 * Quita del texto las porciones que matchean una excepción técnica, para que el chequeo del
 * criterio 1 cuente solo las apariciones reales de la marca.
 */
export function stripLocaleExceptions(value) {
  let stripped = value
  for (const { pattern } of localeValuePatterns) {
    stripped = stripped.replace(pattern, '')
  }
  return stripped
}
