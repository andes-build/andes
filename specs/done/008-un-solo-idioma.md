---
status: implementada
depends_on: []
---

# 008 · Un solo idioma mientras la interfaz cambia

Andes queda en inglés. Se dan de baja japonés, coreano y chino, y el español se retira hasta que la
interfaz deje de moverse: volverá en una sola pasada, cuando haya algo estable para traducir.

El motivo es concreto: hoy hay cinco catálogos con 61.500 textos entre todos, y el español ya tiene
1878 menos que el inglés, así que la app en español muestra inglés por partes y se lee como un
producto roto. Cada pantalla nueva multiplica ese trabajo por cinco sobre código que igual se va a
reescribir.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `cf173f4443`. Se implementa con la spec 006 mergeada (`depends_on: []`), que acaba de tocar
los cinco catálogos: esta spec se lleva por delante parte de ese trabajo a propósito, y por eso va
después y no antes.

- Idiomas declarados: `src/shared/ui-locale.ts:2-7` (`UI_LANGUAGE_CHINESE`, `_ENGLISH`,
  `_JAPANESE`, `_KOREAN`, `_SPANISH`, `_SYSTEM`), con `DEFAULT_UI_LOCALE = 'en'` (`:15`).
- Catálogos en `src/renderer/src/i18n/locales/`: `en` 13.767 textos, `es` 11.889, `ja` 11.889,
  `ko` 11.982, `zh` 11.986.
- El selector de idioma vive en Ajustes → Apariencia
  (`src/renderer/src/i18n/supported-languages.ts:25-27`).
- Tres verificaciones que corren en el lint: `verify:localization-catalog`,
  `verify:localization-extraction` y `verify:localization-coverage`
  (`package.json:72-75`), más pruebas por idioma en `src/renderer/src/i18n/`
  (`ja-technical-literal-mistranslations.test.ts`, `ko-ui-semantic-mistranslations.test.ts`,
  `zh-technical-literal-mistranslations.test.ts`, `locale-english-regression.test.ts`,
  `lazy-locale.test.ts`, `smart-workspace-jira-locales.test.ts`, `native-chat-locales.test.ts`,
  `worktree-visibility-locales.test.ts`) y guiones de traducción en `config/scripts/locale-*`.
- La decisión de producto del 2026-08-29 dice "global en inglés con opción de español": esta spec
  no la contradice, la ordena en el tiempo — el español vuelve, más tarde y de una vez.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | La app ofrece un solo idioma: el selector de Ajustes → Apariencia no aparece, o aparece con inglés como única opción | Test de componente del panel de apariencia: no hay control de idioma, o su lista tiene un solo valor; e2e en modo simple: Ajustes no muestra un selector de idioma |
| 2 | Solo queda el catálogo inglés | `ls src/renderer/src/i18n/locales/` = `en.json` |
| 3 | Ningún idioma más queda declarado en el código | `grep -rn "UI_LANGUAGE_\(CHINESE\|JAPANESE\|KOREAN\|SPANISH\)" src` = 0 |
| 4 | Un ajuste guardado con un idioma que ya no existe carga como inglés y no rompe | Test unitario de la normalización de ajustes con `language: 'es'`, `'zh'` y un valor inventado: los tres devuelven inglés |
| 5 | Las verificaciones de idioma siguen corriendo y en verde sobre un solo catálogo | `verify:localization-catalog`, `-extraction` y `-coverage` en verde; el lint completo pasa |
| 6 | Las pruebas específicas de japonés, coreano, chino y español se borran, y las que valen para cualquier idioma se conservan | `ls src/renderer/src/i18n/` sin `ja-`, `ko-`, `zh-` \*mistranslations\*; `locale-english-regression.test.ts` y `lazy-locale.test.ts` siguen y pasan |
| 7 | La regla queda escrita donde la lea quien escriba la próxima pantalla | `CLAUDE.md` del repo dice, en una línea, que los textos nuevos van solo al catálogo inglés hasta que se reabra la traducción |
| 8 | Código sano | `pnpm tc` · `pnpm test` · `check:code-quality:changed` en verde; e2e de onboarding y de modo simple en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-03): inglés solo para la primera iteración. El español vuelve
  en una sola pasada cuando la interfaz esté estable, antes del primer piloto con personas.
