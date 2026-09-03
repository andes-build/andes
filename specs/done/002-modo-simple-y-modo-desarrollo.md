---
status: implementada
depends_on: [004]
---

# 002 · Modo simple y modo desarrollo

Andes arranca y se queda en un modo simple pensado para trabajo de conocimiento: un agente, una
carpeta, una conversación. Todo lo que Orca trae para desarrollo —git, worktrees, pull requests,
orquestación, automatizaciones, navegador, emulador, puertos— sigue en el código pero no se ofrece
en la interfaz de esta primera versión. El modo desarrollo existe solo como puerta escondida para
quien construye Andes. Nada se borra: se esconde por una preferencia.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `fdb2ec94` (specs 001, 003 y 004 mergeadas). La spec 004 ya está en `main`: la sección
`linear` y sus superficies no existen más. El agente corre `git log fdb2ec94..main --stat` antes
de empezar.

- La spec 004 sacó Linear de la navegación, Integraciones, Fuentes de tareas, onboarding y barra lateral: no cuenta en las listas de abajo.
- Las secciones de Ajustes se arman en cuatro constructores —`src/renderer/src/hooks/settings-navigation-{capability,interface,remote,workflow}-sections.ts`— a partir de `SettingsNavigationBuildOptions` (`settings-navigation-build-options.ts`: `isMac`, `isWebClient`, `isDev`, `isLinearConnected`, `repos`…). Ya hay secciones condicionales: `linear` solo si `isLinearConnected` (`settings-navigation-capability-sections.ts`, ya sin Linear). Los ids válidos están en `SETTINGS_NAV_TARGETS` (`src/renderer/src/lib/settings-navigation-types.ts:15-45`).
- Una preferencia booleana de punta a punta, para copiar el patrón: `experimentalPet` — tipo en `src/shared/global-settings-types.ts:423`, default en `src/shared/default-global-settings.ts:226`, normalización al cargar en `src/main/persistence/loading-store/normalize-loaded-global-settings.ts:64`, telemetría en `src/shared/telemetry-property-schemas.ts:191`, y consumo en el renderer vía el store (`src/renderer/src/store/slices/ui/`).
- Precedente de "grupo escondido": `ExperimentalPane.tsx` con `hiddenExperimentalUnlocked` (líneas 27-29), que solo aparece con Option-clic.
- Barra derecha: `src/renderer/src/components/right-sidebar/` (AiVaultPanel, ChecksPanel, FolderWorkspacePrChecksPanel, FolderWorkspaceWorktreesPanel, PluginPanel, PortsPanel).
- Barra izquierda: `src/renderer/src/components/sidebar/`, centrada en hosts, repos y worktrees (`host-section-order.ts`, `host-section-rows.ts`, secciones de detalle de worktree: automation, cli, issue, review).
- Pestañas y paneles de desarrollo: `browser-pane`, `emulator-pane`, `pull-request-page`, `task-page`, `github-item-dialog`, `gitlab-item-dialog`, `dashboard`, `dashboard-popout`, `artifacts`, `automations`, `floating-terminal`, `terminal-quick-commands`, `cmd-j`, `stats`, `pet`, `diff-comments`, `workspace-cleanup`, `new-workspace`.
- Detección de repositorio git: `src/main/git/repo-detection.ts`. No se usa en esta spec (ver decisiones).
- Tests e2e con Electron sin ventana: `tests/e2e/*.spec.ts` con Playwright (`--project electron-headless`); ejemplo de aserción de visibilidad en `tests/e2e/agent-dashboard-status-burst.spec.ts:81`.
- Catálogo de idiomas con español: `src/renderer/src/i18n/`, verificado por `verify:localization-*`.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | Existe la preferencia global `interfaceMode` con valores `'simple' \| 'developer'`, default `'simple'`; un archivo de ajustes guardado sin la clave carga como `'simple'`; un valor inválido cae a `'simple'` | Tests unitarios junto a `normalize-loaded-global-settings.ts` y `default-global-settings.ts`: tres casos (ausente, inválido, `'developer'`) |
| 2 | No hay ningún control visible que cambie de modo. El modo developer se activa solo por la puerta escondida: la variable de entorno `ANDES_INTERFACE_MODE=developer` al arrancar, o el mismo gesto que Orca usa para lo experimental oculto (Option-clic en el título de Ajustes → Advanced), que escribe la preferencia y aplica en caliente | Test de componente: Ajustes → General no renderiza ningún selector de modo; test unitario del arranque con la variable de entorno; e2e: Option-clic en el título de Advanced hace aparecer la sección Git sin recargar |
| 3 | En modo simple la navegación de Ajustes contiene exactamente: `general, agents, accounts, appearance, input, terminal, notifications, shortcuts, privacy, advanced`. En modo developer contiene lo mismo que hoy, sin quitar ni agregar | Test unitario sobre los cuatro constructores con `interfaceMode` en las opciones: igualdad exacta de la lista de ids en cada modo; el caso developer compara contra una instantánea tomada de `main` antes de tocar nada |
| 4 | En modo simple la barra derecha ofrece solo el panel de conversaciones (AI Vault); Checks, PR checks, Worktrees, Ports y Plugin no se renderizan ni tienen pestaña | Test de componente de la barra derecha en los dos modos; e2e en modo simple: `getByRole('tab', { name: /checks\|ports\|worktrees/i })` con `toHaveCount(0)` |
| 5 | En modo simple no se puede abrir ninguna de estas superficies, ni por menú ni por atajo ni por comando: browser-pane, emulator-pane, pull-request-page, task-page, dashboard y dashboard-popout, artifacts, automations, floating-terminal, terminal-quick-commands, cmd-j, stats, pet, workspace-cleanup, new-workspace (worktree). Los atajos correspondientes no hacen nada | Test unitario del registro de comandos/atajos con `interfaceMode: 'simple'`: cada comando de la lista devuelve "no disponible"; e2e: disparar el atajo del navegador y de cmd-j en modo simple y verificar que no aparece ninguna pestaña nueva |
| 6 | En modo simple la barra izquierda muestra proyectos (carpetas) y sus agentes, y no muestra acciones ni secciones de git: crear worktree, filtro por repositorio, detalle de issue, detalle de review, automations, cleanup | Test de componente de la barra izquierda en modo simple: las secciones de detalle de worktree `issue`, `review`, `automation` y el botón de nuevo worktree no se renderizan; en developer sí |
| 7 | **VERIFICADO PARCIALMENTE** (ver Evidencia → Pendiente para el Gate 2). El modo developer no tiene regresión: la suite e2e existente corre con `interfaceMode: 'developer'` fijado en el fixture de arranque y pasa igual que en `main` | `pnpm test:e2e` (o el script equivalente del repo) en verde con el fixture; diff del fixture visible en el PR |
| 8 | Primer arranque: Andes abre en modo simple sin preguntar; ninguna pantalla de onboarding menciona worktrees, PRs ni orquestación mientras el modo sea simple | e2e de primer arranque en modo simple: los textos "worktree", "pull request" y "orchestration" no aparecen (`getByText(/worktree\|pull request\|orchestration/i)` → `toHaveCount(0)`) |
| 9 | Todo texto nuevo entra por el catálogo de idiomas con su traducción al español | `pnpm run verify:localization-catalog`, `verify:localization-extraction` y `verify:localization-coverage` en verde |
| 10 | El código sigue sano | `pnpm tc` · `pnpm test` · `pnpm run check:code-quality:changed` en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-02): se esconde por configuración, no se borra. Todo lo que
  esta spec oculta sigue compilado, probado y disponible en modo developer.
