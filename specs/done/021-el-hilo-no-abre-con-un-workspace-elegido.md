---
status: implementada
depends_on: []
---

# 021 · El hilo no abre con un workspace elegido

Con un workspace elegido en el selector, "New thread" no abre nada: el panel queda en blanco. Con
"My work" el mismo botón abre la conversación. Esta spec encuentra la causa y la arregla.

**Tipo**: feature · **Flujo**: design-first — la causa no se conoce, así que el primer paso es el
diagnóstico, no construir.

## Estado previo

`main` en `c817a4a6b0`. El agente corre `git log c817a4a6b0..main --stat` antes de empezar.

Lo encontró el chequeo funcional de la spec 009 el 2026-09-04, y **no es de esa rama**: el mismo
botón "New thread" de la barra lateral, sin código de la 009 en el camino del clic, hace lo mismo.
La superficie del hilo la dejaron las specs 010 y 019.

Las dos capturas que lo prueban están en la rama `spec-009-command-center`, en
`docs/research/2026-09-04-chequeo-funcional-spec-009/`:

- `06-comparacion-new-thread-alcance-root-pinta.png` — con "My work": aparece la pestaña, el título
  del alcance, "Start a chat with Claude" y el campo para escribir.
- `07-comparacion-new-thread-alcance-workspace-en-blanco.png` — con "Tandem Pay": el panel está
  vacío y en la barra de pestañas no hay ninguna pestaña.

Lo que la 009 dejó anotado sobre el síntoma, y hay que confirmar antes de creerlo: el árbol del
documento sí tendría la conversación —"Start a chat with Claude" y el rótulo de alcance "Tandem
Pay"— pero no se dibuja nada. Las dos observaciones no coinciden del todo: la captura no muestra
pestaña. **El diagnóstico decide cuál de las dos es la verdadera.**

El camino del clic, para empezar a mirar:

- `SimpleModeNav.tsx:69` llama a `openNewThread()`.
- `open-new-thread.ts:92-105` captura el alcance con `resolveActiveWorkspaceScope`, arma el primer
  mensaje con `buildThreadScopeStartupMessage(threadScope)` y llama a `launchAgentInNewTab`.
- `launch-agent-in-new-tab.ts:213-218` crea la pestaña con `store.createTab`, pasándole
  `threadScope` solo si lo recibió.
- `ThreadScopeBadge.tsx:36-51` dibuja el rótulo del alcance arriba de la conversación.

Los evals de la spec 019 pasan (`spec019#1` a `spec019#14`), y verifican el armado del mensaje, el
alcance estampado en la pestaña y el rótulo. Es decir: **lo que la 019 mide está bien**, y el fallo
está en algo que ningún eval mira.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | La causa está identificada y escrita con `archivo:línea`, no descrita en general | La spec archivada nombra el archivo y la línea, y explica por qué la raíz sí funciona y un workspace no |
| 2 | Existe una prueba que **falla antes del arreglo y pasa después** | Se corre sobre `c817a4a6b0` y falla; se corre sobre la rama y pasa. Las dos corridas, pegadas en la Evidencia |
| 3 | Con un workspace elegido, "New thread" abre la conversación: aparece la pestaña, el rótulo del alcance y el campo para escribir | e2e con un workspace elegido: los tres elementos presentes |
| 4 | Con "My work" no cambia nada | e2e de la raíz, el que ya existe, en verde |
| 5 | El alcance del hilo sigue siendo el del selector al momento de crearlo | Los catorce evals de la spec 019 en verde |
| 6 | El fallo no puede volver sin que algo se ponga rojo | La prueba del criterio 2 queda en la suite, no en un archivo suelto |
| 7 | Código sano | `pnpm tc` · `check:code-quality:changed` · `verify:localization-*` en verde |
| 8 | Chequeo funcional en la app real | El recorrido completo con un workspace elegido, una captura por paso, en `docs/research/` |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (2026-09-04): esto va a spec propia y no se arregla desde la rama de la 009.
  El motivo: la 009 solo puede llevar lo suyo, y el defecto es de `main`.

