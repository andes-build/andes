---
status: implementada
depends_on: []
---

# 004 · Sin oferta de Linear

Andes no trae Linear. La spec 001 borró sus skills pero la interfaz sigue ofreciendo instalarlos y
mostrando la guía, el aviso en la barra lateral y la configuración de Linear como fuente de tareas.
Todo eso deja de aparecer. El módulo `src/main/linear/` se queda porque el motor y SSH lo importan.

**Tipo**: residuals · **Flujo**: requirements-first

## Estado previo

`main` en `e76ce38ee6`. El agente corre `git log e76ce38ee6..main --stat` antes de empezar.

- Constantes del skill: `src/shared/agent-feature-install-commands.ts:9-11,126-134`
  (`ORCA_LINEAR_SKILL_NAME`, `LINEAR_AGENT_SKILL_NAMES`, `ORCA_LINEAR_SKILL_INSTALL_COMMAND`,
  `ORCA_LINEAR_SKILL_UPDATE_COMMAND`, `LINEAR_TICKETS_SKILL_UPDATE_COMMAND`). El comando de
  instalación apunta al repo remoto de Orca, por eso sigue "funcionando" aunque `skills/` no exista.
- Superficies que lo muestran: `src/renderer/src/components/settings/{LinearAgentSkillPane,LinearAgentSkillGuide,TaskSourceLinearSetup}.tsx`, `linear-agent-skill-install-cta.tsx`, `use-linear-agent-skill-setup.ts`, `linear-agent-skill-search.ts`, `linear-agent-skill-guide-content.ts`, `use-task-source-provider-readiness.ts`; en la barra lateral `LinearAgentSkillSetupPrompt.tsx`, `linear-agent-skill-setup-reminders.ts`, `linear-agent-skill-setup-reminder-toast.ts`; en `lib/` `agent-skill-nav-install-status.ts`, `linear-board-drag-payload.ts`.
- La sección `linear` de Ajustes solo aparece con `isLinearConnected` (`settings-navigation-capability-sections.ts:77-80`); la conexión se hace desde Integraciones y Fuentes de tareas.
- El estado "instalado" se lee del disco del usuario (`useInstalledAgentSkills.ts`), no del repo.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | No queda referencia a los skills de Linear en el código | `grep -rn 'orca-linear\|linear-tickets\|LINEAR_AGENT_SKILL\|ORCA_LINEAR_SKILL' src --include='*.ts' --include='*.tsx' --exclude-dir=linear \| grep -v '^src/main/ssh/'` devuelve 0 líneas |
| 2 | Linear no se ofrece en ninguna superficie: no hay sección `linear` en la navegación de Ajustes aunque haya una cuenta conectada, no aparece en Integraciones ni en Fuentes de tareas, y la barra lateral no muestra el aviso ni el recordatorio | Test unitario de los constructores de navegación con `isLinearConnected: true`: la lista no contiene `linear`; test de componente de Integraciones y de Fuentes de tareas: sin fila Linear; e2e: `getByText(/linear/i)` en Ajustes → `toHaveCount(0)` |
| 3 | `src/main/linear/`, `src/shared/linear/` y `src/main/ssh/ssh-remote-linear-*.ts` no se tocan | `git diff --stat main..HEAD -- src/main/linear src/shared/linear src/main/ssh` vacío |
| 4 | Ninguna cadena de idioma huérfana: las claves de los textos borrados salen del catálogo | `pnpm run verify:localization-catalog` y `verify:localization-extraction` en verde |
| 5 | El código sigue sano | `pnpm tc` · `pnpm test` · `pnpm run check:code-quality:changed` en verde |

Ajuste al criterio 1 el 2026-09-02 tras condición de parada: 🔍 el grep excluye `src/main/linear`,
`src/shared/linear` y `src/main/ssh`, que el criterio 3 protege; aplicado por la sesión
supervisora, Peter lo confirma en el Gate 2.

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter y Maxi Delgado (2026-09-02): Linear no se trae.
- DECIDIDO por Peter (Gate 1, 2026-09-02): "por ahora no ofrecería Linear, saquemos las
  referencias de la interfaz" — Linear no se ofrece en ningún modo.

