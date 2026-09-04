---
status: pendiente
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
