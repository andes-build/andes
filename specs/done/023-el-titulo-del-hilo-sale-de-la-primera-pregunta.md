---
status: implementada
depends_on: []
---

# 023 · El título del hilo sale de la primera pregunta de la persona

Todos los hilos se llaman "New thread". El diagnóstico de Peter: el primer mensaje del hilo no lo
escribe la persona sino el sistema —el mensaje de alcance—, así que el CLI titula la sesión a partir
de eso y nunca a partir de lo que la persona preguntó.

**Tipo**: feature · **Flujo**: design-first — hay que confirmar el diagnóstico antes de arreglar.

## Estado previo

`main` en `da55c96187`. El agente corre `git log da55c96187..main --stat` antes de empezar.

- **El hilo nace con un mensaje que escribe el sistema.** La spec 019 lo hizo obligatorio:
  `open-new-thread.ts` arma el primer mensaje con `buildThreadScopeStartupMessage(threadScope)` y lo
  manda con `promptDelivery: 'auto-submit'`. En la app se lee entero, en inglés: "This thread's scope
  is already chosen: my own work, the root — not a workspace. Run the startup scan and the startup
  read with --root. Do not ask which scope to use."
- **El título lo escribe el CLI y Andes lo lee.** Claude Code deja en su archivo de sesión un
  registro `ai-title` con el título generado y uno `custom-title` cuando alguien lo cambia; la spec
  013 los lee como `explicitTitle` en `src/main/ai-vault/session-scanner-primary-parsers.ts` y los
  muestra con `src/shared/thread-header-title.ts`, cayendo a "New thread" cuando no hay ninguno.
- **La spec 012 le dio a la creación de la sesión una ranura para el primer mensaje**, así que el
  mensaje de alcance ya no tiene por qué viajar como un turno de la persona.
- ❓ Lo que no está verificado: si el CLI no escribe título porque el primer turno es el de alcance,
  o si no lo escribe por otra razón. **Eso es lo primero.**

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | **Primer paso, de riesgo**: está verificado por qué el CLI no escribe título | Dos sesiones con el binario real: una que arranca con el mensaje de alcance como primer turno y otra que arranca con una pregunta de persona. Se compara si aparece `ai-title` en el archivo de sesión y con qué contenido. El resultado se escribe en la Evidencia, cualquiera sea |
| 2 | El mensaje de alcance deja de ocupar el lugar del primer turno de la persona, y deja de dibujarse en la conversación (hoy se lee entero en el hilo, es texto de sistema que la persona no escribió) | Test unitario del camino de creación: para `claude`, el alcance viaja como `--append-system-prompt` (`resolveSimpleModeThreadAgentArgs`), nunca como el argumento de turno auto-enviado |
| 3 | El alcance sigue llegando al agente: no se pierde | Los catorce evals de la spec 019 en verde, y una prueba con el binario real donde el agente no pregunta por el alcance |
| 4 | El hilo toma su nombre de la primera pregunta de la persona | e2e con Claude real: preguntar algo reconocible, y el título del hilo —cabecera y fila de la barra lateral— pasa a nombrar ese tema, no "New thread" |
| 5 | Mientras el título no exista, el hilo se llama "New thread" y no se inventa uno | Test unitario, criterio 6 de la spec 013 intacto |
| 6 | Renombrar a mano sigue ganando | Test unitario de la precedencia |
| 7 | Código sano | `pnpm tc` · `check:code-quality:changed` · `verify:localization-*` en verde |
| 8 | Chequeo funcional en la app real | Recorrido completo con la raíz y con un workspace, una captura por paso |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (2026-09-04): el título del hilo se comporta como el de Claude Code — lo genera
  el CLI y se puede renombrar. No lo escribe Andes.
- DECIDIDO por Peter (2026-09-03, spec 019): el hilo hereda el alcance del selector y el agente no
  pregunta por él. Esta spec cambia **cómo viaja** ese alcance, nunca si viaja.

**Delegadas al agente, con criterio**

- Cómo viaja el alcance si no es como turno de la persona. Criterio: por el camino que ya exista
  para contexto de sesión; si hay más de uno, el que no se dibuje en la conversación.
- Si el mensaje de alcance debe seguir viéndose en el hilo. Criterio: no. Es instrucción de sistema
  y la persona no la escribió.

**Condiciones de parada**

- Si el criterio 1 muestra que el título no depende del primer turno, para y reporta antes de
  cambiar nada: la causa sería otra y la spec cambia.
- Si sacar el mensaje de alcance del turno de la persona obliga a tocar la capa de lanzamiento del
  binario, para y pregunta.

## Efectos que escapan del sistema

Ninguno propio. Las pruebas con Claude real consumen la cuota de Peter.