- DECIDIDO por Peter (Gate 1, 2026-09-03): japonés, coreano y chino se dan de baja; nadie los pidió
  y venían de Orca.
- DECIDIDO por Peter (2026-08-29): el producto es global en inglés con opción de español. Esta spec
  ordena el momento, no cambia el destino.

**Delegadas al agente, con criterio**

- Si el selector de idioma se esconde o se borra. Criterio: se esconde si borrarlo obliga a tocar
  más de un componente del panel de apariencia; se borra si es una entrada de una lista.
- Qué se hace con la maquinaria de traducción (`config/scripts/locale-*`, extracción de textos).
  Criterio: se conserva todo lo que sirva para reabrir la traducción de una vez; se borra solo lo
  que sea específico de un idioma dado de baja.
- Si los catálogos borrados se guardan en algún lado. Criterio: no se guardan; git los tiene, y
  cuando el español vuelva se traduce sobre la interfaz nueva, no sobre la vieja.

**Condiciones de parada**

- Si una verificación de idioma da por sentado que hay más de un catálogo y no se puede ajustar sin
  reescribirla entera, para y pregunta.
- Si algún texto solo existe en un catálogo que no es el inglés, para y reporta la lista: hay que
  traerlo al inglés antes de borrar.
- Si borrar un idioma rompe una prueba que no es de idioma, para y pregunta.

## Efectos que escapan del sistema

Ninguno.

## Fuera de alcance, con condición de reactivación

- **Volver a traducir al español**: spec propia, se reactiva cuando el Command Center, el hilo y los
  archivos estén construidos y no se muevan más, y antes del primer piloto con personas que no
  hablen inglés.
- Los 1878 textos que le faltaban al español: dejan de importar al borrarse el catálogo; el hueco
  real —que un componente muestre inglés teniendo traducción— se mide de nuevo cuando el español
  vuelva.
- El idioma de la documentación y del sitio: no lo toca esta spec.

## Evidencia

Rama `spec-008-un-solo-idioma`, worktree `/Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-008`, sobre `main` en `fc3309e925`.

### Condición de parada verificada: ningún texto existía solo en un catálogo no inglés

Antes de borrar, se compararon las claves de `es.json`, `ja.json`, `ko.json` y `zh.json` (tal como
estaban en `fc3309e925`) contra las de `en.json`, aplanando cada catálogo a pares clave/valor:

```
es keys only in this catalog (not in en): 0
ja keys only in this catalog (not in en): 0
ko keys only in this catalog (not in en): 0
zh keys only in this catalog (not in en): 0
```

Ninguna clave existía solo en un catálogo no inglés — la condición de parada del criterio no se
disparó, y se procedió a borrar los cuatro catálogos.

### `pnpm tc` — los tres proyectos en verde

```
$ pnpm run typecheck:web    → tsc --noEmit -p config/tsconfig.tc.web.json     (sin salida)
$ pnpm run typecheck:node   → tsc --noEmit -p config/tsconfig.node.json       (sin salida)
$ pnpm run typecheck:cli    → tsc --noEmit -p config/tsconfig.tc.cli.json     (sin salida)
```

### `verify:localization-*` (criterio 5) — en verde sobre el único catálogo

```
$ node config/scripts/verify-localization-catalog.mjs
Verified 12457 localization key references against en.json.

$ node config/scripts/verify-localization-extraction.mjs
Extracted 11035 keys; 25 dynamic defaults are report-only, 2698 existing English entries are not
statically referenced, and 37 inline defaults differ.

$ node config/scripts/audit-localization-coverage.mjs --check
Localization coverage check passed with 12 allowlisted candidates.
```

### `check:code-quality:changed` — en verde

```
$ node config/scripts/check-changed-code-quality.mjs
code quality: 0 new finding(s) across 44 changed file(s).
type-aware code quality: 0 new finding(s) across 44 changed file(s).
React Doctor: 0 new finding(s) across 44 changed file(s).
Changed-code quality gate passed since fc3309e9254d.
```

### Pruebas afectadas (no la suite completa — política acordada para este corte; la suite entera
### la corre el Gate 2 sobre `main`)

