---
status: implementada
depends_on: []
---

# 009 · Command Center

La pantalla de inicio de Andes en modo simple: el estado del workspace elegido en cuatro tarjetas
—qué espera tu decisión, qué está en curso, qué viene, qué hay que atender— y una sola acción
sugerida arriba. Hoy ese lugar lo ocupa el estado vacío de Orca.

Es la primera pantalla propia de Andes. El diseño aprobado está en la maqueta de la iniciativa y en
la spec visual del cerebro; esta spec lo construye.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `fc3309e925`. El agente corre `git log fc3309e925..main --stat` antes de empezar.

- La vista principal hoy: `src/renderer/src/app-shell/AppWorkspaceShell.tsx:83` renderiza
  `<Landing />` cuando no hay worktree activo. `Landing` (`src/renderer/src/components/Landing.tsx`)
  es el estado vacío con el logo y "Agregar proyecto".
- La preferencia `interfaceMode` (spec 002) ya existe, con `simple` por defecto.
- El núcleo del sistema viaja en `vendor/ai-first-os-core/` (spec 005). El estado del workspace lo
  imprime `vendor/ai-first-os-core/core/lib/session-start.sh`, que se corre así:
  `session-start.sh --brain <carpeta> --workspace <slug>` o `--root`. Su salida tiene **siempre
  cuatro secciones en este orden**: espera tu decisión, en curso, en cola, chequeos; y una última
  línea con el conteo de nodos, el tiempo y la versión.
- Cómo se corre un proceso del núcleo desde el proceso principal: el mismo camino que usó la spec
  005 para el instalador (`runProcess`), no inventar otro.
- Tipos de pestaña existentes: `src/shared/tab-types.ts:30-40` (`terminal`, `editor`,
  `agent-session`, `browser`, `simulator`).
- Textos: solo el catálogo inglés (spec 008). Ningún texto nuevo en otro idioma.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | En modo simple, con una carpeta abierta y ningún hilo activo, la vista principal es el Command Center y no el estado vacío de Orca | e2e: abrir una carpeta preparada y verificar que aparece el título "Command Center" y que no aparece "Add a project" |
| 2 | El Command Center corre el arranque del núcleo sobre el workspace elegido y **muestra las cuatro secciones tal como salieron**, sin recalcular ni resumir | Test unitario del analizador con tres salidas de ejemplo (una completa, una vacía, una con "y N más"): devuelve las cuatro secciones con sus filas; e2e con un vault de prueba: las cuatro tarjetas tienen el contenido de la salida real |
| 3 | La tarjeta **Waiting for your decision** es la primaria: va primera, ocupa más ancho o más alto que las otras tres, y cada fila tiene el nombre, qué espera y un botón de resolver | Test de componente: la tarjeta primaria se renderiza antes que las otras y con la clase de tamaño mayor; cada fila tiene su botón |
| 4 | Las otras tres tarjetas son **In progress**, **Queued** y **Checks**, con el contenido de su sección | Test de componente por tarjeta con la salida de ejemplo |
| 5 | Arriba, una sola línea de acción sugerida con un botón; si el arranque no sugiere nada, dice que no hay nada urgente | Test de componente con y sin sugerencia |
| 6 | Cada botón de las tarjetas abre una sesión de agente con un primer mensaje ya escrito que nombra eso: la iniciativa que espera, el hallazgo del chequeo. **No abre una terminal en blanco** | Test unitario del armado del primer mensaje para los tres casos; e2e: apretar resolver abre una pestaña de sesión de agente cuyo primer mensaje contiene el nombre de la iniciativa |
| 7 | Estados incómodos: carpeta sin preparar, arranque que falla y arranque vacío tienen cada uno su mensaje, y ninguno deja la pantalla en blanco ni muestra la salida cruda del error | Test de componente de los tres estados; e2e con una carpeta vacía: aparece el mensaje de carpeta sin preparar y un botón para prepararla |
| 8 | El arranque no bloquea la ventana: mientras corre, la pantalla muestra su estado de carga, y si tarda más de diez segundos lo dice y ofrece reintentar | Test unitario del temporizador; e2e con un guion simulado lento |
| 9 | En modo desarrollo no cambia nada: sigue apareciendo el estado vacío de Orca | e2e en modo desarrollo: aparece "Add a project" y no el Command Center |
| 10 | Ningún texto de esta pantalla usa jerga del sistema: no dice nodo, frontmatter, glob, resolver, ni nombres de archivo | Eval de texto sobre las claves nuevas del catálogo inglés: ninguna contiene esas palabras |
| 11 | Código sano | `pnpm tc` · `check:code-quality:changed` · `verify:localization-*` en verde; los tests unitarios y e2e nuevos en verde; los archivos de test afectados en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-03): el diseño es el de la maqueta aprobada; la estructura y
  los textos salen de la spec visual del cerebro, `products/personal-os/context/2026-09-02-visual-spec.md`,
  sección "Command Center".