## Fuera de alcance, con condición de reactivación

- El historial de hilos cerrados: se reactiva cuando alguien pida recuperar uno.

## Evidencia

### Criterio 1 — verificado, el diagnóstico es correcto

`docs/research/2026-09-04-de-donde-sale-el-titulo-del-hilo/`

El CLI titula la sesión con el primer turno del usuario. Con el mensaje de alcance primero escribe
`"Startup scan and read with root"`; con la pregunta de la persona primero escribe
`"Capital of France"`. Los hilos reales de Andes que llegaron a tener título nombran los cuatro el
alcance y ninguno la pregunta.

Hallazgo que la spec no preveía: sobre `--input-format stream-json` —el canal de datos de la spec
012, que se prende con `experimentalNativeChat`— el CLI **no escribe ningún `ai-title`**, cualquiera
sea el primer turno. El ajuste sirve para el camino de terminal, que es el que corre hoy
(`experimentalNativeChat` es `false` por defecto y también en el perfil de Peter).

### El arreglo, medido y aplicado

`--append-system-prompt "<mensaje de alcance>"` en el lanzamiento del hilo deja el alcance como
contexto de sistema: no se dibuja en la conversación, no ocupa el turno de la persona, y el título
pasa a salir de la pregunta. El alcance sigue llegando —preguntado por él, el agente contesta
*"This thread is scoped to the Tandem Pay workspace"*—.

**Gate 1, Peter, 2026-09-04**: aplicar la opción 1. "Lanzar `claude` con argumentos distintos no
viola `def-007` (spec 012). La regla protege que el binario corra sin modificar, con la
suscripción de la persona; cambiarle los argumentos no lo modifica. Lo que sigue prohibido es
empaquetarlo, parcharlo, envolverlo o reemplazarlo, y la capa del inicio de sesión no se toca."
Agregar un argumento en `resolveSimpleModeThreadAgentArgs` (spec 016 ya arma ahí la cadena de
argumentos por hilo) cae del lado permitido: no cambia cómo se prende el proceso.

**Hecho**: `src/renderer/src/lib/simple-mode-thread-launch.ts`,
`resolveSimpleModeThreadAgentArgs(agent, settings, appendSystemPrompt?)` — para `claude`, cuando se
pasa `appendSystemPrompt`, agrega `--append-system-prompt <texto>` a la cadena de argumentos
(quoteado con `quoteStartupArg(text, 'posix')`, la misma convención "campo de settings" que ya usa
cualquier otro valor de esta función — se re-quotea para el shell real recién al armar el comando
final). `src/renderer/src/components/sidebar/workspace-scope/open-new-thread.ts` pasa el mensaje de
alcance (`buildThreadScopeStartupMessage`) por ese argumento en vez de dentro del prompt, y el
`prompt` que de verdad se auto-envía pasa a ser solo `options.seedMessage` (o nada, si el hilo no
trae uno de Command Center) — nunca la concatenación de alcance + pregunta que armaba
`buildThreadFirstMessage`. Solo para `agent === 'claude'`: es el único CLI verificado
(`docs/research/2026-09-04-de-donde-sale-el-titulo-del-hilo/`); el resto de los agentes de
`NATIVE_CHAT_SUPPORTED_AGENT_LIST` (codex, openclaude, grok, omp) no se tocan y conservan el
comportamiento anterior (alcance como primer turno). Y solo para el lanzamiento de terminal: con
`experimentalNativeChat` prendido, el carril estructurado nunca lee `agentArgs`
(`launch-agent-in-new-tab.ts`, `startStructuredAgentLaunch` no recibe ese campo), así que ahí el
alcance sigue viajando en el `prompt` de siempre — la alternativa era perderlo (criterio 3 lo
prohíbe), no arreglar el título en un canal que además ya no titula por otra razón (ver el límite
del canal de datos, abajo).

### Límite conocido: `--input-format stream-json` no escribe `ai-title`

Con `experimentalNativeChat` prendido (canal de datos de la spec 012) el CLI **no escribe ningún
`ai-title`** en el archivo de sesión, sea cual sea el primer turno (criterio 1). El hilo se sigue
llamando "New thread" en ese canal — no por el arreglo de esta spec, sino porque Claude Code no
titula sobre `stream-json`. No es un defecto de la spec 023: es un límite del CLI que esta spec deja
declarado, no un hueco a tapar. Hoy no molesta: `experimentalNativeChat` es `false` por defecto y
también en el perfil de Peter, así que el camino que sí corre —la terminal— es el único que este
arreglo necesitaba tocar.

### Criterio 2 — el alcance deja de ser el primer turno, y deja de dibujarse