**Delegadas al agente, con criterio**

- Dónde va el arreglo. Criterio: donde esté la causa, aunque sea código heredado de Orca. No se
  parchea en la pantalla nueva lo que está roto abajo.
- Si el diagnóstico destapa más de un defecto. Criterio: arregla el que deja el panel en blanco y
  declara los otros; no los arrastra a esta spec.

**Condiciones de parada**

- Si la causa está en la capa que lanza el binario del agente o en la del inicio de sesión, para y
  pregunta: esa capa no se toca (regla cerrada en `def-007`).
- Si arreglarlo obliga a cambiar el alcance que la spec 019 estampa en la pestaña, para y pregunta.
- Si el panel en blanco resulta ser dos defectos distintos con causas distintas, para y reporta
  antes de arreglar ninguno.

## Efectos que escapan del sistema

Ninguno.

## Fuera de alcance, con condición de reactivación

- Que Andes nunca escribe `tree.md` —una carpeta que Andes prepara escanea cero nodos—, hallazgo de
  la spec 009: es del onboarding. Se reactiva cuando alguien prepare una carpeta desde la app y
  espere ver algo.
- La colisión entre `tests/e2e/simple-mode-workspaces-and-files.spec.ts:17` y el sembrador de la
  spec 019 cuando corren en el mismo worker: se reactiva cuando la suite completa tenga que estar
  verde de punta a punta.

## Diagnóstico

**La contradicción se resolvió a favor del pintado.** Con el panel en blanco, el store tiene la
pestaña, su grupo y su alcance, y `document.body.innerText` trae el rótulo del alcance y "Start a
chat with Claude". El elemento del panel mide 0x0 con `display: flex`. La tira de pestañas vacía y
el panel en blanco no son dos hallazgos: son las dos caras del mismo defecto.

**Causa** — `src/renderer/src/components/terminal/split-group-mount.ts:14` sobre `632c0be2da`:
`if (layout) { return layout }`, dentro de `getEffectiveLayoutForWorktree`.

`getEffectiveLayoutForWorktree` devolvía el layout explícito sin comprobar que sus grupos
existieran. `layoutByWorktree` y `groupsByWorktree` los escriben acciones distintas y quedan en
desacuerdo:

1. `ensureWorktreeRootGroup`, al abrir la carpeta, escribe el grupo `G1`, `activeGroupIdByWorktree`
   y `layoutByWorktree = leaf(G1)`.
2. `hydrateTabsSession` limpia `groupsByWorktree` cuando la sesión persistida no trae pestañas; el
   layout sobrevive.
3. `createTab` (`src/renderer/src/store/terminals/terminal-tab-creation.ts:139`) llama a
   `ensureGroup`, que **ignora el id preferido cuando la lista de grupos está vacía**
   (`src/renderer/src/store/slices/tab-group-state.ts:74`) y acuña `G2`. Y conserva el layout viejo:
   `layoutByWorktree[worktreeId] ?? { type: 'leaf', groupId: group.id }`
   (`terminal-tab-creation.ts:241`).

Queda `layout = leaf(G1)` y `groups = [G2]`. La hoja muerta dibuja la tira de pestañas de `G1`, que
no tiene pestañas, y la superposición del panel —anclada con
`position-anchor: --orca-tab-group-body-<G2 en hexadecimal>` al cuerpo de `G2`, que nunca se
dibuja— colapsa a 0x0 sin ningún error en consola.

Medido en la app real, `main` en `632c0be2da`:

```
02 carpeta abierta   layout={leaf: cf7becda}  groups={}
05 New thread        layout={leaf: cf7becda}  groups={ea98ea72}  panel=0x0  innerText="Start a chat with Claude"
```

