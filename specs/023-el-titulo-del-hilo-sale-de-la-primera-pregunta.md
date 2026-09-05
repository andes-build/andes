---
status: pendiente
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
| 2 | El mensaje de alcance deja de ocupar el lugar del primer turno de la persona | Test unitario del camino de creación: el alcance viaja por la ranura que la spec 012 agregó, no como turno visible |
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

### El arreglo, medido y sin aplicar

`--append-system-prompt "<mensaje de alcance>"` en el lanzamiento del hilo deja el alcance como
contexto de sistema: no se dibuja en la conversación, no ocupa el turno de la persona, y el título
pasa a salir de la pregunta. El alcance sigue llegando —preguntado por él, el agente contesta
*"This thread is scoped to the Tandem Pay workspace"*—.

### Criterios 2 a 8 — no ejecutados

## Condición de parada alcanzada

**"Si sacar el mensaje de alcance del turno de la persona obliga a tocar la capa de lanzamiento del
binario, para y pregunta."**

No hay otro camino. Sobre la terminal, el único canal de contexto de sesión que no se dibuja en la
conversación es un argumento del binario. La ranura `firstMessage` de la spec 012 no alcanza: el
host la manda como turno `role: user` (`src/main/runtime/rpc/methods/structured-agent-session.ts`),
o sea sigue siendo el primer turno de la persona, y además vive en el canal de datos, que no titula.

Lo que hay que decidir, para Gate 1:

1. **Aplicar `--append-system-prompt` en `resolveSimpleModeThreadAgentArgs`**
   (`src/renderer/src/lib/simple-mode-thread-launch.ts`), donde la spec 016 ya arma los argumentos
   por hilo. Es un argumento más en una cadena que ya se arma ahí, no un cambio en cómo se prende el
   proceso. El título del hilo pasa a salir de la pregunta.
2. **Dejarlo como está** y aceptar que todos los hilos se titulan por el alcance.

Queda abierto, en cualquiera de los dos casos: con `experimentalNativeChat` prendido el hilo se
sigue llamando "New thread" porque el CLI no titula en ese canal. Eso es otra spec.
