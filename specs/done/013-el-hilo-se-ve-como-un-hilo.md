---
status: implementada
depends_on: [009, 021]
---

# 013 · El hilo se ve como un hilo

Los hilos dejan de abrirse como pestañas y pasan a listarse en la barra lateral. Arriba de la
conversación aparece el título del hilo con el workspace y el foco, y desaparece de la pantalla todo
rastro de comandos y nombres de herramienta.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `d97c8cc07c`. El agente corre `git log d97c8cc07c..main --stat` antes de empezar. Se
implementa **después de la spec 021**, no solo de la 009. La 009 ya está en `main` (merge
`632c0be2`). La 021 arregla que, con un workspace elegido, el hilo no abre y el panel queda en
blanco: hasta que eso esté arreglado, el chequeo funcional que esta spec necesita —abrir un hilo
con un workspace elegido y mirar su cabecera— no se puede hacer.

- "New thread" (`SimpleModeNav.tsx:69`) llama a `openNewThread()`, que en `open-new-thread.ts:97-105`
  lanza `launchAgentInNewTab`, y esa función crea una **pestaña** en
  `launch-agent-in-new-tab.ts:213-218`.
- La pestaña ya guarda todo lo que esta spec necesita: `title`, `generatedTitle`, `aiVaultTitle`,
  `customTitle`, `launchAgent`, `threadScope` y `createdAt` — `src/shared/terminal-tab-types.ts:6-63`.
- Arriba de la conversación hoy hay una sola línea y ningún título: `ThreadScopeBadge.tsx:36-51`,
  montado en `TerminalPaneNativeChatPortal.tsx:47`. Con `threadScope` en `null` no dibuja nada
  (`ThreadScopeBadge.tsx:40-42`).
- El renglón `2× Bash …` lo arma `NativeChatToolRun.tsx:177-178` con `countToolCalls` y
  `summarizeToolRun` (`src/shared/native-chat-tool-summary.ts:235-252`), que concatena el nombre de
  la herramienta con `briefToolArg(input)` (líneas 147-168). El bloque de origen no trae texto
  legible: `NativeChatToolCallBlock` es `{ type, name, input, state? }`
  (`src/shared/native-chat-types.ts:50-56`).
- Ya existe una lista de hilos **abiertos**, la del atajo Cmd+J:
  `src/renderer/src/lib/recent-workspace-tab-rows.ts:25-42`, con su orden por recencia en la línea
  192. **No existe** historial de hilos cerrados.
- Claude Code escribe el título en el archivo de su sesión: `{"type":"ai-title","aiTitle":…}` y
  `{"type":"custom-title","customTitle":…}`. El escáner de sesiones de Andes ya modela eso en
  `src/shared/ai-vault-session-title.ts:6-10`.
- La maqueta aprobada es el tablero `Hilo` del lienzo de diseño de Andes:
  claude.ai/code/artifact/18c77072-09f3-4c87-a18d-f900ad67146a
- ❓ Lo que la lectura previa no cerró: quién llena hoy `generatedTitle` y `aiVaultTitle`. El agente
  lo averigua antes de tocar nada.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | En modo simple no hay barra de pestañas; los hilos abiertos se listan en la barra lateral bajo "Recent threads" | e2e: abrir dos hilos, la barra lateral muestra dos filas y no existe ningún elemento de la tab bar en el árbol |
| 2 | La lista muestra solo los hilos del workspace elegido, por actividad, con el abierto marcado | Test unitario de la proyección con tres hilos de dos workspaces |
| 3 | Clic en una fila abre ese hilo; "New thread" crea uno y lo deja seleccionado | e2e del recorrido |
| 4 | Arriba de la conversación va el título del hilo y debajo `workspace · foco: <nombre>`, con "My work" en la raíz | Test de componente con los dos alcances; e2e verifica el renglón |
| 5 | El título sale del CLI: `custom-title` gana sobre `ai-title`; sin ninguno el hilo se llama "New thread". Renombrar a mano gana sobre los dos | Test unitario de la resolución con las cuatro combinaciones |
| 6 | Un CLI que no escribe título se degrada declarándolo: no se inventa un título | Test unitario con una sesión sin registro de título |
| 7 | La conversación no muestra nombres de herramienta, comandos ni rutas: va una línea de actividad en lenguaje de persona, y si el evento no se puede redactar así dice "Working…" y nada más | Eval de texto sobre el redactor con Bash, Read, Write, Grep y Task: ninguna salida contiene un nombre de herramienta, una ruta con `/`, ni acento grave. Rúbrica de la redacción: verbo en presente + qué se está mirando o escribiendo, sin nombre propio de archivo (bien: "leyendo la decisión del proveedor de pagos"; mal: "leyendo decisions.md") |
| 8 | El panel de archivos de la derecha no aparece en modo simple: los archivos se ven en su pantalla, que es donde la spec 010 los puso | e2e en modo simple: el panel derecho no está en el árbol; e2e en modo desarrollo: sigue estando |
| 9 | En modo desarrollo no cambia nada: pestañas, panel derecho y línea de herramientas como hoy | e2e en modo desarrollo |
| 10 | Código sano | `pnpm tc` · `check:code-quality:changed` · `verify:localization-*` y los tests nuevos en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-04): los hilos van en la barra lateral, no en pestañas, con la
  cabecera de la maqueta. Las pestañas son vocabulario de editor de código y contradicen el modo
  simple.