**Por qué la raíz sí y un workspace no**: no es el alcance. `threadScope` solo viaja al primer
mensaje y al rótulo; no aparece en ningún punto del camino que dibuja el panel. El chequeo
funcional lo reprodujo con "My work" elegido, y el eval `spec019#11` —que abre un hilo con un
workspace elegido— pasaba en verde sobre `main` roto. Lo que decide es el orden en que terminan
`hydrateTabsSession` y `ensureWorktreeRootGroup` después de abrir la carpeta. La captura
`07-comparacion-new-thread-alcance-workspace-en-blanco.png` de la spec 009 quedó del lado del
workspace por el orden de la comparación. Está escrito como decisión en `decisions.md`.

**El arreglo** — `split-group-mount.ts:23-33` en la rama: el layout explícito se poda contra los grupos que
existen antes de devolverlo (`pruneTabGroupLayoutForGroups`, que ya existía para la hidratación).
Una hoja muerta cae al grupo activo; en un split se conserva la mitad viva. Si no queda ningún
grupo vivo, la función devuelve lo mismo que devolvía antes, para que un worktree a medio hidratar
no desmonte el contenedor de paneles.

Se eligió la capa de render y no la de escritura porque es la única por la que pasan todos los
caminos (`use-terminal-workspace-projection`, `anyMountedWorktreeHasLayout`,
`TerminalSplitWorkspaceSurfaces`) y porque repara también un estado ya persistido.

**Ninguna condición de parada se disparó**: la causa no está en la capa que lanza el binario del
agente ni en la del inicio de sesión, el arreglo no toca el alcance que la spec 019 estampa en la
pestaña, y el panel en blanco resultó ser un solo defecto.