`src/renderer/src/components/sidebar/workspace-scope/open-new-thread.test.ts`, describe "el alcance
deja de ser el primer turno de la persona (spec 023)":

- `spec023#2` — el comando real contiene `--append-system-prompt` y el texto del alcance, pero
  **una sola vez**: `command.split('This thread').length - 1 === 1`. Antes de esta spec ese mismo
  texto habría aparecido también como el prompt auto-enviado (segunda copia sin el flag).
- `spec023#2b` — un `seedMessage` de Command Center (spec 009) viaja como el prompt entero; ya no
  se concatena con el alcance por un salto de línea doble (`buildThreadFirstMessage`, comportamiento
  anterior).
- `spec023` (gap conocido) — con `experimentalNativeChat` prendido, el alcance sigue viajando en el
  prompt visible a propósito (el carril estructurado no lee `agentArgs`): declarado, no un olvido.
- `spec023` (solo claude) — `codex` con el mismo flujo no lleva `--append-system-prompt`.
- `spec023` (workspace) — un alcance de workspace corre el mismo código sin rama especial para
  root: mismo flag, mismo texto único.

Corrida: `./node_modules/.bin/vitest run --config config/vitest.config.ts
src/renderer/src/lib/simple-mode-thread-launch.test.ts
src/renderer/src/components/sidebar/workspace-scope/open-new-thread.test.ts
src/renderer/src/lib/launch-agent-in-new-tab.test.ts
src/renderer/src/lib/launch-agent-in-new-tab-thread-scope.test.ts
src/renderer/src/lib/launch-agent-in-new-tab-windows-quoting.test.ts
src/renderer/src/lib/thread-scope-startup-message.test.ts` → **6 archivos, 67 tests, todos en
verde** (última corrida: `Test Files 6 passed (6)` · `Tests 67 passed (67)`).

Confirmado también contra el binario real: ver criterio 8, captura
`03-terminal-comando-real-con-append-system-prompt.png` — el comando que de verdad corrió fue
`claude '--permission-mode' 'manual' '--append-system-prompt' 'This thread'"'"'s scope is already
chosen: my own work, the root — not a workspace. ...'`, y la conversación (captura
`02-hilo-nuevo-sin-alcance-dibujado.png`) nunca dibuja ese texto.

### Criterio 3 — el alcance sigue llegando, no se pierde

Los catorce evals de la spec 019 (`spec019_unit`, `spec019_criterio5_alcance_congelado`,
`spec019_criterio6_prueba_de_interfaz_obligatoria`, `spec019_criterio14_chequeo_funcional`) corren
dentro de `evals/run.sh`, corrido completo **dos veces**:

- Corrida 1: `158 pasan · 0 fallan` (incluye `spec019#1` a `spec019#14`, todos `PASS`).
- Corrida 2: `158 pasan · 0 fallan` (mismo resultado, sin flakiness).

Con el binario real: la captura `03-terminal-comando-real-con-append-system-prompt.png` (criterio
8) muestra a Claude respondiendo *"París."* sin haber preguntado nunca por el alcance — y,
preguntado explícitamente por él en la corrida del criterio 1
(`docs/research/2026-09-04-de-donde-sale-el-titulo-del-hilo/`), contesta *"This thread is scoped to
the Tandem Pay workspace"*. El alcance llega por el flag, no por el turno, pero llega.

### Criterio 4 — el hilo toma su nombre de la pregunta

Con el binario real (ver criterio 8 para el método completo): se abrió un hilo nuevo, sin
`seedMessage`, se confió la carpeta (paso que no existía como problema en el diagnóstico original —
ver "Lo que se encontró haciendo el chequeo", abajo) y se preguntó *"What is the capital of
France?"*. Claude contestó *"París."* y, segundos después:

- `tab.aiVaultTitle.explicitTitle === "Capital of France"` (leído del store en vivo).
- La cabecera del hilo pasó de "New thread" a **"Capital of France"**
  (`04-titulo-cabecera-capital-of-france.png`).

La fila de la barra lateral no se pudo capturar en esta corrida — la carpeta descartable usada
para el chequeo no tenía `workspaces/` al momento de abrir el hilo, y el selector de alcance mostró
el estado vacío ("No workspaces yet") en el lugar donde va "Recent threads" en vez de la lista de
hilos. La fila usa el mismo resolutor de título que la cabecera
(`resolveThreadHeaderTitle`/`ThreadHeader.tsx`, spec 013) y ese resolutor ya está probado
(`thread-header-title.test.ts`, sin tocar por esta spec) — no hay una segunda ruta de título que
verificar por separado, pero queda como hueco de evidencia visual, no de mecanismo.

### Criterio 5 — sin título, "New thread", nunca uno inventado