- DECIDIDO por Peter (Gate 1, 2026-09-04): la interfaz no muestra comandos ni nombres de herramienta.
  Hoy se lee `2× Bash .os/core/lib/session-start.s`, que es código y no le dice nada a quien no
  programa.
- DECIDIDO por Peter (Gate 1, 2026-09-04): el título del hilo se comporta como el de Claude Code por
  omisión — lo genera el CLI a partir de la conversación y se puede renombrar.
- DECIDIDO por Peter (2026-09-03): un solo idioma, inglés. Los rótulos son "Recent threads" y
  "New thread", aunque la maqueta esté escrita en español.

**Delegadas al agente, con criterio**

- Si las pestañas se borran o se esconden en modo simple. Criterio: se esconden — el modo desarrollo
  las usa y el criterio 8 las exige.
- Cuántos hilos entran en la lista antes de cortar. Criterio: los que entren sin barra de
  desplazamiento; el resto queda para el historial, que no es de esta spec.
- Dónde vive la lista. Criterio: reutiliza la proyección de `recent-workspace-tab-rows.ts` en vez de
  escribir una segunda.

**Condiciones de parada**

- Si sacar la barra de pestañas del modo simple obliga a tocar la capa que lanza el binario del
  agente, para y pregunta.
- Si el título del CLI solo se puede leer abriendo un archivo fuera de la carpeta de datos de la
  app, para y pregunta.
- Si el criterio 2 exige el historial de hilos cerrados, para: es spec aparte.

## Efectos que escapan del sistema

Ninguno.

## Fuera de alcance, con condición de reactivación

- Historial de hilos cerrados, el "Ver historial" de la maqueta: se reactiva cuando alguien pida
  recuperar un hilo que cerró.
- Los archivos del hilo, el botón "Archivos del hilo · 2" de la maqueta: se reactiva cuando el hilo
  adjunte archivos.
- La tarjeta de subagente, diferida desde la spec 011: se reactiva cuando la spec 012 entregue el
  ítem de subagente.

## El ❓ resuelto: quién llenaba `generatedTitle` y `aiVaultTitle`

`startAiVaultTabTitleSync` (`src/renderer/src/lib/ai-vault-tab-title-sync.ts`) ya los llenaba, leyendo
`session-title-file-reader.ts` → el escáner de sesiones de Claude
(`session-scanner-primary-parsers.ts:85-94,170-176`). Pero `AiVaultSession.title` (y por lo tanto
`aiVaultTitle.title`) traía su propio *fallback chain* completo — custom-title → ai-title → primer
prompt del usuario → `"Claude <id>"` inventado — pensado para el listado de AI Vault, donde algún
título siempre hace falta. Usarlo tal cual para el encabezado del hilo habría violado el criterio 6
(mostraría el primer prompt, o un id inventado, como si el CLI lo hubiera escrito). La spec agrega
`explicitTitle` (`string | null`) a `AiVaultSession`/`AiVaultSessionTitle`: solo lo que el CLI
escribió como `custom-title`/`ai-title`, `null` cuando no escribió ninguno — ver `decisions.md`.

## Evidencia

### Criterio 1 — sin barra de pestañas en modo simple

La barra real no era `TerminalTitlebarTabs.tsx` (portal que ya vuelve `null` con cualquier layout
activo desde la spec 021) sino el strip de 32px que arma cada `TabGroupPanel.tsx` — hallazgo del
chequeo funcional, documentado en `decisions.md` y `learnings/gatear-por-modo-en-el-componente-que-realmente-pinta.md`.
Gateado en `TabGroupPanel.tsx:69-70` (`isSimpleMode`) y `TerminalTitlebarTabs.tsx:23-24,66`.