**Defectos destapados y no arreglados acá** (criterio delegado "arregla el que deja el panel en
blanco y declara los otros"):

- `ensureGroup` (`src/renderer/src/store/slices/tab-group-state.ts:74`) descarta el
  `preferredGroupId` cuando la lista de grupos está vacía, en vez de revivir ese id. Es el origen
  del desacuerdo, no su consecuencia.
- `hydrateTabsSession` puede limpiar `groupsByWorktree` dejando `layoutByWorktree` en pie. Nada
  garantiza que los dos se escriban juntos.

## Evidencia

Rama `spec-021-hilo-no-abre`, worktree `andes-wt-spec-021`, sobre `main` en `632c0be2da`.

### Criterio 1 — la causa con archivo:línea

Escrita arriba, en "Diagnóstico": `split-group-mount.ts:14` sobre `632c0be2da`, con las tres acciones que producen el
desacuerdo y la medición en la app real.

### Criterio 2 — la prueba que falla antes y pasa después

Sobre `632c0be2da` (con `src/renderer/src/components/terminal/split-group-mount.ts` en su versión
de `main`):

```
$ npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/terminal/split-group-mount-stale-group.test.ts

 FAIL  spec021#3 keeps the live half of a split and drops the dead one
 AssertionError: expected { type: 'split', ... } to deeply equal { type: 'leaf', ... }

 Test Files  1 failed (1)
      Tests  3 failed | 2 passed (5)
```

Sobre la rama:

```
$ npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/terminal/split-group-mount-stale-group.test.ts \
    src/renderer/src/components/terminal/split-group-mount.test.ts

 Test Files  2 passed (2)
      Tests  14 passed (14)
```

### Criterios 3 y 4 — el hilo abre, con un workspace y con la raíz

```
$ pnpm run test:e2e tests/e2e/simple-mode-thread-opens-with-workspace.spec.ts --workers=1

  ✓  spec021#6 a workspace selected: the thread paints its tab, its scope and its composer (22.9s)
  ✓  spec021#7 the root keeps working the same way (1.2s)

  2 passed (32.3s)
```

Las aserciones miden `getBoundingClientRect` del panel, no presencia: el panel en blanco tenía la
conversación entera en el árbol y `toBeVisible()` habría pasado igual. **Este e2e pasa también
sobre `632c0be2da`**: en el arnés de e2e el desacuerdo se repara solo entre la siembra y la
aserción. Es una guardia de presencia; la prueba que separa las dos versiones es la unitaria del
criterio 2.

### Criterio 5 — el alcance del hilo intacto

Los catorce evals de la spec 019, en verde dentro de la corrida completa de `evals/run.sh` (abajo).

```
$ pnpm run test:e2e tests/e2e/simple-mode-thread-inherits-scope.spec.ts --workers=1

  ✓  spec019#10 root selected: the thread launches naming the root, never a question (2.6s)
  ✓  spec019#11 a workspace selected: the thread launches naming that workspace, never a question (1.7s)
  ✓  spec019#12 switching the selector after a thread opens does not change that thread's badge (1.4s)

  3 passed (16.8s)
```

### Criterio 6 — el fallo no puede volver en silencio

`src/renderer/src/components/terminal/split-group-mount-stale-group.test.ts` está en la suite y en
`evals/run.sh` (`spec021_criterio1_2_5_6_capa_de_render`).

```
$ bash evals/run.sh
141 pasan · 0 fallan          # dos corridas seguidas, ambas iguales
```

### Criterio 7 — código sano

```
$ pnpm tc                                 # sin salida: en verde
$ pnpm run check:code-quality:changed
code quality: 0 new finding(s) across 206 changed file(s).
type-aware code quality: 0 new finding(s) across 206 changed file(s).
React Doctor: 0 new finding(s) across 206 changed file(s).
Changed-code quality gate passed since d97c8cc07c5a.

$ pnpm run verify:localization-catalog
Verified 12530 localization key references against en.json.
$ pnpm run verify:localization-extraction
Extracted 11107 keys; 25 dynamic defaults are report-only, ...
$ pnpm run verify:localization-coverage
Localization coverage check passed with 12 allowlisted candidates.
```

Suite unitaria completa: `7566 passed | 5 failed`. Los cinco archivos rojos son de `main` y fallan
igual sobre `632c0be2da` con el árbol limpio:
`src/renderer/src/store/slices/repos-onboarding-folder-startup.test.ts`,
`src/renderer/src/components/onboarding/onboarding-folder-agent-startup.test.ts`,
`src/renderer/src/components/sidebar/Sidebar.test.tsx`,
`src/main/native-chat/agent-session-wire/structured-tui-transcript-catchup.test.ts` (3 archivos, 8
fallos, idénticos con y sin la rama) y
`config/scripts/macos-computer-helper-owner-loss-processes.test.mjs`, que aislado pasa 21/21.

### Criterio 8 — chequeo funcional en la app real

`docs/research/2026-09-04-chequeo-funcional-spec-021/`, ocho capturas. App levantada con
`pnpm dev` sobre una copia del vault de demostración, manejada por
`chromium.connectOverCDP` — sin tocar la ventana, como pide el gotcha de la spec 019.

| Captura | Qué muestra |
|---|---|
| `00-antes-del-arreglo-panel-en-blanco.png` | Sobre `632c0be2da`, con el layout apuntando a un grupo muerto: panel en blanco, sin pestaña. Panel medido: 0x0. La conversación, en el árbol |
| `01-app-abierta-sin-carpeta.png` | Punto de partida |
| `02-carpeta-abierta-alcance-my-work.png` | Carpeta abierta. `layout={leaf: cf7becda}` · `groups={}` — el desacuerdo ya está |
| `03-selector-abierto.png` | El selector con "Tandem Pay" |
| `04-alcance-tandem-pay-elegido.png` | Alcance elegido |
| `05-new-thread-con-workspace-pinta.png` | **New thread con Tandem Pay**: pestaña "Terminal 1", rótulo "Tandem Pay", "Start a chat with Claude" y el campo para escribir. Panel medido: 839x787, con `layout={leaf: cf7becda}` y `groups={ea98ea72}` — el mismo desacuerdo de la captura 02 |
| `06-layout-apuntando-a-un-grupo-muerto-sigue-pintando.png` | El layout forzado a un grupo inexistente: sigue pintando, 839x787 |
| `07-new-thread-con-my-work-pinta.png` | Vuelta a "My work" y otro hilo: dos pestañas, rótulo "My work", 839x787 |