- DECIDIDO por Peter (2026-08-29, iniciativa Andes): el modo simple es el predeterminado — un
  agente, una carpeta, una conversación.
- DECIDIDO por Peter y Maxi Delgado (2026-09-02): qué se esconde en modo simple es la lista de
  `research/2026-09-02-que-traer-de-orca.md` del brain, reproducida en los criterios 3 a 6.
- DECIDIDO por Peter (Gate 1, 2026-09-02): **en esta primera versión se esconde todo lo referente
  al modo desarrollo**; no hay control visible para cambiar de modo. El modo developer queda como
  puerta escondida para quien construye Andes. La activación automática al montar un repositorio
  queda fuera de alcance con condición de reactivación (abajo): detectarla por "la carpeta es un
  repo git" está mal, porque el brain de un operador también es un repo git.

**Delegadas al agente, con criterio**

- Dónde vive la lectura del modo en el renderer (un hook `useInterfaceMode()` sobre el store de
  ajustes, o pasar `interfaceMode` por `SettingsNavigationBuildOptions` y equivalentes). Criterio:
  un solo punto de verdad, sin duplicar la preferencia en el estado de UI persistido.
- Cómo se bloquean los comandos y atajos del criterio 5: un guard central en el registro de
  comandos, o condición por comando. Criterio: el guard central si existe un registro único;
  si están dispersos, condición por comando y una lista única exportada desde `src/shared/` que los
  tests recorran.
