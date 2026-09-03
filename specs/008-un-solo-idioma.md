---
status: pendiente
depends_on: [006]
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

`main` en `af17498375`. Se implementa con la spec 006 mergeada (`depends_on: [006]`), que acaba de tocar
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
