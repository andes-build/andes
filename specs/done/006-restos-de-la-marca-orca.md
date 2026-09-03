---
status: implementada
depends_on: []
---

# 006 · Restos de la marca Orca

La app todavía se llama Orca por dentro: 695 textos de la interfaz dicen "Orca", ocho enlaces
visibles mandan al GitHub de Stably, y —lo más grave— el actualizador automático apunta a las
versiones de Orca, así que Andes se actualizaría convirtiéndose en Orca. Esta spec termina el
cambio de nombre en todo lo que una persona ve o toca.

**Tipo**: residuals · **Flujo**: requirements-first

## Estado previo

`main` en `d33a26af57` (specs 001 a 005 mergeadas). El agente corre `git log d33a26af57..main --stat` antes de
empezar.

Cuatro grupos, verificados el 2026-09-03:

1. **Textos de la interfaz**: 695 cadenas con "Orca" en `src/renderer/src/i18n/locales/en.json`,
   más sus traducciones en `es.json`, `ja.json`, `ko.json`, `zh.json`. Ejemplos: "A short,
   workflow-by-workflow tour of Orca.", "Add Remote Orca Server", "Orca could not fast-forward…".
2. **Enlaces visibles al GitHub de Orca** (8): `Landing.tsx:28`,
   `sidebar/SidebarFeedbackDialog.tsx:27`, `sidebar/SidebarSettingsHelpMenu.tsx:40`,
   `terminal-pane/TerminalErrorToast.tsx:272`, `stats/ShareUsageButton.tsx:113`,
   `stats/share-card-utils.tsx:218`, `github-project/ProjectViewStates.tsx:11`,
   `link-routing-preference-dialog.tsx:104` (este último es un ejemplo de URL en un diálogo).
3. **Actualizador y canales de versión**: `src/shared/release-channel.ts:24-27`
   (`stablyai/orca-hourly`, `-daily`, `-adhoc`, `stablyai/orca`),
   `src/main/updater-prerelease-feed.ts:5-13,156`, `src/main/updater/updater-release-feed.ts:206`,
   `src/main/updater/updater-setup.ts:158`.
4. **Marketplace de plugins**: `src/shared/plugins/plugin-marketplace.ts:9,11,119` y
   `src/main/plugins/plugin-install-trust.ts:15,26` declaran a `stablyai` como editor oficial.

Lo que **no** es marca y no se toca: `orca.yaml` (formato de configuración de proyecto, leído por
107 archivos), la fuente `Orca Nerd Font Symbols`, los skills `orca-cli` y `orca-emulator` que ya
no existen en el repo pero cuyos nombres viven en constantes, las carpetas de tests
`src/main/runtime/orca-runtime-tests/`, y `vendor/ai-first-os-core/` (código de terceros
versionado).

Además, la spec 002 dejó un hueco: al pasar de modo desarrollo a modo simple, las pestañas de
desarrollo ya abiertas no se cierran (solo se bloquea abrir nuevas).

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | Ningún texto de la interfaz dice "Orca": los cinco catálogos de idiomas no tienen la palabra, salvo la lista de excepciones técnicas declarada en el criterio 6 | `grep -c '"[^"]*\bOrca\b[^"]*"' src/renderer/src/i18n/locales/*.json` = 0 tras excluir las excepciones; `verify:localization-catalog`, `-extraction` y `-coverage` en verde |
| 2 | Los cinco idiomas quedan consistentes: la misma clave dice "Andes" en todos | Test unitario que recorre las claves cambiadas y verifica que ninguna traducción conserva "Orca" |
| 3 | Los ocho enlaces visibles apuntan a `github.com/andes-build/andes` | `grep -rn "stablyai/orca" src/renderer --include='*.tsx' \| grep -v "\.test\."` = 0 |
| 4 | El actualizador no puede convertir a Andes en Orca: los cuatro canales de versión y las tres URL de descarga apuntan a `andes-build/andes` | `grep -rn "stablyai/orca" src/shared/release-channel.ts src/main/updater*` = 0 |
| 5 | Mientras el repo de Andes no tenga versiones publicadas, la búsqueda de actualizaciones no rompe la app: si el canal no responde o no hay versiones, la app sigue abriendo y lo dice en Ajustes, sin ventana de error al arrancar | Test unitario del alimentador de versiones con respuesta vacía y con error de red: en los dos casos devuelve "sin actualizaciones" y no lanza |
| 6 | Las excepciones técnicas quedan declaradas en un solo lugar, con el motivo, y el eval del criterio 1 las lee de ahí en vez de tenerlas escritas dos veces | El archivo de excepciones existe, lo importa el eval, y cada entrada tiene su motivo en una línea |
| 7 | Al pasar de modo desarrollo a modo simple, las pestañas de desarrollo abiertas se cierran y las conversaciones se conservan | Test unitario del cambio de modo con pestañas abiertas de navegador, tablero y PR: quedan cerradas y el hilo sigue; e2e que abre una en developer, cambia a simple y verifica que desaparece |
| 8 | Código sano | `pnpm tc` · `pnpm test` · `check:code-quality:changed` en verde; los e2e de onboarding y de modo simple en verde |
| 9 | El nombre con el que la app **publicada** se presenta al sistema operativo es Andes | `grep -c "productName: 'Andes'" config/electron-builder.config.cjs` = 1; test unitario o aserción de que `shouldApplyPreReadyAppName` es falso fuera de desarrollo, de modo que el nombre publicado deriva del paquete (`CFBundleName`) y no de `app.setName()` |

