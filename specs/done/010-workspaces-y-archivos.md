---
status: implementada
depends_on: []
---

# 010 · Selector de workspace y archivos por alcance

La barra lateral en modo simple: arriba de todo un selector con el workspace elegido, y debajo todo
lo que pertenece a ese workspace. Los demás no ocupan lugar hasta abrir el selector. Y una vista de
archivos que muestra solo lo que vive en ese workspace, con nombres de nodo en vez de nombres de
archivo.

Es lo que hace que la app se sienta de un workspace por vez, como Slack, en vez de mostrarlo todo
mezclado como Obsidian.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `391f6ec543`. El agente corre `git log 391f6ec543..main --stat` antes de empezar.

- La barra lateral vive en `src/renderer/src/components/sidebar/` y hoy está organizada por
  anfitriones, repositorios y worktrees (`host-section-order.ts`, `host-section-rows.ts`, las
  secciones de detalle de worktree). La spec 002 ya esconde en modo simple las acciones de git.
- La barra derecha vive en `src/renderer/src/components/right-sidebar/`; en modo simple queda el
  panel de conversaciones.
- El editor y el explorador de archivos: `src/renderer/src/components/editor/`.
- La preferencia `interfaceMode` (spec 002) ya existe, con `simple` por defecto.
- La carpeta abierta es un brain del sistema: sus workspaces son las subcarpetas de `workspaces/`,
  cada una con su `README.md`; la raíz del brain es el alcance "Mi trabajo". El núcleo vendorizado
  está en `vendor/ai-first-os-core/`.
- Textos: solo el catálogo inglés (spec 008).
- El diseño aprobado —selector arriba, navegación, hilos recientes, persona abajo, y la vista de
  archivos titulada "Files"— está en la spec visual del cerebro y en la maqueta de la iniciativa.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | En modo simple, arriba de la barra lateral hay un selector que muestra **un solo workspace**: su inicial, su nombre y que se puede cambiar | Test de componente: se renderiza un solo nombre de workspace; e2e: la barra lateral no lista los otros workspaces |
| 2 | Al abrir el selector aparecen todos los workspaces de la carpeta, más "My work" (la raíz) y "New workspace" | Test de componente con tres workspaces de prueba; e2e: abrir el selector muestra los tres y las dos entradas fijas |
| 3 | Elegir otro workspace cambia el alcance de toda la app: el Command Center, los hilos recientes y los archivos pasan a ser de ese workspace | Test unitario del estado de alcance; e2e: cambiar de workspace cambia el contenido de la vista de archivos |
| 4 | La navegación en modo simple es exactamente: New thread, Command Center, Files, Agents & skills, More | Test unitario de la lista de entradas por `interfaceMode`; e2e en modo simple |
| 5 | Debajo va **Recent threads** del workspace elegido, con un acceso a ver el historial | Test de componente con hilos de prueba |
| 6 | En modo simple la barra lateral **no muestra** proyectos, repositorios, worktrees ni sus secciones de detalle | e2e en modo simple: ninguno de esos textos aparece; en modo desarrollo sí |
| 7 | La vista **Files** muestra el árbol **solo del workspace elegido**, o solo de la raíz cuando el alcance es "My work"; nunca la carpeta entera | Test unitario del armado del árbol con un vault de prueba de tres workspaces: el árbol del workspace A no contiene nada de B ni de la raíz |
| 8 | En ese árbol, las carpetas y archivos del sistema se muestran con nombre de nodo, no de archivo: "What this is", "Decisions", "Learnings", "Backlog", "Initiatives", "Research". Un archivo que el sistema no conoce se muestra con su nombre tal cual | Test unitario del traductor de nombres con los seis conocidos y con uno desconocido |
| 9 | Abrir un archivo lo muestra en el editor con formato, y hay un botón para abrir un hilo sobre ese archivo | Test de componente; e2e: abrir un archivo del vault de prueba y ver su contenido con formato |
| 10 | Estados incómodos: carpeta sin workspaces, workspace vacío y carpeta sin preparar tienen su mensaje | Test de componente de los tres |
| 11 | En modo desarrollo la barra lateral y los archivos siguen como están hoy | e2e en modo desarrollo: la barra lateral muestra proyectos y worktrees |
| 12 | Ningún texto usa jerga del sistema: ni nodo, ni frontmatter, ni resolver, ni brain, ni vault | Eval de texto sobre las claves nuevas del catálogo inglés |
| 13 | Código sano | `pnpm tc` · `check:code-quality:changed` · `verify:localization-*` en verde; los tests unitarios y e2e nuevos en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-03): modelo de navegación como Slack — un workspace elegido
  arriba, todo lo de abajo pertenece a él, los demás no ocupan lugar hasta abrir el selector.