```
$ npx vitest run --config config/vitest.config.ts src/renderer/src/components/TerminalTitlebarTabs.test.tsx
 Test Files  1 passed (1)
      Tests  3 passed (3)

$ npx playwright test tests/e2e/simple-mode-thread-sidebar.spec.ts --config tests/playwright.config.ts --project=electron-headless --workers=1
  ✓ spec013#1 two open threads: two sidebar rows, no tab bar anywhere in the tree
  5 passed (37.4s)
```

### Criterio 2 — la proyección por workspace

`src/renderer/src/components/sidebar/workspace-scope/simple-mode-thread-rows.ts`
(`buildSimpleModeThreadRows`), reusando `orderRecentWorkspaceTabs` de
`src/renderer/src/lib/recent-workspace-tab-rows.ts` (la decisión delegada de la spec: reusar la
proyección de Cmd+J).

```
$ npx vitest run --config config/vitest.config.ts src/renderer/src/components/sidebar/workspace-scope/simple-mode-thread-rows.test.ts
 Test Files  1 passed (1)
      Tests  6 passed (6)
```
Tres hilos, dos workspaces (`andes`, `tandem-pay`) y la raíz: cada test aísla un caso —
`only returns threads of the active workspace scope`, `only returns root-scoped threads`,
`orders threads within a scope newest first`, `flags the currently open thread`.

### Criterio 3 — clic abre, "New thread" selecciona

`src/renderer/src/components/sidebar/workspace-scope/select-thread.ts` (mismo `setActiveTab` /
`setActiveTabType('terminal')` que usa la barra de pestañas de modo desarrollo).

```
$ npx playwright test tests/e2e/simple-mode-thread-sidebar.spec.ts --config tests/playwright.config.ts --project=electron-headless --workers=1
  ✓ spec013#3 clicking a row opens that thread; New thread creates and selects one
```

### Criterios 4, 5 y 6 — título, alcance y degradación

`src/renderer/src/components/native-chat/ThreadHeader.tsx` (reemplaza `ThreadScopeBadge.tsx`) +
`src/shared/thread-header-title.ts` (`resolveThreadHeaderTitle`).

```
$ npx vitest run --config config/vitest.config.ts src/renderer/src/components/native-chat/ThreadHeader.test.tsx src/shared/thread-header-title.test.ts
 Test Files  2 passed (2)
      Tests  12 passed (12)

$ npx playwright test tests/e2e/simple-mode-thread-sidebar.spec.ts --config tests/playwright.config.ts --project=electron-headless --workers=1
  ✓ spec013#4,6 the header shows a title and "My work · <scope>", degrading to "New thread" when the CLI wrote none
```
Las cuatro combinaciones del criterio 5 (custom+ai, solo ai, ninguno, renombre a mano) están en
`thread-header-title.test.ts`. El e2e usa el agente de stub dorado, que nunca escribe
`custom-title`/`ai-title` — ejercita en vivo la degradación del criterio 6 sin ningún dato inyectado.

### Criterio 7 — la línea de actividad en lenguaje de persona

`src/renderer/src/components/native-chat/native-chat-activity-phrase.ts` (`describeToolActivity`),
gateado en `NativeChatToolRun.tsx` por `usePlainLanguageActivity()`.

```
$ npx vitest run --config config/vitest.config.ts src/renderer/src/components/native-chat/native-chat-activity-phrase.test.ts
 Test Files  1 passed (1)
      Tests  14 passed (14)
```
Fixtures con Bash (comando con ruta y `grep`), Read/Write (con ruta real), Grep (patrón + ruta de
búsqueda) y Task (descripción + prompt con ruta): ninguna salida contiene el nombre de la herramienta
como palabra completa, `/`, ni acento grave. Read/Write con ruta derivan un sustantivo humanizado del
*basename* (`"Reading the payment provider decision"` para
`payment-provider-decision.md`); Bash/Grep/Task nunca ecoan su comando, patrón o prompt —
sobre-filtrar es la decisión (`decisions.md`). Una herramienta no reconocida cae a "Working…".

### Criterio 8 — sin panel derecho en modo simple

`src/renderer/src/app-shell/use-app-chrome-layout.ts:138-142` (`showRightSidebarControls`, ahora
también exige `interfaceMode !== 'simple'`).

