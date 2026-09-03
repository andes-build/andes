---
status: pendiente
depends_on: [009]
---

# 011 · El hilo

La conversación de Andes en modo simple: burbujas de texto, el pedido de permiso como tarjeta con
dos botones, y el subagente mostrado como trabajo en curso adentro de la charla. Sin terminal a la
vista.

Orca ya tiene casi todo esto construido y escondido detrás de un ajuste experimental llamado Native
Chat. Esta spec lo saca de experimental, lo pone como la superficie del modo simple, y cierra la
diferencia con el diseño aprobado.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `91547e62bf`. Depende de la spec 009, que trae el Command Center y desde donde se abre un hilo.
El agente corre `git log 91547e62bf..main --stat` antes de empezar.

Lo que ya existe y **se reutiliza**, no se reescribe:

- `src/renderer/src/components/native-chat/`: la conversación entera, con `NativeChatComposer`
  (el cuadro de escribir), `NativeChatDiffView`, `NativeChatEmptyState` y —lo más importante—
  `NativeChatApprovalCard.tsx`, que ya dibuja el permiso como tarjeta con Permitir y Rechazar.
- `src/main/native-chat/agent-session-wire/`: el canal de datos. Incluye
  `claude-stream-json-frame-schema.ts`, que ya declara los tipos de mensaje del kit de agentes de
  Claude Code (asistente, usuario, resultado, arranque, y los eventos de flujo), y
  `provider-frame-disposition.ts`, que ya sabe qué hacer con `permission_denied`.
- El ajuste que lo esconde: `experimentalNativeChat` en `src/shared/global-settings-types.ts:211`,
  con su panel en `settings/NativeChatExperimentalSetting.tsx`.

⚠️ **Lo que hay que verificar antes de construir**: `NativeChatApprovalCard` dice en su propio
comentario que cada botón "escribe la cadena literal de la opción en la terminal del agente" (un
número para permitir, ESC para rechazar). O sea: la tarjeta se ve como el diseño, pero por debajo
puede estar leyendo una terminal y mandando teclas, en vez de recibir el permiso como dato. La
decisión de Peter (Gate 1, 2026-09-03) es que el hilo funcione **por datos**, no por teclas.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 0 | **Primer paso, antes de construir**: queda escrito en la spec archivada por cuál de los dos caminos llega hoy el pedido de permiso —dato del kit de agentes, o texto leído de la terminal— con el archivo y la línea que lo prueban | La sección de Evidencia contiene esa respuesta con sus rutas |
| 1 | En modo simple, abrir un hilo abre la conversación, nunca una terminal | e2e en modo simple: al abrir un hilo aparece el cuadro de escribir de la conversación y no una terminal |
| 2 | El pedido de permiso llega **como dato** y se dibuja como tarjeta con Permitir y Rechazar; permitir deja correr la herramienta y rechazar la frena, y en los dos casos la conversación sigue | Test unitario del canal con un pedido de permiso simulado: la tarjeta se arma con nombre de herramienta y argumentos; e2e contra el vault de prueba: pedirle al agente que escriba un archivo muestra la tarjeta, Rechazar deja el archivo sin crear y el agente responde que no insiste |
| 3 | La tarjeta dice qué quiere hacer el agente en lenguaje de resultado, no la ruta cruda del archivo | Test de componente: el título es del tipo "Andes wants to write a file" y el detalle es legible |
| 4 | Un subagente se muestra como trabajo en curso adentro de la conversación, con su nombre en lenguaje de resultado, y su resultado queda plegado al terminar | Test unitario del canal con mensajes marcados como de subagente; e2e: pedir una investigación y ver la tarjeta de subagente |
| 5 | La conversación sigue viva entre vueltas: la segunda pregunta no reinicia la sesión | e2e: dos preguntas seguidas, misma sesión |
| 6 | El hilo nace con el alcance puesto: al abrirlo desde el Command Center, el agente ya arranca sobre el workspace elegido y con el primer mensaje que traía el botón | e2e desde el Command Center: el primer mensaje del hilo contiene el nombre de la iniciativa |
| 7 | La conversación deja de estar detrás del ajuste experimental en modo simple: es la superficie por omisión | Test unitario: en modo simple la superficie del hilo no depende de `experimentalNativeChat`; en modo desarrollo el ajuste sigue mandando |
| 8 | Estados incómodos: agente sin sesión iniciada, agente que se cae a mitad y respuesta vacía tienen su mensaje, y ninguno deja la pantalla en blanco ni muestra el error crudo | Test de componente de los tres |
| 9 | La terminal sigue existiendo en modo desarrollo, sin cambios | e2e en modo desarrollo: la pestaña de terminal abre como hoy |
| 10 | Ningún texto usa jerga: ni terminal, ni PTY, ni stream, ni nombres de archivo crudos | Eval de texto sobre las claves nuevas del catálogo inglés |
| 11 | Código sano | `pnpm tc` · `check:code-quality:changed` · `verify:localization-*` en verde; los tests unitarios y e2e nuevos en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-03): **el hilo funciona por datos, no leyendo la pantalla de
  una terminal.** Es lo único que permite dibujar el permiso como tarjeta de verdad y lo que se
  probó el 2026-09-02 contra el vault demo, con cuatro resultados observables en verde.
- DECIDIDO por Peter (2026-09-03): sin terminal a la vista en modo simple.
- DECIDIDO por Peter (2026-08-29): la capa que lanza el binario del agente y la que maneja el inicio
  de sesión no se tocan; el binario es el oficial, sin modificar, con la suscripción del usuario.

**Delegadas al agente, con criterio**

- Si el canal de datos se arma sobre lo que ya existe en `agent-session-wire` o se agrega el kit de
  agentes como dependencia. Criterio: **primero lo que ya existe**; el kit entra solo si el canal
  actual no entrega el permiso como dato, y en ese caso se declara como decisión con su motivo.
- Cómo se traduce el nombre de un subagente a lenguaje de resultado. Criterio: una tabla chica en un
  solo archivo, con un valor por omisión legible para el que no esté en la tabla.
- Qué se hace con la conversación de Orca en modo desarrollo. Criterio: se deja como está, detrás de
  su ajuste experimental.

**Condiciones de parada**

- Si el permiso solo se puede obtener leyendo la pantalla de la terminal y no como dato, **parás y
  reportás**: eso contradice la decisión del Gate 1 y hay que volver a decidir con el costo a la
  vista.
- Si hacer que el hilo funcione por datos exige tocar la capa que lanza el binario o la del inicio
  de sesión, parás y preguntás.
- Si el kit de agentes como dependencia obliga a una clave de interfaz de programación en vez de la
  suscripción del usuario, parás: eso rompe la conformidad heredada.

## Efectos que escapan del sistema

Ninguno propio. El agente sí actúa sobre los archivos de la persona, y por eso el permiso es el
criterio central de esta spec.

## Fuera de alcance, con condición de reactivación

- Varios hilos en paralelo sobre el mismo workspace: se reactiva si al usarlo hace falta.
- El panel derecho del hilo con el foco cargado y los archivos tocados: spec propia.
- Adjuntar archivos a la conversación y arrastrarlos: se reactiva después del primer piloto.
- Voz: fuera de la primera versión.
