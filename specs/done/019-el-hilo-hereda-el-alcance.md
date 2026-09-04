---
status: implementada
depends_on: [010, 011]
---

# 019 · El hilo hereda el alcance

**Tipo**: fix · **Flujo**: causa identificada

## Estado previo

`main` en `8c01e93c98`. Depende de la spec 010 (selector de workspace) y de la spec 011 (el hilo,
que dejó el criterio 6 —"el hilo nace con el alcance del Command Center"— diferido).

## Síntoma y causa

Con el selector de la barra lateral en **"My work"** (la raíz), Peter abre un hilo, escribe "hola" y
el agente responde *"Hola. ¿Con qué scope trabajamos: tandem-pay (el único workspace) o el root (tu
propio trabajo)?"*. Dos problemas: el alcance ya está elegido en la barra lateral, y preguntarlo
rompe el aislamiento de contexto que el workspace promete.

La causa es el criterio 6 diferido de `specs/done/011-el-hilo.md`. El contrato de sesión del núcleo
(`vendor/ai-first-os-core/core/CLAUDE.md`, "When the session starts") dice: **"The first message
names the scope being worked on... If it does not name one... ask which."** El hilo, hoy, arranca
sin decir nada — así que el agente hace exactamente lo que el contrato le manda.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | El hilo nace con el alcance del selector como su primer mensaje, en el vocabulario exacto del contrato del núcleo (`--workspace <slug>` / `--root`), antes de que la persona escriba nada | `spec019#1`, `spec019#2`, `spec019#3` (unit, `open-new-thread.test.ts`) |
| 2 | El mensaje nunca es una pregunta y nombra el flag correcto para cada alcance | `spec019#4`, `spec019#5`, `spec019#6` (unit, `thread-scope-startup-message.test.ts`) |
| 3 | El alcance se ve en la pantalla del hilo (badge), leído del alcance con el que nació — nunca del valor en vivo del selector | `spec019#7`, `spec019#8`, `spec019#9` (unit, `ThreadScopeBadge.test.tsx`) |
| 4 | `launchAgentInNewTab` estampa el `threadScope` recibido en el tab creado, y no agrega el campo cuando no se lo pasan | `spec019#13` (unit, `launch-agent-in-new-tab-thread-scope.test.ts`) |
| 5 | Cambiar de workspace en el selector después de abierto un hilo no le toca el alcance a ese hilo; el próximo hilo nace con el nuevo | `spec019#12` (e2e) — ver Decisiones |
| 6 | **Obligatorio**: prueba de interfaz con agente simulado — abre un hilo con la raíz elegida y otro con un workspace elegido, y verifica que en los dos casos el primer intercambio no contiene una pregunta sobre el alcance | `spec019#10`, `spec019#11` (e2e, `simple-mode-thread-inherits-scope.spec.ts`) |
| 7 | Chequeo funcional en la app real, con el agente Claude real (Definition of Done del repo) | Seis capturas en `docs/research/2026-09-04-chequeo-funcional-spec-019/`, ver Evidencia |

## Decisiones

**Delegada al agente, con piso mínimo (Peter, en el pedido)**: qué pasa al cambiar de workspace con
hilos abiertos. Piso: el hilo viejo conserva su alcance, el próximo hilo nace con el nuevo.

- 🔍 DECIDIDO por esta sesión, dentro de ese piso: **el alcance de un hilo se congela en el momento
  del lanzamiento y nunca se relee del selector.** `openNewThread` llama
  `resolveActiveWorkspaceScope(activeWorkspaceScopeSlug, workspaceScopeOptions)` una sola vez, en el
  momento del clic en "New thread", y ese valor —nunca una referencia al store— viaja como
  `threadScope` hasta quedar estampado en el `TerminalTab` (`shared/terminal-tab-types.ts`). No hay
  ningún mecanismo que reconcilie el alcance de un tab existente cuando el selector cambia — es la
  ausencia de ese mecanismo la que cumple el piso, no una regla activa de "congelamiento". Motivo:
  es el comportamiento que menos sorprende — un hilo es una conversación con un agente que ya
  arrancó sobre una carpeta real; cambiar qué dice el badge de un hilo viejo sin resetearlo sería
  cosmético y falso (la sesión de Claude sigue viendo el `--root` o `--workspace` con el que
  arrancó). **La invalidaría**: que el hilo pase a poder cambiar de alcance en caliente (reiniciando
  la sesión del agente), lo que exigiría un mecanismo nuevo, no solo leer el store en el render.

**Delegada al agente, sin piso explícito**: cómo probar el criterio 6 (obligatorio) sin gastar
crédito real de una sesión de Claude en vivo.