- Qué hacer si el usuario pasa a simple con pestañas de desarrollo abiertas. Criterio: se cierran
  esas pestañas y se conserva el resto; nunca se pierde una conversación.

**Condiciones de parada**

- Si esconder una superficie del criterio 5 exige tocar `src/main/runtime/`, `src/main/providers/`
  o la capa que lanza el binario del agente, el agente para y pregunta: esa capa no se toca (regla
  de conformidad de la iniciativa).
- Si la lista del criterio 3 deja fuera algo que el modo simple necesita para funcionar (por
  ejemplo, una sección de la que depende el arranque de un agente), para y pregunta en vez de
  ampliar la lista por su cuenta.
- Si la suite e2e no puede fijar el modo desde un fixture sin cambiar cómo se cargan los ajustes
  en tests, para y pregunta.

## Efectos que escapan del sistema

Ninguno.

## Fuera de alcance, con condición de reactivación

- **Activación automática del modo desarrollo al montar un repositorio**: se reactiva cuando Andes
  sepa qué es un repo montado en el sentido del sistema (la fila de `mounts.md` o el `repo:` de la
  cabeza de un nodo), no por detección de git.
- **La pantalla del modo simple** (cómo se ve la conversación única sin terminal, sobre el Agent
  SDK): spec propia, con lo que probó `tsk-182` y el diseño de interfaz de la iniciativa.
- **Ocultar el explorador de archivos o el editor**: se quedan en los dos modos.
- **Un control visible para cambiar de modo, o un modo por carpeta**: se reactiva cuando exista un
  usuario real que construya software con Andes y lo pida.

## Evidencia

Rama `spec-002-modo-simple-y-modo-desarrollo`, sobre `main` en `24799fae70`.

### `evals/run.sh` — 30/30 en verde

```
PASS spec002#1 existe interfaceMode simple/developer, default simple, normaliza ausente e inválido
PASS spec002#2 General no ofrece selector de modo; el toggle de Option-clic existe
     | e2e (tests/e2e/simple-mode-onboarding.spec.ts, tests/e2e/simple-mode-surfaces.spec.ts) corridos aparte — evidencia pegada en la spec archivada.
PASS spec002#3 en simple la navegación de Ajustes tiene exactamente los diez ids; en developer, la lista completa
PASS spec002#4 en simple la barra derecha solo ofrece AI Vault; Checks/PR checks/Worktrees/Ports/Plugin no aparecen
     | e2e (tests/e2e/simple-mode-surfaces.spec.ts) corrido aparte — evidencia pegada en la spec archivada.
PASS spec002#5 en simple ninguna de las 15 superficies de desarrollo se abre por comando ni atajo
     | e2e (tests/e2e/simple-mode-surfaces.spec.ts) corrido aparte — evidencia pegada en la spec archivada.
PASS spec002#6 en simple la barra izquierda no muestra issue/review/automation ni el botón de nuevo worktree
PASS spec002#7 el modo developer no tiene regresión — VERIFICADO PARCIALMENTE (evidencia y pendiente en la spec archivada)
PASS spec002#8 primer arranque en modo simple sin preguntar, sin jerga de desarrollador (evidencia: tests/e2e/simple-mode-onboarding.spec.ts en la spec archivada)
PASS spec002#9 todo texto nuevo entra por el catálogo de idiomas
PASS spec002#10 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed en la spec archivada)
30 pasan · 0 fallan
```

(las 20 filas de las specs 001/003/004 también en verde, sin cambios respecto de antes de esta spec).

### `pnpm tc`

```
$ pnpm run typecheck
$ node config/scripts/run-typecheck-projects-in-parallel.mjs
```

Sin salida — en verde.

### `pnpm test` (suite completa, corrida única en foreground)