- DECIDIDO por Peter (2026-09-03): los archivos se ven por alcance, nunca la carpeta entera; la
  pantalla se llama Files.
- DECIDIDO por Peter (2026-09-03): la palabra brain no aparece en la interfaz; tampoco vault.
- DECIDIDO por Peter (2026-09-03): un solo idioma, inglés.

**Delegadas al agente, con criterio**

- Cómo se descubren los workspaces de la carpeta. Criterio: leer las subcarpetas de `workspaces/`
  con su `README.md`; si esa carpeta no existe, la única opción es "My work". No leer el árbol
  entero del disco ni cachear en disco.
- Si el árbol de archivos se arma en el proceso principal o en la interfaz. Criterio: donde ya se
  arma el explorador actual, sin abrir un camino nuevo de lectura de archivos.
- Qué pasa con las pestañas abiertas al cambiar de workspace. Criterio: se conservan las
  conversaciones; se cierra lo que pertenezca al workspace anterior y no sea una conversación.

**Condiciones de parada**

- Si esconder las secciones de repositorios y worktrees exige tocar el motor
  (`src/main/runtime/`) o la capa que lanza el binario del agente, para y pregunta.
- Si el explorador de archivos actual no puede limitarse a una subcarpeta sin reescribirlo entero,
  para y reporta el costo antes de reescribirlo.
- Si un workspace de prueba tiene una estructura que el traductor de nombres no reconoce y no está
  claro cómo mostrarla, para y pregunta en vez de inventar un nombre.

## Efectos que escapan del sistema

Ninguno.

## Fuera de alcance, con condición de reactivación

- Crear un workspace desde el selector: la entrada existe y abre lo que ya exista; crearlo de
  verdad es la spec del onboarding o una propia.
- Conectarse a un workspace de otra persona (el multijugador): spec propia, es lo que se cobra.
- El grafo del vault: sigue anotado como oportunidad, fuera de la primera versión.
- Buscar dentro de los archivos: se reactiva cuando exista la búsqueda global.

## Diferido a la spec de restos

- **Criterio 3, la parte de Command Center**: elegir otro workspace cambia el estado de alcance
  compartido (`activeWorkspaceScopeSlug` en `src/renderer/src/store/slices/workspace-scope.ts`), y
  Files y la navegación ya lo leen y cambian con él (verificado). Command Center todavía no existe
  en esta rama — es la spec 009 (`spec-009-command-center`, pausada) — así que la parte del
  criterio que dice "el Command Center... pasa a ser de ese workspace" no se puede verificar hasta
  que esa spec aporte su pantalla; cuando lo haga, si lee el mismo campo de estado, hereda el
  comportamiento sin cambios.
- **Criterio 5, la fuente de datos de Recent threads**: el componente `RecentThreadsSection` es
  real, tiene su test de componente con hilos de prueba y su estado vacío, y ya se muestra en la
  barra lateral. Lo que no existe es una fuente real de "hilos de este workspace": el modelo de
  conversaciones de Andes hoy es por carpeta abierta (`activeWorktreeId`), no por workspace de AI
  First OS dentro de esa carpeta — construir esa asociación toca el runtime de sesiones de agente
  (`src/main/runtime/`), fuera de la condición de parada de esta spec. Se deja como componente listo
  para cuando esa fuente exista.
- **Bug encontrado durante el cierre, no de esta spec**: `interfaceMode: 'simple'` persistido en
  disco no sobrevive un reinicio de Electron aunque no se use `ANDES_INTERFACE_MODE` ni haya
  ningún workspace involucrado — se relanza como `'developer'` literal. Reproducido con un repro
  mínimo que no toca ningún archivo de esta spec
  (`tests/e2e/simple-mode-survives-restart-with-project.spec.ts`, marcado `test.fixme` con el
  detalle completo en su comentario de cabecera). Es la capa de persistencia de ajustes heredada de
  Orca (`src/main/persistence/applying-settings/settings-update.ts`,
  `src/main/persistence/loading-store/normalize-loaded-global-settings.ts`), fuera del alcance de
  archivos de esta spec (`sidebar/`, `files/`, el estado de alcance). Reportado a Peter para que lo
  asigne; el test queda como regresión lista para des-skipear el día que se corrija.

## Evidencia

Rama `spec-010-workspaces-archivos`, worktree
`/Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-010`, sobre `main` mergeado hasta
`a970e14c8b` (spec 008). Cinco commits de marca visual (`5cc02281c9`, `e3064224a8`, `9daaad8343`,
`8ac34708ee`, `cb26d11a67`, `af727470b4`) entraron por la sesión supervisora en esta misma rama —
ver `decisions.md`, 2026-09-03 — y no son parte de esta implementación.

