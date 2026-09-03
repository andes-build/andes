---
status: pendiente
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