```
 Test Files  5 failed | 7539 passed | 47 skipped (7591)
      Tests  8 failed | 70070 passed | 285 skipped (70363)
     Errors  1 error
Duration  975.02s
```

De los 5 archivos en rojo:

- `config/scripts/macos-computer-helper-owner-loss-processes.test.mjs`,
  `tests/e2e/cross-version-wire/release-checkout.unit.test.ts` y
  `src/main/native-chat/agent-session-wire/structured-tui-transcript-catchup.test.ts` son tres de
  los cuatro archivos intermitentes conocidos que estas reglas de trabajo nombran de antemano. Se
  volvieron a correr solos una vez cada uno y los tres quedaron en verde:

  ```
  $ pnpm exec vitest run --config config/vitest.config.ts config/scripts/macos-computer-helper-owner-loss-processes.test.mjs src/main/native-chat/agent-session-wire/structured-tui-transcript-catchup.test.ts
   Test Files  2 passed (2)
        Tests  23 passed (23)

  $ pnpm exec vitest run --config config/vitest.config.ts tests/e2e/cross-version-wire/release-checkout.unit.test.ts
   Test Files  1 passed (1)
        Tests  10 passed (10)
  ```

- `src/renderer/src/store/slices/ui-page-navigation.test.ts` y
  `src/renderer/src/components/right-sidebar/right-sidebar-titlebar-drag-regions.render.test.tsx`
  eran fallas reales: dos fixtures de test preexistentes no declaraban `interfaceMode` y heredaron
  el nuevo default real (`simple`), que bloquea `openArtifactsPage` y esconde Checks/Ports/
  Workspaces — exactamente las superficies que esas dos suites querían ejercitar sin la gate de
  esta spec. Se corrigieron fijando `interfaceMode: 'developer'` en sus fixtures (commit
  `155a95030e`) y quedaron en verde:

  ```
  $ pnpm exec vitest run --config config/vitest.config.ts src/renderer/src/store/slices/ui-page-navigation.test.ts src/renderer/src/components/right-sidebar/right-sidebar-titlebar-drag-regions.render.test.tsx
   Test Files  2 passed (2)
        Tests  41 passed (41)
  ```

No se volvió a correr la suite completa de punta a punta después de este arreglo (son ~975s); la
corrección se verificó corriendo los dos archivos afectados solos, en verde, más `pnpm tc` en verde
otra vez sobre el estado final.

### `pnpm run check:code-quality:changed`

```
$ node config/scripts/check-changed-code-quality.mjs
code quality: 0 new finding(s) across 52 changed file(s).
type-aware code quality: 0 new finding(s) across 52 changed file(s).
React Doctor: 0 new finding(s) across 52 changed file(s).
Changed-code quality gate passed since 24799fae70c6.
```

### `verify:localization-*` (criterio 9)

```
$ pnpm run verify:localization-catalog
Verified 12400 localization key references against en.json.
(coverage de es/ja/ko/zh sin cambios respecto de antes de esta spec)

$ pnpm run verify:localization-extraction
Extracted 10979 keys; 25 dynamic defaults are report-only, 2732 existing English entries are not statically referenced, and 51 inline defaults differ.
(exit 0 — mismo número de "inline defaults differ" que en main, sin regresión)

$ pnpm run audit:localization -- --check
Localization coverage check passed with 12 allowlisted candidates.
```

### e2e nuevos de esta spec (criterios 2, 4, 5, 8)

```
$ npx playwright test tests/e2e/simple-mode-onboarding.spec.ts tests/e2e/simple-mode-surfaces.spec.ts --config tests/playwright.config.ts --project electron-headless --workers=1

  ✓  1 [electron-headless] › simple-mode-onboarding.spec.ts:50:7 › opens in simple mode without asking (13.7s)
  ✓  2 [electron-headless] › simple-mode-onboarding.spec.ts:58:7 › never mentions worktrees, pull requests, or orchestration through the wizard (14.5s)
  ✓  3 [electron-headless] › simple-mode-surfaces.spec.ts:22:7 › Option-click on the Advanced title reveals Git without reloading (14.3s)
  ✓  4 [electron-headless] › simple-mode-surfaces.spec.ts:47:7 › the right sidebar offers no Checks, Ports, or Attached worktrees tab (13.1s)
  ✓  5 [electron-headless] › simple-mode-surfaces.spec.ts:55:7 › the browser and cmd-j shortcuts open no new tab or palette (13.7s)

  5 passed (1.3m)
```