```
$ npx playwright test tests/e2e/simple-mode-thread-sidebar.spec.ts --config tests/playwright.config.ts --project=electron-headless --workers=1
  ✓ spec013#8 the right files panel never shows in simple mode
```

### Criterio 9 — modo desarrollo intacto

```
$ npx playwright test tests/e2e/simple-mode-thread-sidebar.spec.ts --config tests/playwright.config.ts --project=electron-headless --workers=1
  ✓ spec013#9 the tab bar and the right panel still work as before
```
Y el resto de la suite de modo desarrollo que toca estas superficies sigue en verde:
`NativeChatToolRun.test.tsx` (13 tests, línea de herramienta cruda intacta),
`tests/e2e/simple-mode-native-chat-thread.spec.ts` (2 tests, ajustado para lanzar desde "New
thread" de la barra lateral en vez del botón "+ New tab" que ya no existe en modo simple — la
funcionalidad que prueba, permiso y conversación viva entre vueltas, no cambió),
`tests/e2e/simple-mode-thread-opens-with-workspace.spec.ts` (spec 021, 2 tests).

### Criterio 10 — código sano

```
$ pnpm tc
$ pnpm run check:code-quality:changed
code quality: 0 new finding(s) across 247 changed file(s).
type-aware code quality: 0 new finding(s) across 247 changed file(s).
React Doctor: 0 new finding(s) across 247 changed file(s).
Changed-code quality gate passed since d97c8cc07c5a.

$ pnpm run verify:localization-catalog
Verified 12543 localization key references against en.json.
$ pnpm run verify:localization-extraction
Extracted 11117 keys; 25 dynamic defaults are report-only, 2697 existing English entries are not
statically referenced, and 71 inline defaults differ.
$ pnpm run verify:localization-coverage
Localization coverage check passed with 12 allowlisted candidates.

$ bash evals/run.sh   # corrido dos veces seguidas, mismo resultado las dos
151 pasan · 0 fallan
```
Suite unitaria completa: `7570 passed | 10 failed | 47 skipped`. Los diez fallos están en los mismos
cuatro archivos que ya declaraban las specs 009/021 sobre `main` limpio, sin esta rama:
`src/renderer/src/components/sidebar/Sidebar.test.tsx` (5), `repos-onboarding-folder-startup.test.ts`
(1), `onboarding-folder-agent-startup.test.ts` (1) y `structured-tui-transcript-catchup.test.ts` (2-3,
flaky en el conteo exacto). No hay ningún archivo rojo nuevo.

### Chequeo funcional en la app real

`docs/research/2026-09-04-chequeo-funcional-spec-013/`, ocho capturas. App levantada con `pnpm dev`
sobre un repo desechable con `workspaces/tandem-pay/`, manejada por `chromium.connectOverCDP` — sin
tocar la ventana, como pide el gotcha de la spec 019. Con "My work" y con un workspace elegido.

| Captura | Qué muestra |
|---|---|
| `01-app-open-no-folder.png` | Punto de partida, sin carpeta |
| `02-folder-opened-simple-mode-my-work.png` | Carpeta abierta, alcance "My work", "No recent threads yet" |
| `03-new-thread-my-work-sidebar-and-header.png` | Primer "New thread": una fila en la barra lateral, encabezado "New thread" / "My work" |
| `04-second-thread-two-sidebar-rows-no-tab-bar.png` | Segundo "New thread": dos filas, **sin ningún elemento de barra de pestañas en pantalla** |
| `05-clicked-other-row-selection-moved.png` | Clic en la fila más vieja: la selección se mueve |
| `06-scope-selector-open.png` | El selector de workspace abierto, con "Tandem Pay" |
| `07-workspace-scoped-thread-header.png` | Alcance "Tandem Pay" elegido, "New thread": encabezado "New thread" / **"Workspace · Focus: Tandem Pay"** |
| `08-developer-mode-tab-bar-and-right-panel-back.png` | Modo desarrollo: tres pestañas en la barra, panel derecho abierto con `workspaces/` y `README.md` |

El primer intento de este chequeo (con el eval unitario ya en verde) mostró la barra de pestañas
completa en modo simple — el hallazgo que llevó a la decisión de gatear `TabGroupPanel.tsx` en vez
de (solo) `TerminalTitlebarTabs.tsx`. Las ocho capturas de arriba son con el arreglo aplicado.
