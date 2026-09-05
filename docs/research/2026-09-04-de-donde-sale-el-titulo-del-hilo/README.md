# De dónde sale el título del hilo · 2026-09-04

Criterio 1 de la spec 023. Medido contra el binario real: `claude` 2.1.261.

## Resultado

El diagnóstico de Peter es correcto: **el CLI titula la sesión con el primer turno del usuario**, y
como ese turno es el mensaje de alcance de la spec 019, el título nombra el alcance y nunca la
pregunta de la persona.

Hallazgo adicional, no previsto por la spec: **el CLI escribe `ai-title` solo cuando corre sobre una
terminal**. Sobre `--input-format stream-json` —el canal de datos de la spec 012, que se activa con
`experimentalNativeChat`— no escribe ninguno, cualquiera sea el primer turno.

## Las cuatro corridas

Todas con `--model haiku`, en carpetas vacías, con el entorno limpio.

| # | Canal | Primer turno del usuario | `ai-title` escrito |
|---|---|---|---|
| tui2 | terminal | `What is the capital of France? One word.` | `Capital of France` |
| tui3 | terminal | mensaje de alcance, y la pregunta después | `Startup scan and read with root` |
| tui4 | terminal, alcance en `--append-system-prompt` | `What is the capital of France? One word.` | `Capital of France` |
| A2 / B2 | `--input-format stream-json` | alcance / pregunta | ninguno, en las dos |

Los registros están en `sesiones/`. El script del canal de datos es `probe-stream-json.mjs`.

## Los hilos reales de Andes

`sesiones/hilos-reales-de-andes.txt`: las sesiones del CLI abiertas por Andes en
`ai-first-os-demo`, filtradas por el mensaje de alcance. De once, cuatro llegaron a tener título y
los cuatro nombran el alcance:

```
"aiTitle":"Startup scan and read with root"
"aiTitle":"Tandem Pay startup scan"
```

Ninguna nombra lo que preguntó la persona.

## El entorno contamina la medición

Una sesión lanzada desde adentro de otra sesión de Claude Code hereda `CLAUDE_CODE_CHILD_SESSION=1`
y el CLI apaga el guardado del transcripto: *"Transcript saving is off — inherited
CLAUDE_CODE_CHILD_SESSION marker"*. Sin transcripto no hay archivo de sesión y no hay `ai-title`.
Toda medición del título hay que correrla con las variables `CLAUDE*` desarmadas.

## El arreglo, medido

`--append-system-prompt "<mensaje de alcance>"` deja el alcance como contexto de sistema: no se
dibuja en la conversación, no ocupa el turno de la persona, y el título pasa a salir de la pregunta
(tui4). El alcance sigue llegando: preguntado por el alcance sin correr nada, el agente contesta
*"This thread is scoped to the Tandem Pay workspace"*.
