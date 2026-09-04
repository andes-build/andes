---
status: pendiente
depends_on: []
---

# 012 · El permiso de Claude llega como dato

Hoy la tarjeta de permiso de Claude es una imitación: los botones escriben teclas en una terminal
escondida. Esta spec abre para Claude el canal de datos que ya existe para Codex, para que el
permiso llegue como dato y la respuesta vuelva por el mismo camino.

**Tipo**: feature · **Flujo**: design-first — el adaptador de Codex son unos sesenta archivos y no
se sabe cuánto de esa forma le sirve a Claude. El primer paso es la prueba de humo que baja el
riesgo, no construir.

## Estado previo

`main` en `614b84a6ef`. El agente corre `git log 614b84a6ef..main --stat` antes de empezar.

- **La tarjeta de permiso ya está dibujada y funciona escribiendo teclas.** Su propio comentario lo
  dice: `NativeChatApprovalCard.tsx:7-15` — "Send the chosen option's literal string to the agent's
  PTY… a number to allow; ESC to deny".
- **El canal de datos existe solo para Codex.** `structured-agent-session-provider-support.ts:7-25`:
  cuando el adaptador no declara `supportsCreate`, el respaldo es literalmente `agent === 'codex'` y
  `record.provider === 'codex'`. Ese es el punto donde Claude hoy no entra.
- **El adaptador de Codex es grande**: `src/main/codex/` tiene unos sesenta archivos
  `codex-structured-*`, entre ciclo de vida (`codex-structured-session-adapter.ts`), traducción de
  eventos (`codex-structured-journal-translation.ts`) y respuesta a prompts
  (`codex-structured-prompt-replies.ts`). **No se copia entero**: se copia la forma que haga falta.
- **El modelo de datos del journal ya es agnóstico**: `src/shared/agent-session-journal-types.ts`
  define los ítems que la conversación dibuja, entre ellos `AgentJournalToolCallItem` con `name`,
  `input`, `state` y `output` acotado (líneas 63-88).
- **Ya está probado que del lado de Claude se puede**: `tsk-182` (2026-09-02) pasó 4 de 4 — el
  permiso llega como dato y la respuesta vuelve, con permitir y con rechazar. El script está en
  ~/Documents/proyectos/andes-lab y el resultado en
  `research/2026-08-31-superficie-sin-terminal.md` de la iniciativa. **Lo que no está resuelto es la
  forma adentro de Andes**, que es lo que esta spec construye.
- **Claude Code arranca en modo de permisos automático** desde la versión 2.1.260: la tarjeta
  aparece solo con `--permission-mode manual`, y el modo simple ya lo pide (hallazgo de la spec 016).

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | **Primer paso, de riesgo**: una sesión de Claude creada por el camino estructurado entrega un permiso como dato y acepta la respuesta, con permitir y con rechazar | Prueba de integración con el binario real de Claude: se pide una acción que requiera permiso, llega el ítem de permiso, se responde permitir en una corrida y rechazar en otra, y el resultado difiere. Si esto no se puede, la spec para acá |
| 2 | Claude entra por el mismo portón que Codex, sin romperlo | `adapterSupportsCreate` y `adapterSupportsRecord` admiten Claude; test unitario de los dos con `claude` y con `codex`, y con un proveedor desconocido que sigue afuera |
| 3 | La tarjeta de permiso deja de escribir en la PTY | `grep -c "PTY" src/renderer/src/components/native-chat/NativeChatApprovalCard.tsx` = 0; el componente responde por el canal de datos y su test lo verifica con permitir y con rechazar |
| 4 | Lo que la tarjeta dice sale de los datos del permiso, no de leer la pantalla | Test unitario: con el ítem de permiso como entrada, el título y el detalle salen de sus campos; ninguna función del camino lee el transcripto de la terminal |
| 5 | Codex sigue funcionando igual | Los tests existentes de `src/main/codex/` en verde, sin modificar ninguno para que pase |
| 6 | El modo desarrollo, con su terminal, no cambia | e2e en modo desarrollo: la terminal cruda sigue estando |
| 7 | Lo que el adaptador no puede darle a Claude se declara, no se simula | La spec archivada lista lo que quedó sin equivalente —empezando por los subagentes, `tsk-172`— y la interfaz lo dice cuando corresponde en vez de fingirlo |
| 8 | Código sano | `pnpm tc` · `check:code-quality:changed` · `verify:localization-*` y los tests nuevos en verde |
| 9 | Chequeo funcional en la app real | El recorrido completo con Claude real: pedir algo que requiera permiso, permitir en un hilo y rechazar en otro, una captura por paso en `docs/research/` |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (2026-09-03): **el hilo funciona por datos, no leyendo una terminal.** Es lo
  único que permite dibujar el permiso como tarjeta de verdad. La terminal queda solo en modo
  desarrollo.
- DECIDIDO por Peter (Gate 1, 2026-09-04): **lanzar `claude` con argumentos distintos no viola
  `def-007`.** La regla protege que el binario corra sin modificar, con la suscripción de la
  persona; cambiarle los argumentos no lo modifica. Lo que sigue prohibido es empaquetarlo,
  parchearlo, envolverlo o reemplazarlo, y la capa del inicio de sesión no se toca.
- DECIDIDO por Peter (2026-09-04): esta spec es el adaptador de datos para Claude. Los cuatro
  hallazgos de la primera corrida que antes ocupaban este número quedaron absorbidos por las specs
  006, 009, 014 y 020; lo único que sobrevivía —el panel de archivos de la derecha en modo simple—
  se fue a la spec 013.

**Delegadas al agente, con criterio**

- Cuánto del adaptador de Codex se copia. Criterio: lo mínimo para que el criterio 1 pase; cada
  archivo nuevo se justifica por un criterio, no por simetría con Codex.
- Dónde vive el adaptador de Claude. Criterio: al lado del de Codex, con el mismo contrato
  (`StructuredAgentSessionAdapter`), nunca una segunda noción de sesión estructurada.

**Condiciones de parada**

- **Si hace falta algo más que argumentos distintos para lanzar `claude` —empaquetar, parchear,
  envolver o reemplazar el binario— para y pregunta.** Ahí se cruza la línea de `def-007`, que es de
  donde viene heredada toda la conformidad.
- Si el permiso como dato obliga a tocar la capa del inicio de sesión, para y pregunta.
- Si el canal de datos entrega el permiso pero pierde algo que hoy se ve en la terminal, para y
  reporta qué se pierde antes de seguir.

## Efectos que escapan del sistema

Ninguno propio. La prueba del criterio 1 corre el binario real de Claude con la suscripción de
Peter, así que consume su cuota; se hace con pedidos chicos.

## Fuera de alcance, con condición de reactivación

- La tarjeta de subagente, diferida desde la spec 011: se reactiva cuando el adaptador entregue el
  ítem de subagente.
- El resto de los CLIs de la lista de Orca: se reactiva cuando `tsk-171` termine el relevamiento.
- Los estados de error de la conversación: spec propia.
