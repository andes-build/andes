---
status: pendiente
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

`main` en `e76ce38ee6` (spec 001 mergeada). Depende de la spec 004 (sin oferta de Linear), que toca los mismos constructores de navegación:
se implementa sobre `main` con la 004 ya mergeada. El agente corre `git log e76ce38ee6..main --stat` antes de empezar.

- Las secciones de Ajustes se arman en cuatro constructores —`src/renderer/src/hooks/settings-navigation-{capability,interface,remote,workflow}-sections.ts`— a partir de `SettingsNavigationBuildOptions` (`settings-navigation-build-options.ts`: `isMac`, `isWebClient`, `isDev`, `isLinearConnected`, `repos`…). Ya hay secciones condicionales: `linear` solo si `isLinearConnected` (`settings-navigation-capability-sections.ts:77-80`). Los ids válidos están en `SETTINGS_NAV_TARGETS` (`src/renderer/src/lib/settings-navigation-types.ts:15-45`).
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
| 7 | El modo developer no tiene regresión: la suite e2e existente corre con `interfaceMode: 'developer'` fijado en el fixture de arranque y pasa igual que en `main` | `pnpm test:e2e` (o el script equivalente del repo) en verde con el fixture; diff del fixture visible en el PR |
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