- DECIDIDO por Peter (2026-09-03): un solo idioma, inglés.
- DECIDIDO por Peter (2026-08-29): la salida del arranque se muestra como salió, con cuatro
  secciones, y no se recalcula ni se resume.

**Delegadas al agente, con criterio**

- Cómo se analiza la salida del arranque. Criterio: un analizador propio con tests sobre salidas de
  ejemplo guardadas como archivos de prueba; nunca leer el script del núcleo ni reimplementarlo.
- Dónde vive la vista. Criterio: un componente nuevo bajo `src/renderer/src/components/command-center/`,
  elegido en `AppWorkspaceShell` por `interfaceMode`, sin tocar la ruta de modo desarrollo.
- Qué se hace con el conteo final de la salida (nodos, tiempo, versión). Criterio: al pie, en gris y
  chico, o no mostrarlo; nunca como una tarjeta.

**Condiciones de parada**

- Si correr el script del núcleo exige `python3` o `git` y la máquina no los tiene, para y reporta:
  eso es una dependencia del onboarding, no de esta pantalla.
- Si la salida del arranque no tiene las cuatro secciones esperadas, para y reporta la salida real:
  no inventes secciones ni las completes.
- Si abrir una sesión de agente con un primer mensaje ya escrito exige tocar la capa que lanza el
  binario del agente, para y pregunta.

## Efectos que escapan del sistema

Ninguno. La pantalla lee; el agente solo se lanza cuando la persona aprieta un botón.

## Evidencia

11 criterios, evaluados con `evals/run.sh` (funciones `spec009_unit`,
`spec009_criterio1_6_7_9_prueba_de_interfaz`, `spec009_criterio2_alcance_del_selector`,
`spec009_criterio6_un_solo_camino_de_lanzamiento`, `spec009_criterio10_sin_jerga_del_sistema`,
`spec009_criterio11_codigo_sano`) y con el chequeo funcional en la app real.

| # | Criterio | Eval | Resultado |
|---|---|---|---|
| 1 | Vista principal = Command Center, no el vacío de Orca | e2e `tests/e2e/command-center-simple-mode.spec.ts:151` "replaces the empty state for a prepared folder with no thread yet" | PASS |
| 2 | Se muestran las cuatro secciones tal como salieron, sin recalcular | Unitario `src/shared/command-center-startup-output.test.ts` (analizador, tres salidas de ejemplo) + e2e `tests/e2e/command-center-simple-mode.spec.ts:165` "scans the scope the selector has, and rescans when it changes" | PASS — 58/58 tests unitarios de la sección (ver debajo), e2e verde |
| 3 | Waiting for your decision es la tarjeta primaria (primera, mayor, fila con botón) | Componente `src/renderer/src/components/command-center/CommandCenter.cards.test.tsx` + e2e `tests/e2e/command-center-simple-mode.spec.ts:190` "shows the four sections, with Waiting first and primary" | PASS |
| 4 | In progress, Queued y Checks con el contenido de su sección | Componente `CommandCenter.cards.test.tsx` (una tarjeta por sección, salida de ejemplo) | PASS |
| 5 | Línea de acción sugerida arriba, con y sin sugerencia | Componente `CommandCenterActionLine.test.tsx` | PASS |
| 6 | Cada botón abre un hilo con primer mensaje que nombra la iniciativa/hallazgo; nunca una terminal en blanco | Unitario `command-center-first-message.test.ts` (los tres casos) + `command-center-agent-launch.test.ts` (un solo camino de lanzamiento) + e2e `tests/e2e/command-center-simple-mode.spec.ts:224` "Resolve opens a thread whose first message names the item and the scope" | PASS |
| 7 | Estados incómodos (carpeta sin preparar, arranque que falla, arranque vacío) con su mensaje, sin pantalla en blanco ni error crudo | Componente `CommandCenter.states.test.tsx` + `command-center-scan-empty.test.ts` + e2e `tests/e2e/command-center-simple-mode.spec.ts:260` "an unprepared folder shows its own message with a way to prepare it" | PASS |
| 8 | El arranque no bloquea la ventana; carga y, a los diez segundos, ofrece reintentar | Unitario `use-command-center-startup.test.ts` (temporizador) | PASS |
| 9 | En modo desarrollo, sigue el vacío de Orca | e2e `tests/e2e/command-center-simple-mode.spec.ts:283` "shows the Orca empty state, never the Command Center" | PASS |
| 10 | Ningún texto usa jerga del sistema | `spec009_criterio10_sin_jerga_del_sistema`: 0 coincidencias de node/frontmatter/glob/resolver/session-start/.md/tree.md en `commandCenter` de `en.json` | PASS — 0 hits |
| 11 | Código sano | `pnpm tc` · `npx oxlint …` · `check:code-quality:changed` · `verify:localization-catalog` · `verify:localization-extraction` · `verify:localization-coverage` | PASS — tc exit 0; oxlint exit 0; check:code-quality:changed "0 new finding(s) across 48 changed file(s)" (React Doctor también 0); verify:localization-catalog "Verified 12530 localization key references"; verify:localization-extraction sin diffs bloqueantes (39 inline defaults son report-only); verify:localization-coverage "passed with 12 allowlisted candidates" |

