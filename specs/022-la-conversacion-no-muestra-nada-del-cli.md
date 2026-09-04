---
status: pendiente
depends_on: []
---

# 022 · La conversación no muestra nada del CLI

La conversación del modo simple todavía deja ver tres cosas que son del CLI y no de la persona:
los cuadros internos como si fueran mensajes, un cartel que dice que el mensaje no se pudo confirmar
cuando sí llegó, y la fila de una herramienta ya terminada con su nombre y su archivo.

**Tipo**: residuos · **Flujo**: requirements-first

## Estado previo

`main` en `da55c96187`. El agente corre `git log da55c96187..main --stat` antes de empezar.

Los tres los vio Peter en la app real el 2026-09-04, sobre el resultado de la spec 012. Las capturas
están en `docs/research/2026-09-04-chequeo-funcional-spec-012/`, sobre todo la 05.

1. **Los cuadros internos se dibujan como filas.** En el transcripto se leen
   `claude system:thinking_tokens` siete veces seguidas, `claude control_response · 27372 bytes` y
   `claude system:init · 7463 bytes`. Vienen de la traducción de cuadros a ítems del journal,
   `src/main/claude/claude-structured-journal-translation.ts`.
2. **El cartel de entrega miente.** Después de cada mensaje aparece "Message delivery is
   unconfirmed." con un botón "Retry", aunque el mensaje llegó y el agente contestó. El texto está en
   `src/renderer/src/components/native-chat/NativeChatStructuredSession.tsx:198`. La causa declarada
   por la spec 012: el adaptador de Claude contesta `state: 'unknown'` en
   `src/main/claude/claude-structured-session-adapter.ts:259`, porque el cable es de ida y decir
   `accepted` sin saberlo sería inventarlo.
3. **La fila de la herramienta ya resuelta muestra su nombre y su archivo** — "Write · rechazo.txt"
   en las capturas 04 y 06. La línea de actividad y la tarjeta de permiso ya están redactadas
   (`src/renderer/src/components/native-chat/native-chat-activity-phrase.ts`); la fila resuelta quedó
   afuera. Además ese mismo redactor produce frases rotas: con `permiso.txt` la tarjeta dijo
   **"Write the permiso?"**, que no es una frase en ningún idioma — arma
   `'Write the {{value0}}?'` con el nombre del archivo humanizado.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | Ningún cuadro interno del CLI se dibuja como fila de la conversación | Test unitario del traductor con una batería de cuadros (`system:init`, `system:thinking_tokens`, `control_response`, `system:task_summary`, `system:post_turn_summary`): ninguno produce un ítem visible. e2e: el transcripto no contiene la cadena `system:` ni `control_response` |
| 2 | Lo que el CLI dice y la persona necesita ver sigue viéndose | Test unitario: los cuadros de mensaje, de herramienta y de permiso siguen produciendo su ítem |
| 3 | El cartel de entrega no aparece cuando el mensaje llegó | e2e con Claude real: mandar un mensaje, recibir respuesta, y que "Message delivery is unconfirmed" no esté en la pantalla |
| 4 | Cuando la entrega de verdad no se puede confirmar, se dice sin jerga y con qué hacer | Test de componente del caso sin confirmar; el texto no nombra `dispatch`, `unknown` ni ninguna herramienta |
| 5 | La fila de una herramienta terminada no muestra su nombre ni su archivo | Test de componente con `Write rechazo.txt` resuelto: la fila no contiene `Write` ni `rechazo.txt`; e2e sobre el transcripto |
| 6 | El redactor no produce frases rotas | Eval de texto sobre `native-chat-activity-phrase.ts` con nombres de archivo en español, con espacios, con mayúsculas y sin extensión: ninguna salida arma una frase agramatical. Rúbrica: si el nombre no entra natural en la oración, se cae a la forma genérica ("Write a file?") antes que producir "Write the permiso?" |
| 7 | El modo desarrollo no cambia | e2e en modo desarrollo |
| 8 | Código sano | `pnpm tc` · `check:code-quality:changed` · `verify:localization-*` y los tests nuevos en verde |
| 9 | Chequeo funcional en la app real | El recorrido completo, una captura por paso en `docs/research/` |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (2026-09-04): la interfaz no muestra jerga ni nombres de herramienta. Es la
  misma regla que cerró la spec 013; acá se termina de aplicar.

**Delegadas al agente, con criterio**

- Dónde se filtran los cuadros. Criterio: en la traducción, no en la pantalla. Un ítem que nadie
  tiene que ver no debería llegar al journal.
- Qué se hace con el estado `unknown` del despacho. Criterio: no mentir en ninguna dirección. Si no
  se puede confirmar, la ausencia de confirmación no es un error y no se dibuja como tal; el cartel
  solo aparece cuando hay evidencia de que el mensaje no llegó.

**Condiciones de parada**

- Si confirmar la entrega exige cambiar el protocolo con el CLI, para y pregunta.
- Si filtrar un cuadro rompe el retomar una sesión, para y reporta.

## Efectos que escapan del sistema

Ninguno propio. Las pruebas con Claude real consumen la cuota de Peter: pedidos chicos.

## Fuera de alcance, con condición de reactivación

- El primer mensaje de alcance visible en el hilo: es de la spec 023.
- La tarjeta de subagente: se reactiva cuando el adaptador entregue ese ítem.