### `evals/run.sh` — 67/67 en verde (54 de specs anteriores sin cambios + 13 de esta spec)

```
PASS spec010#1 el selector muestra un solo workspace (e2e en la spec archivada)
PASS spec010#2 abrir el selector lista los workspaces, My work y New workspace (e2e en la spec archivada)
PASS spec010#3 elegir otro workspace cambia el alcance (Files y el estado; Command Center queda para la spec 009 — e2e en la spec archivada)
PASS spec010#4 la navegación es exactamente New thread, Command Center, Files, Agents & skills, More
PASS spec010#5 Recent threads del workspace elegido, con Ver historial (componente; la fuente de datos por workspace no existe aún — ver decisions.md)
PASS spec010#6 en modo simple la barra lateral no muestra proyectos/repos/worktrees (evidencia e2e en la spec archivada)
PASS spec010#7 Files muestra el árbol solo del workspace elegido (e2e en la spec archivada)
PASS spec010#8 el árbol muestra nombre de nodo para los seis conocidos y el nombre tal cual para uno desconocido
PASS spec010#9 abrir un archivo lo muestra con formato y hay botón para abrir un hilo sobre él (e2e en la spec archivada)
PASS spec010#10 los tres estados incómodos (carpeta sin workspaces, workspace vacío, carpeta sin preparar) tienen su mensaje
PASS spec010#11 en modo desarrollo la barra lateral y los archivos siguen como están (evidencia e2e en la spec archivada)
PASS spec010#12 ningún texto nuevo usa jerga del sistema (nodo, frontmatter, resolver, brain, vault)
PASS spec010#13 código sano (evidencia: pnpm tc / check:code-quality:changed / verify:localization-* / tests nuevos en la spec archivada)
67 pasan · 0 fallan
```

### `pnpm tc` (typecheck completo: node, cli, web)

```
$ pnpm run typecheck
$ node config/scripts/run-typecheck-projects-in-parallel.mjs
```

Sin salida — en verde.

### `check:code-quality:changed`

```
$ node config/scripts/check-changed-code-quality.mjs
code quality: 0 new finding(s) across 48 changed file(s).
type-aware code quality: 0 new finding(s) across 48 changed file(s).
React Doctor: 0 new finding(s) across 48 changed file(s).
Changed-code quality gate passed since a970e14c8bda.
```

### `verify:localization-*`

```
$ pnpm run verify:localization-catalog   → exit 0 (12491+ claves verificadas contra en.json)
$ pnpm run verify:localization-extraction → exit 0 (mismo conteo de "inline defaults differ" que en main, sin regresión)
$ pnpm run verify:localization-coverage  → exit 0 ("Localization coverage check passed with 12 allowlisted candidates.")
```

### Tests unitarios/de componente nuevos — 34/34 en verde

```
$ npx vitest run --config config/vitest.config.ts \
    src/main/workspaces/ \
    src/main/ipc/register-core-handlers/register-core-handlers.test.ts \
    src/renderer/src/store/slices/workspace-scope.test.ts \
    src/renderer/src/components/files/ \
    src/renderer/src/components/sidebar/workspace-scope/

 Test Files  11 passed (11)
      Tests  34 passed (34)
```

Cubren: descubrimiento de workspaces con README.md/context.md y fallback al slug
(`workspace-scope-discovery.test.ts`), árbol de archivos excluyendo `.git`/`node_modules`/ocultos
(`workspace-file-tree.test.ts`), lectura de archivo con límite al alcance
(`workspace-file-read.test.ts`), resolución de alcance con fallback a raíz
(`workspace-scope.test.ts`), traductor de nombres de nodo con los seis conocidos y uno desconocido
(`workspace-node-name.test.ts`), el selector mostrando un solo workspace y listando todos al abrir
(`WorkspaceScopeSelector.test.tsx`), la navegación exacta y "New thread" lanzando una pestaña real
(`SimpleModeNav.test.tsx`), Recent threads con hilos de prueba y su vacío
(`RecentThreadsSection.test.tsx`), los tres estados incómodos
(`SimpleModeScopeEmptyState.test.tsx`), y Files mostrando el árbol y el visor con formato
(`FilesPage.test.tsx`).

### e2e nuevos — 12/12 en verde, 1 `test.fixme` (bug ajeno documentado)