**Suite unitaria completa de la spec** (`spec009_unit`, vitest sobre `command-center-startup-output.test.ts`,
`ipc/command-center.test.ts`, `run-command-center-startup.test.ts`, `use-command-center-gate.test.tsx`,
`src/renderer/src/components/command-center/` completo, `thread-scope-startup-message.test.ts`):
13 archivos, 58 tests, los 58 en verde (`Test Files 13 passed (13)`, `Tests 58 passed (58)`).

**Chequeo funcional en la app real**: siete capturas en
`docs/research/2026-09-04-chequeo-funcional-spec-009/` — `01-command-center-root.png`,
`02-selector-abierto.png`, `03-command-center-tandem-pay.png`, `04-hilo-abierto-desde-resolve.png`,
`05-vuelta-al-command-center-con-hilo-abierto.png`, y el par de comparación
`06-comparacion-new-thread-alcance-root-pinta.png` /
`07-comparacion-new-thread-alcance-workspace-en-blanco.png`. Encontró y corrigió, dentro de esta
rama, que las filas de la tarjeta Checks se cortaban en un muñón ilegible (ahora envuelven).

### Bloqueante encontrado, fuera de esta spec

Con un workspace elegido en el selector, el panel del hilo queda en blanco. Es un defecto de
`main`, de la superficie que dejaron las specs 010 y 019 — no de código de esta rama: el mismo
vacío aparece con el botón "New thread" de la barra lateral, sin pasar por el Command Center.
Probado con el par de capturas `06-comparacion-new-thread-alcance-root-pinta.png` (alcance root,
pinta) y `07-comparacion-new-thread-alcance-workspace-en-blanco.png` (alcance workspace, en
blanco). Decisión de Peter (Gate 1, 2026-09-04): no bloquea el merge de la 009; va a spec propia,
que escribe la sesión supervisora.

### Otros dos hallazgos, registrados en `decisions.md`

- Andes prepara una carpeta sin `tree.md`: ni `onboardingBrain.prepare` (`install.sh`) ni
  `createWorkspace` (`new-workspace.sh`) lo escriben — lo escribe `bootstrap.sh`, que el onboarding
  de Andes no corre. Sin ese archivo, el escaneo contesta "missing tree.md" y lee 0 nodos en
  cualquier alcance. Dependencia del onboarding, no de esta pantalla; no se arregla en esta rama.
- Colisión preexistente entre `simple-mode-workspaces-and-files.spec.ts:17` y el sembrador de la
  spec 019 cuando corren en el mismo worker de Playwright.

## Fuera de alcance, con condición de reactivación

- El hilo con permisos dibujados: spec propia. Hasta entonces, los botones abren una sesión de
  agente de las que Orca ya tiene.
- El selector de workspace y los archivos por alcance: spec 010.
- Que el Command Center se actualice solo cuando cambian los archivos: se reactiva si al usarlo la
  pantalla se siente vieja; por ahora se recarga al volver a ella.