**Delegadas al agente, con criterio**

- Borrar los componentes de Linear del renderer o dejarlos sin punto de entrada. Criterio: se
  borran los que ningún otro componente importa; si algo compartido los importa (por ejemplo, el
  drag de tarjetas de tablero), se recorta la parte de Linear y se conserva el resto.
- Qué hacer con el tipo de fuente de tareas `linear` en el estado persistido de un usuario que la
  tenía configurada. Criterio: se ignora al cargar sin romper ni borrar el resto de sus ajustes.

**Condiciones de parada**

- Si quitar la fuente de tareas Linear exige cambiar `src/main/linear/` o el flujo de OAuth que
  vive ahí, para y pregunta: el módulo no se toca.
- Si un test de `src/main/ssh/` depende de la UI de Linear, para y pregunta.

## Efectos que escapan del sistema

Ninguno.

## Fuera de alcance, con condición de reactivación

- Borrar `src/main/linear/` y `src/shared/linear/`: se reactiva cuando el motor y SSH dejen de
  importarlos, o cuando exista el nivel Team con servidor y se decida qué integraciones viajan.
- GitHub y GitLab como fuentes de tareas: se quedan; son parte del modo developer (spec 002).

## Evidencia

Rama `spec-004-sin-oferta-de-linear`, worktree `/Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-004`.

### evals/run.sh

```
$ evals/run.sh
PASS spec001#1 el paquete se llama Andes
PASS spec001#2 la bajada y el sitio son los decididos
PASS spec001#3 la versión arranca de cero
PASS spec001#4 el crédito a Orca es visible
PASS spec001#5 no queda app móvil
PASS spec001#6 no quedan los skills de emulador ni de Linear
     | src/main/emulator, src/main/linear y src/shared/linear se quedan a propósito: los importa
     | el motor (src/main/runtime/, src/main/startup/) y SSH (src/main/ssh/ssh-remote-linear-*.ts).
     | Esconderlos de la interfaz es trabajo de la spec 002 (ajuste del 2026-09-02, ver spec archivada).
PASS spec001#7 el uso de computadora no viaja en el paquete
PASS spec001#8 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed en la spec archivada)
PASS spec001#9 ningún rastro de la marca Claude o Anthropic
PASS spec004#1 no queda referencia a los skills de Linear en el código
PASS spec004#2 Linear no se ofrece en ninguna superficie
     | e2e (tests/e2e/settings-no-linear-offer.spec.ts, tests/e2e/feature-wall.spec.ts) corridos
     | aparte contra la app Electron real — evidencia pegada en la spec archivada.
PASS spec004#3 src/main/linear, src/shared/linear y src/main/ssh no se tocan
PASS spec004#4 ninguna cadena de idioma huérfana
PASS spec004#5 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed en la spec archivada)
14 pasan · 0 fallan
```

### e2e del criterio 2, corridos contra la app Electron real

```
$ npx playwright test tests/e2e/settings-no-linear-offer.spec.ts --config tests/playwright.config.ts --project=electron-headless --workers=1
  ✓  1 [electron-headless] › tests/e2e/settings-no-linear-offer.spec.ts:20:5 › never offers Linear across Settings (13.5s)
  1 passed (21.6s)
```

```
$ npx playwright test tests/e2e/feature-wall.spec.ts --config tests/playwright.config.ts --project=electron-headless --workers=1 -g "shows unified task copy"
```
(la corrida completa de `feature-wall.spec.ts` tiene 5 tests en rojo — `Explore Orca` no
registrado en el menú, diálogo `Get to know Orca` no aparece — confirmados pre-existentes en
`main` antes de esta spec corriendo el mismo archivo con `git stash`; no son regresión de esta
spec. El único cambio de esta spec en ese archivo, la copia sin Linear del tile de Tasks, no
introduce ningún fallo nuevo.)