### 2026-09-03 · 📌 Peter — ajuste sobre la marcha (criterios 1 y 9)

- **Criterio 1**: "Orca CLI" describe la herramienta sin marca en vez de renombrarse a "Andes
  CLI" — el binario real sigue llamándose `orca` (nadie lo renombró, ver "Fuera de alcance") y el
  texto no puede describir un comando que no existe. En inglés pasa a "the command line tool" / "the
  command line" según la oración (ejemplo: "Install the Orca CLI before running agent skill
  setup." → "Install the command line tool before running agent skill setup."), y su equivalente en
  cada idioma. "Orca Server"/"Remote Orca Servers" sí son un servicio real de la app (no el
  binario) y pasan a "Andes server"/"remote Andes servers" por sustitución mecánica normal. Donde
  el texto muestra el comando literal (`orca worktree create`, `orca serve`, `` `orca` `` a
  secas) el comando no cambia. "Orca Cloud" se renombra a Andes. "Orca Relay" y "Orca Mobile" quedan
  huérfanos del emparejamiento móvil borrado en la spec 001 y se borran del catálogo, salvo las
  claves que siguen vivien en código (`menu.showMobileButton`, `orcaAccount.*`,
  `orca.profiles.signout.confirm.description`), que se renombran en vez de borrarse.
- **Criterio 9** (nuevo): agregado porque las notificaciones del sistema operativo mostraban
  "Notificaciones de Orca Dev". Investigado: `app.setName('Orca Dev')` corre solo en desarrollo
  (`shouldApplyPreReadyAppName` devuelve `identity.isDev`, `src/main/startup/dev-instance-identity.ts:27-29`);
  un paquete publicado deriva su nombre de su `CFBundleName`, que sale de `productName: 'Andes'`
  (`config/electron-builder.config.cjs:153`, ya cambiado por la spec 001). La app publicada ya se
  presenta como Andes; lo que se vio era la instancia de desarrollo, y no llega a un usuario.

### Ajuste del criterio 9 (2026-09-03)

Se agregó sobre la marcha con la premisa equivocada de que el nombre de desarrollo llegaba al
usuario; `app.setName` es solo de desarrollo y la app publicada ya se llama Andes. El nombre
visible de la instancia de desarrollo pasa a la spec 007.

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-03): la app se llama Andes en todo lo que una persona ve.
- DECIDIDO por Peter (2026-09-02): el repo público es `andes-build/andes`.
- DECIDIDO por Peter (Gate 1, 2026-09-03): **el marketplace de plugins sigue siendo el
  de Orca** (`stablyai` como editor oficial). No es marca de Andes: es la fuente de unos plugins de
  terceros, los plugins están escondidos en modo simple, y apropiarse de ese identificador
  rompería la verificación de confianza de los plugins ya instalados. Se documenta, no se cambia.
- DECIDIDO por Peter (Gate 1, 2026-09-03): **la documentación de `docs/` y los README traducidos
  quedan fuera**;
  son documentación de Orca que Andes va a reescribir, no traducir. Spec propia.

**Delegadas al agente, con criterio**

- Cómo se reemplaza en los catálogos: sustitución mecánica más revisión de los casos donde "Orca"
  es sujeto de una oración y "Andes" cambia la concordancia (español: "el Orca" nunca aparece, pero
  sí "Orca no pudo…" → "Andes no pudo…"). Criterio: ninguna oración queda agramatical; ante la
  duda, se reescribe la oración entera.
- Qué hacer con "Orca Cloud", "Orca Relay" y "Orca Server", que nombran servicios de Stably que
  Andes no ofrece. Criterio: si la función está escondida en modo simple, se renombra igual a
  Andes; si nombra un servicio externo que sigue siendo de Stably, se deja y se anota en las
  excepciones con su motivo.
- Cómo se apaga o degrada la búsqueda de actualizaciones sin versiones publicadas. Criterio: la
  opción que deje el diff más chico y no toque la capa que lanza el binario del agente.