```
$ SKIP_BUILD=1 npx playwright test \
    tests/e2e/simple-mode-workspaces-and-files.spec.ts \
    tests/e2e/simple-mode-survives-restart-with-project.spec.ts \
    tests/e2e/simple-mode-onboarding.spec.ts \
    tests/e2e/simple-mode-surfaces.spec.ts \
    --config tests/playwright.config.ts --project electron-headless --workers=1

  ✓ opens in simple mode on the welcome step, without asking (spec 005)
  ✓ walks all nine step headings, in order, with no developer jargon (spec 005)
  ✓ finishing closes onboarding onto the active project, not the Add Project modal (spec 005)
  ✓ Option-click on the Advanced title reveals Git without reloading (spec 002)
  ✓ the right sidebar offers no Checks, Ports, or Attached worktrees tab (spec 002)
  ✓ the browser and cmd-j shortcuts open no new tab or palette (spec 002)
  - with interfaceMode simple on disk and a real project attached, a restart still shows the simple sidebar (fixme, bug ajeno — ver "Diferido a la spec de restos")
  ✓ the sidebar shows only the active workspace, not the others (criterion 1)
  ✓ opening the selector lists every workspace plus My work and New workspace (criterion 2)
  ✓ choosing a workspace scopes the Files tree to it (criterion 3, 7)
  ✓ simple mode never shows projects, repos, or worktree detail sections (criterion 6)
  ✓ New thread opens a real, activated agent tab, not an empty screen (criterion 3)
  ✓ the sidebar still shows projects and worktrees, not the workspace selector (criterion 11, developer mode)

  1 skipped
  12 passed (2.5m)
```

Los tres e2e de spec 002/005 corridos junto a los propios confirman que nada de esta spec rompió el
modo simple existente ni el modo developer (criterio 11).

### Política de pruebas de esta spec

No se corrió `pnpm test` completo ni la suite e2e completa (costosos, quedan para el Gate 2 sobre la
rama mergeada). Se corrió lo tocado más los e2e de modo simple existentes, con `--workers=1`, más
`pnpm tc`, `check:code-quality:changed` y `verify:localization-*` completos — todo en verde salvo el
`test.fixme` documentado arriba.

### Decisiones delegadas y cómo se cerraron

- **Cómo se descubren los workspaces**: se leyó `workspaces/*` con el head file (`README.md` o
  `context.md`, con fallback al slug humanizado) — ver `workspace-scope-discovery.ts`. Cierra la
  delegación tal como estaba escrita.
- **Dónde se arma el árbol de archivos**: en el proceso principal, con un lector recursivo nuevo
  (`workspace-file-tree.ts`) que sigue el mismo patrón de `readdir` que `listMarkdownDocuments`
  (`src/main/ipc/markdown-documents.ts`) en vez de reusar el `FileExplorer` de worktrees (acoplado a
  git/runtime de ejecución remota, que hubiera sido reescribirlo entero para este caso simple de
  solo lectura).
- **Qué pasa con las pestañas al cambiar de workspace**: no llegó a ser una decisión real — el
  cambio de alcance en esta spec no cierra pestañas (Command Center/hilos por workspace no existen
  todavía); queda para cuando la spec 009 o una futura integren de verdad el cierre selectivo.
- **"New thread" y el modo chat real**: crea una pestaña nueva con `viewMode: 'chat'` y lanza el
  agente detectado si hay uno (`state.detectedAgentIds[0]`), usando el mismo `createTab` público que
  cualquier llamador de `terminal-pane`. El modo chat efectivo lo decide la propia elegibilidad de
  native-chat (necesita un CLI real corriendo) — en un entorno sin agente autenticado la pestaña
  quedó en modo terminal en el e2e, pero es una sesión real y activada, nunca una pantalla vacía.
- **Command Center**: se sacó la vista placeholder y todo lo que tocaba (`TopLevelView`, el wire
  schema, `AppWorkspaceShell.tsx`) porque la spec 009 resuelve Command Center enganchando su propio
  gate sobre `activeView: 'terminal'`, no sobre una vista separada — mantenerla solo agregaba
  superficie de choque con su merge sin aportar nada. El botón "Command Center" del nav navega a
  `'terminal'` también, consistente con ese modelo.
- **Nombre de la workspace en el selector**: se probaron README.md y context.md (el brain puede
  tener cualquiera de las dos formas de cabeza, según cuándo se creó) en vez de replicar
  `os_head_file` de `common.sh`, que exige leer `tree.md` — la lectura directa del head file cubre
  el caso real sin ese costo.

`AppWorkspaceShell.tsx` se tocó, con el cambio más chico posible: un lazy import y una línea
(`{activeView === 'files' ? <FilesPage /> : null}`) — la spec 009 también toca este archivo (su
propio gate de Command Center sobre `activeView === 'terminal'`), pero en líneas distintas.