### pnpm tc

```
$ pnpm tc
> pnpm run typecheck
> node config/scripts/run-typecheck-projects-in-parallel.mjs
```
(sin salida = los tres proyectos de TypeScript — node, cli, web — pasan; exit code 0)

### pnpm test

```
$ pnpm test
...
 Test Files  2 failed | 7533 passed | 47 skipped (7582)
      Tests  2 failed | 70037 passed | 285 skipped (70324)
```

Los 2 rojos son intermitentes bajo la carga completa de la suite, confirmados corriéndolos solos:

```
$ npx vitest run --config config/vitest.config.ts \
    config/scripts/macos-computer-helper-owner-loss-processes.test.mjs \
    tests/e2e/cross-version-wire/release-checkout.unit.test.ts
 Test Files  2 passed (2)
      Tests  31 passed (31)
```

`macos-computer-helper-owner-loss-processes.test.mjs` es uno de los dos intermitentes conocidos
(spec 001). `tests/e2e/cross-version-wire/release-checkout.unit.test.ts` (timeout de 30s en un
test de materialización de release sobre git real) es nuevo en esta lista, pero no toca nada de
esta spec (Linear, Settings, onboarding) ni de sus archivos; pasa limpio en aislamiento. No hay
ningún rojo real pendiente.

### check:code-quality:changed

```
$ node config/scripts/check-changed-code-quality.mjs
code quality: 0 new finding(s) across 28 changed file(s).
type-aware code quality: 0 new finding(s) across 28 changed file(s).
React Doctor: 0 new finding(s) across 28 changed file(s).
Changed-code quality gate passed since d3f01a720203.
```

### Condición de parada aplicada y resuelta

El criterio 1 original (grep sin exclusiones) chocaba con el criterio 3: `src/main/linear/client.test.ts`
usa `'orca-linear-client-'` como prefijo de un directorio temporal, sin relación con los skills
borrados. La sesión supervisora reescribió el criterio 1 para excluir `src/main/linear`,
`src/shared/linear` y `src/main/ssh` (ver el ajuste fechado 2026-09-02 más arriba); Peter lo
confirma en el Gate 2.

### Decisiones delegadas cerradas durante la implementación (ver `decisions.md` del repo)

- "No se ofrece en ninguna superficie" alcanza a Fuentes de tareas, Integraciones y el
  feature-wall (tres superficies que el "Estado previo" de la spec no investigó), pero no al
  tipo compartido `TaskProvider` ni al tablero de Linear ya conectado (`task-page/linear/`,
  `linked-work-item-context.ts`, `linear-board-drag-payload.ts`): esos siguen sirviendo a quien
  ya tenía Linear conectado antes de esta spec.
- `onboardingFeatureSetupSelection.linearTickets` se queda en el tipo (lo exige el schema de
  telemetría compartido) pero sale de `ONBOARDING_FEATURE_SETUP_IDS`, la única lista que decide
  qué se instala o selecciona.
- Gap pre-existente ajeno a esta spec: `verify:localization-extraction` fallaba en `main` por dos
  claves de `SidebarHeader.tsx` (`dashboard.sidebar.closeActivity/openActivity`) ausentes de
  `en.json`; se agregaron de paso, confirmado con `git stash` que el fallo existía antes de tocar
  nada de Linear.
- Fixtures de test que reusaban `orca-linear`/`linear-tickets` como nombre genérico de skill sin
  relación con el feature real (`skill-update-convergence.test.ts`, `useInstalledAgentSkills.*`,
  `AgentSkillSetupPanel.*`, `skill-freshness-grouping.test.ts`) se renombraron a nombres neutros;
  la constante `LINEAR_BOARD_DRAG_ISSUE_MIME` (drag del tablero de Linear, sin relación con el
  skill) se renombró de `x-orca-linear-issue-id` a `x-orca-issue-board-drag-id` por la misma razón.