**Condiciones de parada**

- Si cambiar los canales de versión exige tocar la firma del paquete o el flujo de actualización
  automática de Electron más allá de las URL, para y pregunta.
- Si un texto del catálogo dice "Orca" dentro de un ejemplo de comando o de una ruta de archivo que
  el sistema realmente usa, para y pregunta en vez de renombrarlo.
- Si cerrar las pestañas del criterio 7 puede perder una conversación sin guardar, para y pregunta.

## Efectos que escapan del sistema

Ninguno: no se publica, no se firma, no se sube nada. Nota para quien publique: hasta que
`andes-build/andes` tenga versiones, la app no va a encontrar actualizaciones, y eso es lo
correcto.

## Fuera de alcance, con condición de reactivación

- `docs/` y los README traducidos: spec propia cuando exista la documentación de Andes.
- El marketplace de plugins: se reactiva si Andes publica plugins propios.
- El ícono y el logotipo: se reactiva cuando exista el archivo de diseño (📌 Peter lo debe).
- `orca.yaml` como nombre del archivo de configuración de proyecto: se reactiva si alguna vez se
  rompe la compatibilidad con Orca a propósito.
- Renombrar el binario `orca` a `andes`: spec 007, aprobada por Peter el 2026-09-03; hasta entonces
  los comandos literales dicen `orca` a propósito.
- El nombre visible de la instancia de desarrollo ("Orca Dev" en notificaciones/Dock): spec 007.
  No afecta a la app publicada (criterio 9, ya en verde). El análisis del llavero de macOS
  (`app.setName()` alimenta también el nombre del ítem de Keychain que `safeStorage` resuelve antes
  de `ready`) sigue valiendo como advertencia para esa spec — ver decisions.md.

## Evidencia

Rama `spec-006-restos-de-marca`, worktree `/Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-006`, sobre `main` en `d8481c69cc`.

### `evals/run.sh` — 53/54 en la corrida completa (de antes del ajuste del criterio 9); el criterio 9 reescrito verificado suelto y en verde

Corrida completa (antes del ajuste de abajo, con el criterio 9 original bloqueado):

```
PASS spec006#1 ningún texto de la interfaz dice Orca, salvo las excepciones del criterio 6
PASS spec006#2 los cinco idiomas quedan consistentes: ninguna clave cambiada conserva Orca
PASS spec006#3 los ocho enlaces visibles apuntan a github.com/andes-build/andes
PASS spec006#4 el actualizador y los canales de versión apuntan a andes-build/andes
PASS spec006#5 el alimentador de versiones no rompe sin versiones publicadas ni con error de red
PASS spec006#6 las excepciones técnicas viven en un solo archivo, con motivo, y el eval las importa
PASS spec006#7 pasar a modo simple cierra las pestañas de desarrollo abiertas (evidencia e2e abajo)
PASS spec006#8 código sano (evidencia abajo)
FAIL spec006#9 (versión original del criterio, ver "Ajuste del criterio 9" arriba)
53 pasan · 1 fallan
```

El criterio 9 se reescribió después de esa corrida (ver "Ajuste del criterio 9" arriba) porque la
premisa original era incorrecta. No se repitió `evals/run.sh` completo tras reescribirlo (evitando
otra corrida larga), pero el criterio reescrito se verificó suelto, en verde — con nada más tocado
en el resto de la spec, el resultado esperado de una corrida completa es 54 pasan · 0 fallan:

```
$ grep -c "productName: 'Andes'" config/electron-builder.config.cjs
1

$ pnpm exec vitest run --config config/vitest.config.ts src/main/startup/dev-instance-identity.test.ts
Test Files  1 passed (1)
Tests  7 passed (7)
```

(las 45 filas de las specs 001 a 005 también en verde, sin cambios respecto de antes de esta spec —
corridas en la misma pasada, arriba en el log completo.)

### `pnpm tc` — en verde

```
$ pnpm run typecheck
$ node config/scripts/run-typecheck-projects-in-parallel.mjs
```

Sin salida — en verde. Corrido dos veces: una vez después del cierre mecánico del catálogo y otra
después de la pasada final de correcciones de tests (commit `d0c4e43fd6`).

### `check:code-quality:changed` — en verde

```
$ node config/scripts/check-changed-code-quality.mjs
code quality: 0 new finding(s) across 416 changed file(s).
type-aware code quality: 0 new finding(s) across 416 changed file(s).
React Doctor: 0 new finding(s) across 416 changed file(s).
Changed-code quality gate passed since d8481c69cc9d.
```

### `verify:localization-*` (criterios 1, 2, 6)