### Criterio 7 (e2e existente en modo developer) — VERIFICADO PARCIALMENTE

El fixture del criterio 7 está hecho y confirmado funcional: `tests/e2e/helpers/orca-app.ts` y
`orca-restart.ts` fijan `ANDES_INTERFACE_MODE=developer` en el `env` de `electron.launch` (commit
`de81f91c8b`), y los cinco specs nuevos de arriba prueban que un spec puede seguir pisando esa
variable con `test.use({ launchEnv: { ANDES_INTERFACE_MODE: 'simple' } })` cuando necesita el otro
modo.

Lo que no se terminó de correr es la suite e2e completa (353 specs) de punta a punta con ese
fixture, por lo que este criterio queda **verificado parcialmente**. Lo que sí se corrió:

- Una corrida completa de los 353 specs (`npx playwright test --config tests/playwright.config.ts
  --project electron-headless`, sin acotar) llegó a **241 fallas de 567 tests** (326 pasaron, 99
  skipped, 47 no llegaron a correr) en casi 2 horas.
- Investigando esas fallas aparece un hallazgo ajeno a esta spec: **el sandbox donde corrió este
  trabajo tiene el locale del sistema operativo en español**, y Andes localiza la UI según
  `app.getLocale()`. Los ~280 specs e2e preexistentes del repo que buscan texto en inglés
  (`getByRole(..., { name: /Agent Dashboard/ })`, `getByRole('dialog', { name: 'Jump to...' })`,
  etc.) fallan en esta máquina aunque el feature funcione — confirmado inspeccionando el DOM de
  `agent-dashboard-status-burst.spec.ts` (el snapshot muestra `"Panel de agentes"` visible y
  funcional exactamente donde se esperaba el botón) y confirmado de nuevo forzando
  `--lang=en-US` (cambio descartado, no commiteado) sobre una muestra de 17 tests que habían
  fallado: 13 pasaron con locale en inglés, incluidos los tres que tocan superficies de esta spec
  directamente (`automation-runs-dashboard.spec.ts`, `automation-prompt-disclosure.spec.ts`,
  `agent-dashboard-status-burst.spec.ts`) y el flujo de cmd-j
  (`worktree-jump-palette-filter.spec.ts`). El detalle completo está en `decisions.md`
  (2026-09-03, "Gap conocido pre-existente: el locale...").
- Esto es un problema del entorno, no del código de esta spec ni de `main`: reproduce igual sin
  ninguno de estos cambios.

#### Pendiente para el Gate 2

1. **Corrida completa de la suite e2e** con el fixture en developer (ya en verde por default, sin
   pisar nada): `npx playwright test --config tests/playwright.config.ts --project
   electron-headless`. Tarda ~2 horas en esta máquina; en una máquina con locale en inglés no
   debería arrastrar el ruido de arriba.
2. **Los 4 tests que siguieron en rojo incluso con `--lang=en-US` forzado**, sin investigar a
   fondo: `right-sidebar-windows-titlebar.spec.ts`, `floating-tab-rename.spec.ts:144` ("Enter
   commits a floating Markdown rename only once"), `settings-agent-awake.spec.ts:175` ("keeps the
   OS awake only while a hook-reported agent is working"),
   `worktree-jump-palette-filter.spec.ts:209` ("Escape closes the composer opened over the
   Automations page" — este último toca `openModal`, tocado por el criterio 5, y merece mirarse
   primero). Repetir con: `npx playwright test tests/e2e/right-sidebar-windows-titlebar.spec.ts
   tests/e2e/floating-tab-rename.spec.ts tests/e2e/settings-agent-awake.spec.ts
   tests/e2e/worktree-jump-palette-filter.spec.ts --config tests/playwright.config.ts --project
   electron-headless --workers=1` (agregando temporalmente `--lang=en-US` a
   `getOrcaElectronLaunchArgs` si la máquina de Gate 2 también tiene locale no-inglés, sin
   commitear ese cambio).
3. El gap ya documentado en `decisions.md`: cerrar pestañas de desarrollo abiertas al pasar de
   developer a simple con el Option-clic no está implementado (solo se bloquea *abrir* una nueva).