- 📌 Se reusó el patrón ya establecido en `simple-mode-native-chat-thread.spec.ts` (spec 011): agente
  de stub dorado (`golden-stub-agent`) vía `configureGoldenStubAgent`. A diferencia de esa spec, acá
  no hizo falta espiar la PTY — el mensaje de alcance viaja como *argv* del lanzamiento (Claude tiene
  `promptInjectionMode: 'argv'`), así que una suscripción de Zustand instalada antes del clic
  (`captureNextQueuedStartupCommand`) capta `pendingStartupByTabId[...].command` en el instante en
  que se encola, ganándole a la carrera con el montaje del `TerminalPane` que lo consume. Motivo: es
  más directo que espiar la PTY para este caso — el criterio pide el *contenido del primer mensaje*,
  no que se haya tecleado.

## Qué se construyó

- **`src/renderer/src/lib/thread-scope-startup-message.ts`** (nuevo): `buildThreadScopeStartupMessage`
  arma el mensaje en inglés, con el vocabulario exacto del contrato (`--root` / `--workspace <slug>`)
  y la instrucción explícita de no preguntar.
- **`src/renderer/src/components/sidebar/workspace-scope/open-new-thread.ts`**: captura
  `resolveActiveWorkspaceScope(store.activeWorkspaceScopeSlug, store.workspaceScopeOptions)` una sola
  vez, y pasa `threadScope`, `prompt: buildThreadScopeStartupMessage(threadScope)` y
  `promptDelivery: 'auto-submit'` a `launchAgentInNewTab`.
- **`src/renderer/src/lib/launch-agent-in-new-tab.ts`**: nuevo parámetro opcional `threadScope`,
  estampado en las opciones de `store.createTab` solo cuando está presente.
- **`src/renderer/src/store/terminals/terminal-actions.ts`** y **`terminal-tab-creation.ts`**: el tipo
  de opciones de `createTab` acepta `threadScope`, y la creación del tab lo copia al `TerminalTab` si
  vino.
- **`src/shared/terminal-tab-types.ts`**: `TerminalTab.threadScope?: ThreadScope` (nuevo campo
  opcional, mismo patrón que `launchAgent`/`quickCommandLabel`).
- **`src/shared/workspace-scope-types.ts`**: `export type ThreadScope = { kind: 'root' } | { kind:
  'workspace'; slug: string; name: string }` — tipo compartido, compatible estructuralmente con
  `WorkspaceScope` de la slice del store (que además lleva `path`).
- **`src/renderer/src/components/native-chat/ThreadScopeBadge.tsx`** (nuevo): lee
  `tab.threadScope` (nunca el selector en vivo) y muestra "My work" o el nombre del workspace.
  Catálogo inglés: `components.native-chat.threadScope.{root,workspace}` en `en.json`.
- **`src/renderer/src/components/terminal-pane/TerminalPaneNativeChatPortal.tsx`**: envuelve el
  contenido de la conversación en una columna con el badge arriba — el único cambio de layout de
  esta spec.

Nada de esto tocó el canal de datos ni la tarjeta de permiso (specs 011/015/016); el mensaje de
alcance usa el mismo mecanismo de argv que ya usan `resolveSimpleModeThreadAgentArgs` y el resto de
`open-new-thread.ts`.

## Evidencia

Rama `spec-019-hilo-hereda-alcance`, worktree `andes-wt-spec-019`, sobre `main` en `8c01e93c98`.

### Unit tests

```
$ pnpm exec vitest run --config config/vitest.config.ts \
    src/renderer/src/components/sidebar/workspace-scope/open-new-thread.test.ts \
    src/renderer/src/lib/thread-scope-startup-message.test.ts \
    src/renderer/src/components/native-chat/ThreadScopeBadge.test.tsx \
    src/renderer/src/lib/launch-agent-in-new-tab.test.ts \
    src/renderer/src/lib/launch-agent-in-new-tab-thread-scope.test.ts \
    src/renderer/src/lib/launch-agent-in-new-tab-web-runtime.test.ts \
    src/renderer/src/lib/launch-agent-in-new-tab-windows-quoting.test.ts \
    src/renderer/src/lib/launch-agent-in-new-tab-cwd.test.ts \
    src/renderer/src/components/sidebar/workspace-scope/SimpleModeNav.test.tsx \
    src/renderer/src/components/sidebar/workspace-scope/WorkspaceScopeSelector.test.tsx

 Test Files  10 passed (10)
      Tests  74 passed (74)
```

### e2e — criterio 6, obligatorio

```
$ npx playwright test tests/e2e/simple-mode-thread-inherits-scope.spec.ts --config tests/playwright.config.ts --project electron-headless --workers=1

  ✓  spec019#10 root selected: the thread launches naming the root, never a question (1.5s)
  ✓  spec019#11 a workspace selected: the thread launches naming that workspace, never a question (1.8s)
  ✓  spec019#12 switching the selector after a thread opens does not change that thread's badge (1.5s)

  3 passed (12.3s)
```