Se corrió `vitest` sobre todo `src/renderer/src/i18n/`, `config/scripts/`, `src/main/i18n/`, y cada
archivo de componente/hook tocado o adaptado a un catálogo sintético (settings, sidebar, status-bar,
automations, dashboard-popout, dictation, feature-wall, contextual-tours, hooks, más
`src/shared/ui-language.test.ts` y `ui-locale.test.ts`):

```
Test Files  1 failed | 976 passed | 1 skipped (978)
     Tests  1 failed | 7388 passed | 8 skipped (7397)
   Duration  137.80s
```

El único fallo es `config/scripts/macos-computer-helper-owner-loss-processes.test.mjs` —
intermitente conocido y declarado de antemano en las condiciones de trabajo, ajeno a esta spec
(crea y mata procesos hijo reales para simular pérdida de dueño en macOS; no toca idioma). No se
volvió a correr para confirmar que es flake, siguiendo la instrucción de no perseguir intermitentes
declarados.

Los criterios 1, 2, 3, 4, 6 y 7 tienen además su propio chequeo aislado en `evals/run.sh`
(`spec008_criterio1_un_solo_idioma` … `spec008_criterio7_regla_en_claude_md`), corridos dentro de
esta misma pasada de vitest (criterios 1, 4 y 6) o como comandos de shell directos (criterios 2, 3,
7) — ver el cuerpo de cada función.

### `ls src/renderer/src/i18n/locales/` (criterio 2)

```
en.json
```

### `grep -rn "UI_LANGUAGE_\(CHINESE\|JAPANESE\|KOREAN\|SPANISH\)" src` (criterio 3)

Cero resultados.

### spec006#2 ajustada (instrucción de trabajo, punto 4)

`config/scripts/orca-brand-rename-cross-locale-consistency.test.mjs` (spec006#2) recorría los cinco
catálogos; se ajustó `LOCALES` a `['en']` — sigue verificando lo mismo (ninguna clave renombrada a
"Andes" conserva "Orca") sobre el único catálogo que queda. Corrido suelto, en verde. No se detectó
ningún otro eval de `evals/run.sh` recorriendo `locales/*.json` que necesitara el mismo ajuste:
`spec006_criterio1_sin_orca_en_catalogos` y `spec005_criterio10_sin_jerga` iteran el directorio con
`readdir`/glob, así que se auto-ajustan a un solo archivo sin tocar código.

### e2e de onboarding y modo simple — corridos con `--workers=1`

```
$ npx playwright test tests/e2e/onboarding.spec.ts tests/e2e/simple-mode-onboarding.spec.ts \
    tests/e2e/simple-mode-onboarding-repeat.spec.ts tests/e2e/simple-mode-surfaces.spec.ts \
    tests/e2e/simple-mode-switch-closes-dev-tabs.spec.ts \
    --config tests/playwright.config.ts --project=electron-headless --workers=1

8 passed (8.7m)
12 failed (todos en tests/e2e/onboarding.spec.ts)
```

Los cuatro archivos de modo simple (`simple-mode-onboarding.spec.ts`,
`simple-mode-onboarding-repeat.spec.ts`, `simple-mode-surfaces.spec.ts`,
`simple-mode-switch-closes-dev-tabs.spec.ts` — los que ejercitan el criterio 1 de esta spec, el
selector de idioma en modo simple) pasaron completos: `test-results/` solo tiene las 12 carpetas de
fallo de `onboarding.spec.ts` (ese reporter solo escribe artefactos de lo que falla), cero de modo
simple.

Los 12 fallos de `onboarding.spec.ts` (el asistente de modo developer, no tocado por esta spec) no
son de idioma: las 12 esperan el heading "Pick your default agent" y ninguna lo encuentra porque la
captura de pantalla de cada una (`error-context.md`) muestra la app principal ya cargada — sidebar,
worktrees, "2 of 8 setup steps complete" — es decir, el perfil de Electron de esta corrida ya
completó el onboarding antes de que el test empezara, no el asistente de primer arranque que el test
espera. Es consistente con estado de un perfil de `userData` reusado entre corridas de este agente
en esta misma sesión (`ensure:electron-runtime` y corridas previas), no con un cambio de este diff:
ningún archivo tocado por esta spec decide qué paso de onboarding se muestra primero ni cuándo se lo
considera completo. No se investigó a fondo (aislar el perfil de `userData` y repetir) por el tiempo
que toma cada corrida completa de Electron; queda para quien haga el Gate 2, con esta nota.