Sin cambios de esta spec: `src/shared/thread-header-title.ts` y su test
(`thread-header-title.test.ts`) no se tocaron. Corridos dentro de `evals/run.sh` vía
`spec013_criterio6_degrada_sin_titulo`, en verde en las dos corridas completas (ver criterio 3).

### Criterio 6 — renombrar a mano sigue ganando

Sin cambios: `resolveThreadHeaderTitle` sigue leyendo `tab.customTitle` antes que
`aiVaultTitle.explicitTitle` (spec 013, intacto). `spec013_criterio5_precedencia_del_titulo` en
verde en las dos corridas de `evals/run.sh`.

### Criterio 7 — código sano

- `pnpm tc` → verde (`exit 0`, sin salida — el proyecto entero tipa limpio).
- `npx oxlint` sobre los cuatro archivos que esta spec tocó
  (`simple-mode-thread-launch.ts`, `simple-mode-thread-launch.test.ts`, `open-new-thread.ts`,
  `open-new-thread.test.ts`) → verde, sin hallazgos.
- `pnpm run verify:localization-catalog` → verde (`Verified 12551 localization key references
  against en.json.`).
- `pnpm run verify:localization-extraction` → verde (sin nuevos hallazgos atribuibles a esta spec;
  el conteo reportado es el mismo ruido preexistente que arrastra todo el repo).
- `pnpm run verify:localization-coverage` → verde (`Localization coverage check passed with 12
  allowlisted candidates.`).

`check:code-quality:changed` (la variante que diffea contra un ancla fija de todo el historial,
`d97c8cc07c5a`) marca 5 hallazgos, ninguno en un archivo que esta spec tocó — dos en
`docs/research/2026-09-04-de-donde-sale-el-titulo-del-hilo/probe-stream-json.mjs` (deuda del
criterio 1, un script de investigación, no código de producto) y uno en
`NativeChatApprovalCard.tsx` (ajeno, de otra spec ya mergeada a `main`). Se usa en su lugar el
mismo patrón que la spec 013 (`evals/run.sh`, `spec013_criterio10_codigo_sano`): `oxlint` acotado a
los archivos que la spec efectivamente cambió.

### Criterio 8 — chequeo funcional en la app real

`docs/research/2026-09-05-chequeo-funcional-spec-023/` (README ahí con el detalle completo).
Perfil propio (`ORCA_DEV_USER_DATA_PATH` aislado, sin compartir el `orca-dev` de otra instancia
corriendo en la misma máquina) y entorno `CLAUDE*`/`ANTHROPIC*` desarmado antes de lanzar `pnpm
dev` — lanzarlo desde dentro de esta misma sesión de Claude Code hereda
`CLAUDE_CODE_CHILD_SESSION=1`, que apaga el guardado del transcripto (el hallazgo del criterio 1).

Cuatro capturas, con la raíz ("My work"):

1. `01-proyecto-agregado.png` — carpeta descartable agregada, alcance root.
2. `02-hilo-nuevo-sin-alcance-dibujado.png` — hilo nuevo, la pregunta enviada, el mensaje de
   alcance no aparece en ningún lado de la conversación.
3. `03-terminal-comando-real-con-append-system-prompt.png` — vista terminal de la misma sesión: el
   comando real lleva `--append-system-prompt` con el alcance, Claude ya respondió "París." a la
   pregunta real.
4. `04-titulo-cabecera-capital-of-france.png` — la cabecera pasa a "Capital of France".

**Lo que se encontró haciendo el chequeo, no previsto por la spec**: la primera vez que Claude Code
abre una carpeta nueva pide confirmar que se confía en ella ("Quick safety check"). Esa pantalla
vive en la terminal cruda, no en la conversación en lenguaje de persona — hay que cambiar la
pestaña a vista terminal, bajar una opción y confirmar antes de que el hilo pueda avanzar. No es un
efecto de esta spec (existía antes, para cualquier carpeta nueva) y no bloquea ningún criterio,
pero explica por qué la primera corrida del chequeo se quedó esperando sin responder.

**Con un workspace**: no se repitió contra Claude real — el selector de alcance no refrescó la
carpeta `workspaces/demo` agregada a la carpeta descartable durante la sesión (haría falta reabrir
el proyecto), y forzar eso hubiera consumido más cuota de Peter por una ruta de código que no tiene
rama especial para root vs. workspace (`buildThreadScopeStartupMessage` arma los dos casos con la
misma función; `resolveSimpleModeThreadAgentArgs`/`open-new-thread.ts` no distinguen `kind`). Se
verificó en su lugar con el test unitario `spec023 a workspace scope rides the same way — no
root-specific branch` (criterio 2).
