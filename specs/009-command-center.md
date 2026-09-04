---
status: pendiente
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

## Fuera de alcance, con condición de reactivación

- El hilo con permisos dibujados: spec propia. Hasta entonces, los botones abren una sesión de
  agente de las que Orca ya tiene.
- El selector de workspace y los archivos por alcance: spec 010.
- Que el Command Center se actualice solo cuando cambian los archivos: se reactiva si al usarlo la
  pantalla se siente vieja; por ahora se recarga al volver a ella.