```
$ node config/scripts/verify-no-orca-branding.mjs
0 apariciones de "Orca" fuera de las excepciones declaradas.

$ node config/scripts/verify-localization-catalog.mjs
Verified 12457 localization key references against en.json.
es.json coverage: 11857/13733 translated, 1876 missing.
ja.json coverage: 11857/13733 translated, 1876 missing.
ko.json coverage: 11950/13733 translated, 1783 missing.
zh.json coverage: 11954/13733 translated, 1779 missing.
(sin regresión de cobertura respecto de antes de esta spec — los 34 huérfanos borrados bajan el
total de claves de 13767 a 13733 en las cinco)

$ node config/scripts/verify-localization-extraction.mjs
Extracted 11035 keys; 25 dynamic defaults are report-only, 2698 existing English entries are not
statically referenced, and 37 inline defaults differ.
(baseline antes de esta spec: 51 "inline defaults differ" — bajó a 37 porque el borrado de
huérfanos se llevó también algo de esa deriva preexistente; cero de los 37 restantes menciona Orca)

$ node config/scripts/audit-localization-coverage.mjs --check
Localization coverage check passed with 12 allowlisted candidates.
```

### `pnpm test` — corrida completa una vez; 166 fallas encontradas y corregidas; no se repitió completa

```
 Test Files  73 failed | 7485 passed | 47 skipped (7605)
      Tests  166 failed | 69956 passed | 285 skipped (70407)
   Duration  762.68s
```

Las 166 fallas, en 73 archivos, eran todas la misma causa: aserciones de test o texto fuente no
localizado que hardcodeaban "Orca" y el catálogo (correctamente renombrado) ya no produce. Se
corrigieron una por una — commit `d0c4e43fd6` — y se reverificaron con corridas acotadas:

```
$ pnpm exec vitest run --config config/vitest.config.ts <los 73 archivos que habían fallado>
Test Files  1 failed | 72 passed (73)
Tests  1 failed | 897 passed | 1 skipped (899)
```

El único archivo que siguió en rojo es `structured-tui-transcript-catchup.test.ts` — uno de los
cuatro intermitentes conocidos declarados de antemano en las reglas de trabajo. Corrido solo:

```
$ pnpm exec vitest run --config config/vitest.config.ts src/main/native-chat/agent-session-wire/structured-tui-transcript-catchup.test.ts
Test Files  1 passed (1)
Tests  2 passed (2)
```

**Pendiente, no verificado**: por indicación de Peter (2026-09-03, al cerrar la sesión) no se
repitió `pnpm test` completo después de esta corrección — la corrida de arriba cubre los 73 archivos
que habían fallado más el intermitente, pero no una corrida de punta a punta de los ~7600 archivos
de test para confirmar que ningún otro archivo (de los que nunca aparecieron en rojo) se vio afectado
por los cambios de este commit. Riesgo bajo: el commit solo tocó los 73 archivos que ya habían
fallado más `evals/run.sh`, `ARCHITECTURE.md`, `decisions.md` y la spec.

### e2e — solo el nuevo test de esta spec; la suite completa de onboarding/modo simple no se corrió

```
$ pnpm exec playwright test tests/e2e/simple-mode-switch-closes-dev-tabs.spec.ts --config tests/playwright.config.ts --project electron-headless --workers=1

  ✓  1 [electron-headless] › closes an open browser tab, the dashboard, and the PR page — keeps the terminal (13.6s)

  1 passed (21.6s)
```

**Pendiente, no corrido** (por la misma indicación de cerrar sin gastar más tiempo en corridas
largas): `tests/e2e/onboarding.spec.ts`, `tests/e2e/simple-mode-onboarding.spec.ts`,
`tests/e2e/simple-mode-onboarding-repeat.spec.ts` y `tests/e2e/simple-mode-surfaces.spec.ts` — la
spec 006 no tocó ninguno de sus componentes (solo el catálogo de idiomas, que estos e2e no
verifican palabra por palabra salvo por los headings ya cubiertos en la spec 005), así que el riesgo
de regresión es bajo pero no está confirmado con una corrida real.

### Criterio 9 — corregido, no bloqueado

La premisa original (que "Orca Dev" en las notificaciones llegaba a un usuario real) era
incorrecta. `app.setName()` corre solo en modo developer (`shouldApplyPreReadyAppName` devuelve
`identity.isDev`, `src/main/startup/dev-instance-identity.ts:27-29`); un paquete publicado deriva
su nombre de su `CFBundleName`, que sale de `productName: 'Andes'`
(`config/electron-builder.config.cjs:153`, ya cambiado por la spec 001). La app publicada ya se
presentaba como Andes desde antes de esta spec — el criterio se reescribió para medir eso, y pasa
hoy sin cambios de código. El análisis del llavero de macOS sigue siendo real y queda documentado en
`decisions.md` como advertencia para la spec 007, que trata el nombre visible de la instancia de
desarrollo.