El comando queued capturado en `spec019#10` (root):

```
golden-stub-agent '--permission-mode' 'manual' 'This thread'"'"'s scope is already chosen: my own
work, the root — not a workspace. Run the startup scan and the startup read with --root. Do not ask
which scope to use.'
```

y en `spec019#11` (workspace):

```
...'This thread'"'"'s scope is already chosen: the workspace "Tandem Pay" (slug: tandem-pay). Run
the startup scan and the startup read with --workspace tandem-pay. Do not ask which scope to use.'
```

### e2e existentes — sin regresión

```
$ npx playwright test tests/e2e/simple-mode-native-chat-thread.spec.ts tests/e2e/simple-mode-workspaces-and-files.spec.ts --config tests/playwright.config.ts --project electron-headless --workers=1

  8 passed (2.2m)
```

### `pnpm tc`

```
$ pnpm run typecheck
$ node config/scripts/run-typecheck-projects-in-parallel.mjs
```

Sin salida — en verde.

### `pnpm run check:code-quality:changed`

```
code quality: 0 new finding(s) across 14 changed file(s).
type-aware code quality: 0 new finding(s) across 14 changed file(s).
React Doctor: 0 new finding(s) across 14 changed file(s).
Changed-code quality gate passed since 8c01e93c98a8.
```

### `verify:localization-*`

```
$ pnpm run verify:localization-catalog
Verified 12494 localization key references against en.json.

$ pnpm run verify:localization-extraction
Extracted 11071 keys; 25 dynamic defaults are report-only, 2698 existing English entries are not
statically referenced, and 38 inline defaults differ.

$ pnpm run verify:localization-coverage
Localization coverage check passed with 12 allowlisted candidates.
```

Mismos números de referencia que en `main` para las dos últimas verificaciones (no bloqueantes) —
las dos claves nuevas (`components.native-chat.threadScope.root` y `.workspace`) están cubiertas.

### Chequeo funcional en la app real (criterio 7)

App levantada desde el worktree con `pnpm dev`, perfil propio (`ORCA_DEV_USER_DATA_PATH=/tmp/a19` —
ver Gotcha en `CLAUDE.md`) y puerto de depuración propio (elegido solo por el script de arranque a
partir del hash de la ruta del worktree: `9523`), manejada **exclusivamente por su puerto de
depuración vía Playwright/CDP** (`chromium.connectOverCDP`) — nunca con clics ni con `System Events`
sobre la ventana, para no interferir con la instancia de Peter en `andes-mirar` (mismo
`build.andes.dev`). Vault abierto: `~/Documents/proyectos/ai-first-os-demo`, agente **Claude real**
(no stub) detectado en la máquina.

| Paso | Captura | Resultado |
|---|---|---|
| 1 | `01-my-work-abierto.png` | Vault abierto, selector en "My work" (root) |
| 2 | `02-root-hilo-y-respuesta.png` | Hilo nuevo: primer mensaje nombra el root, el agente corre el scan/read con `--root` sin preguntar, y responde con el estado real de la sesión |
| 3 | `03-root-hola-respondido-sin-preguntar.png` | Se escribe "hola": la respuesta ("Hola. Seguimos con marca-personal-linkedin...") no menciona el alcance |
| 4 | `04-selector-tandem-pay.png` | Selector abierto, mostrando "Tandem Pay" como opción |
| 5 | `05-tandem-pay-hola-respondido-sin-preguntar.png` | Con "Tandem Pay" elegido, hilo nuevo, badge "Tandem Pay", "hola" respondido con el estado real del workspace, sin preguntar el alcance |
| 6 | `06-hilo-viejo-conserva-my-work.png` | El hilo abierto en el paso 2 sigue mostrando el badge "My work" después de haber cambiado el selector a Tandem Pay en el paso 4/5 (criterio 5) |

## Gotcha encontrado durante el chequeo (documentado en `CLAUDE.md`)

`ORCA_DEV_USER_DATA_PATH` apuntando a una ruta larga (por ejemplo, un directorio de scratchpad de
sesión) rompe el arranque: el daemon local escucha en un socket de dominio Unix bajo esa carpeta, y
macOS limita esas rutas a ~104 caracteres. El síntoma es un modal "Andes couldn't start its local
command transport" con `listen EINVAL: invalid argument .../o-<pid>.sock`. No es un defecto del
producto — es una restricción del sistema operativo sobre la ruta elegida. Solución: una ruta corta
(`/tmp/<algo-corto>`).

## Fuera de alcance

- El canal de datos del permiso (criterio 2b de la spec 011) — no tocado.
- Que un hilo ya abierto pueda cambiar de alcance en caliente — ver Decisiones.
- Paridad completa de modo developer (no aplica: esta spec es pura de modo simple).
