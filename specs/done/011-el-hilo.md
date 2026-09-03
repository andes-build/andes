---
status: implementada
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

### Ajuste 🔍 sesión supervisora, 2026-09-03 (Peter lo confirma en el Gate 2)

Peter, al ver el hallazgo del criterio 0, pidió priorizar poder crear hilos y conversar cuanto
antes. La sesión supervisora recortó el alcance en dos etapas:

- **Criterio 2 se parte en dos.** **2a** (esta etapa): la tarjeta de permiso se dibuja y sus botones
  funcionan sobre el puente que ya existe hoy —el mismo que prueba el criterio 0, mandando teclas a
  la terminal del agente—, verificado de punta a punta: permitir deja correr la herramienta,
  rechazar la frena, y en los dos casos la conversación sigue. **2b** (spec aparte, no implementada
  acá): que el permiso llegue como dato del kit de agentes en vez de teclas — queda declarada como
  pendiente, con el hallazgo del criterio 0 como su estado previo.
- **Definición de terminado de esta etapa, y nada más**: (1) en modo simple, crear un hilo abre la
  conversación —nunca una terminal—, se puede escribir, el agente responde y la conversación sigue
  viva entre vueltas (criterio 1 y 5); (2) la tarjeta de permiso funciona de punta a punta sobre el
  puente existente (criterio 2a); (3) `COMO-VERLO.md` con los pasos para verlo andar.
- **Diferidos, sin implementar en esta pasada**: criterio 2b (permiso por datos), 3 (texto de
  resultado en la tarjeta — la tarjeta ya lo tenía de antes, no se tocó ni se verificó de nuevo),
  4 (tarjeta de subagente), 6 (arranque con alcance desde el Command Center — Command Center, de la
  spec 009, no está mergeado a `main` todavía), 7 (independencia total de `experimentalNativeChat`
  en modo simple — parcialmente cierto, ver Evidencia), 8 (estados incómodos), 9 (paridad de modo
  desarrollo con la suite completa), 10 (revisión de jerga en textos nuevos — no se agregó texto
  nuevo al catálogo en esta etapa).

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-03): **el hilo funciona por datos, no leyendo la pantalla de
  una terminal.** Es lo único que permite dibujar el permiso como tarjeta de verdad y lo que se
  probó el 2026-09-02 contra el vault demo, con cuatro resultados observables en verde.
- DECIDIDO por Peter (2026-09-03): sin terminal a la vista en modo simple.
- DECIDIDO por Peter (2026-08-29): la capa que lanza el binario del agente y la que maneja el inicio
  de sesión no se tocan; el binario es el oficial, sin modificar, con la suscripción del usuario.
- DECIDIDO por Peter, vía la sesión supervisora (2026-09-03): frente al hallazgo del criterio 0,
  esta pasada entrega el hilo sobre el puente existente (teclas), sin construir el adaptador de
  datos; el criterio 2b —permiso por datos— queda para una spec aparte. Ver el ajuste bajo la tabla
  de criterios.

**Delegadas al agente, con criterio**

- Si el canal de datos se arma sobre lo que ya existe en `agent-session-wire` o se agrega el kit de
  agentes como dependencia. Criterio: **primero lo que ya existe**; el kit entra solo si el canal
  actual no entrega el permiso como dato, y en ese caso se declara como decisión con su motivo.
  — No aplicó en esta etapa: no se construyó el canal de datos (ver ajuste).
- Cómo se traduce el nombre de un subagente a lenguaje de resultado. Criterio: una tabla chica en un
  solo archivo, con un valor por omisión legible para el que no esté en la tabla. — Diferido
  (criterio 4).
- Qué se hace con la conversación de Orca en modo desarrollo. Criterio: se deja como está, detrás de
  su ajuste experimental. **Aplicado**: `experimentalNativeChat` sigue siendo el gate en modo
  developer; ver Evidencia.
- 📌 Delegada por esta sesión, dado el recorte de alcance: cómo probar el criterio 2a sin gastar
  crédito real de una sesión de Claude en vivo. Criterio elegido: el mismo patrón que ya usa
  `tests/e2e/native-chat-ask-user-question-card.spec.ts` — inyectar el estado exacto que produce un
  pedido de permiso real (`agentStatusByPaneKey[...].interactivePrompt`) contra un agente de stub
  determinístico, y verificar con un espía de escritura a PTY que el botón manda el byte correcto.
  Motivo: es el patrón ya establecido en el repo para esta clase de UI, no depende de red ni de
  crédito, y ejercita el camino real de punta a punta —parseo de la tarjeta, click, escritura a
  PTY— sin simular el click en sí. La verificación manual contra el vault de prueba real queda en
  `COMO-VERLO.md` para que Peter la corra él mismo cuando quiera.

**Condiciones de parada**

- Si el permiso solo se puede obtener leyendo la pantalla de la terminal y no como dato, **parás y
  reportás**: eso contradice la decisión del Gate 1 y hay que volver a decidir con el costo a la
  vista. — Esto pasó: ver criterio 0 en Evidencia. Reportado y resuelto por la sesión supervisora
  con el ajuste de arriba.
- Si hacer que el hilo funcione por datos exige tocar la capa que lanza el binario o la del inicio
  de sesión, parás y preguntás. — No aplicó: no se tocó esa capa.
- Si el kit de agentes como dependencia obliga a una clave de interfaz de programación en vez de la
  suscripción del usuario, parás: eso rompe la conformidad heredada. — No aplicó.

## Efectos que escapan del sistema

Ninguno propio. El agente sí actúa sobre los archivos de la persona, y por eso el permiso es el
criterio central de esta spec.

## Fuera de alcance, con condición de reactivación

- Varios hilos en paralelo sobre el mismo workspace: se reactiva si al usarlo hace falta.
- El panel derecho del hilo con el foco cargado y los archivos tocados: spec propia.
- Adjuntar archivos a la conversación y arrastrarlos: se reactiva después del primer piloto.
- Voz: fuera de la primera versión.

## Evidencia

Rama `spec-011-el-hilo`, worktree `andes-wt-spec-011`, sobre `main` en `a970e14c8b` (mismo commit
que declara el "Estado previo" de la spec 009; `git log a970e14c8b..main --stat` no trajo nada
nuevo).

### Criterio 0 — respuesta completa

Hoy el permiso llega **de las dos formas, según el agente**, y para Claude —el agente que usa
Andes— llega **leyendo la terminal y mandando teclas**, no como dato:

- El único adaptador de sesión estructurada (canal de datos) que existe es para Codex:
  `src/main/codex/codex-structured-session-adapter.ts`. La función que decide si un agente puede
  abrir sesión estructurada lo dice explícito en
  `src/main/native-chat/agent-session-wire/structured-agent-session-provider-support.ts:14` —
  `(agent === 'codex' && ...)` — no hay ninguna rama para `claude`.
- Como consecuencia, el hilo de Claude cae siempre al camino viejo:
  `src/renderer/src/components/terminal-pane/TerminalPaneNativeChatPortal.tsx:46` renderiza
  `NativeChatView` en modo `'structured'` solo si `structuredSessionId && structuredChatAgent`; si
  no, cae al `else` (`NativeChatBridgeView`), que es el que le llega a Claude.
- Ese camino termina en
  `src/renderer/src/components/native-chat/NativeChatInteractiveCard.tsx:178-183`, donde el botón
  de la tarjeta hace `onChoose={(raw) => { ...; sendRaw(raw) }}` — `sendRaw` empuja la cadena
  literal a la PTY del agente (el comentario del archivo lo dice: "Sends through the composer's
  verified runtime path... answers via agent-specific paste or selector keystrokes; cancel/deny as
  ESC").
- `src/main/native-chat/agent-session-wire/claude-stream-json-frame-schema.ts` existe y declara los
  tipos del stream-json del kit de agentes, pero nada lo conecta a un adaptador de sesión
  estructurada para Claude — es tipo muerto para este propósito hoy.

Esto contradice la decisión del Gate 1. Reportado a Peter antes de construir; la resolución —
entregar esta etapa sobre el puente existente y dejar el permiso-por-datos como spec aparte
(criterio 2b)— está en el ajuste bajo la tabla de criterios y en `decisions.md`.

### Qué se construyó

- `src/renderer/src/lib/native-chat-initial-view-mode.ts`: `decideInitialAgentTabViewMode` recibe
  `interfaceMode` y abre en `'chat'` sin exigir `experimentalNativeChat` ni
  `openAgentTabsInChatByDefault` cuando `interfaceMode === 'simple'` — en modo developer, los dos
  ajustes siguen mandando igual que antes.
- Ocho puntos de llamada quedaron pasando `interfaceMode` a esa función (antes solo pasaban los dos
  ajustes): `worktree-default-terminal-tabs.ts`, `worktree-initial-terminal-seeding.ts`,
  `launch-agent-in-new-tab.ts` y `terminal-{request,presentation}-ipc-bridge.ts` ya pasaban el
  objeto `settings` completo (llega solo con el tipo ampliado);
  `worktree-draft-startup-view-mode.ts`, `worktree-creation-agent-seeds.ts`,
  `native-chat-launch-session-options.ts` y los tres hooks de `composer-state/` (
  `quick-startup-plan.ts`, `full-submit-preparation.ts`, `folder-submit-orchestration.ts`)
  desestructuraban campo por campo y se les agregó `interfaceMode` a mano.
- `src/renderer/src/components/terminal-pane/use-terminal-pane-chat-state.ts`: el gate real que
  hoy decide si una pestaña *muestra* la conversación en vez de la terminal cruda —
  `nativeChatEnabled` (antes `settings?.experimentalNativeChat === true`, sin excepción, y usado
  tanto para `effectiveChatViewMode` como para `canToggleNativeChat`) — ahora es
  `experimentalNativeChat === true || interfaceMode === 'simple'`. Este fue el gate que realmente
  bloqueaba el criterio 1 (el de `native-chat-initial-view-mode.ts` decide qué pestaña *nace*
  siendo chat; este decide si esa pestaña se *renderiza* como chat).

Nada de esto tocó `src/renderer/src/components/command-center/`, `AppWorkspaceShell.tsx`,
`src/renderer/src/components/sidebar/` ni la vista de archivos — worktrees de las specs 007/009/010
en paralelo, sin tocar.

### Criterio 1 y 5 — el hilo abre la conversación y sigue vivo entre vueltas

e2e nuevo, `tests/e2e/simple-mode-native-chat-thread.spec.ts` (agente de stub dorado como `claude`,
modo simple, sin variable de entorno — es el default):

```
$ npx playwright test tests/e2e/simple-mode-native-chat-thread.spec.ts --config tests/playwright.config.ts --project electron-headless --workers=1

  ✓  1 [electron-headless] › crear un hilo abre la conversación, se escribe y el agente responde entre vueltas (criterio 1) (25.8s)
  ✓  2 [electron-headless] › la tarjeta de permiso: permitir corre la herramienta, rechazar la frena, la conversación sigue (criterio 2a) (24.2s)

  2 passed (1.5m)
```

El primer test confirma: al lanzar el agente la pestaña activa nace mostrando
`[data-native-chat-root="true"]` sin tocar ningún toggle; dos envíos seguidos llegan a la PTY del
agente (espiados con `installTerminalPtyWriteSpy`) sin que cambie el id de la pestaña activa —la
sesión no se reinicia entre vueltas— y la conversación queda visible después de cada uno.

### Criterio 2a — la tarjeta de permiso funciona de punta a punta

El mismo archivo, segundo test: se inyecta en el store el estado exacto que produce un pedido de
permiso real (`agentStatusByPaneKey[paneKey].interactivePrompt`, el mismo campo que llena un hook
real de Claude), aparece la tarjeta "Allow Write?" con sus dos botones, y:

- **Rechazar** escribe el byte `ESC` (`\x1b`) a la PTY del agente (confirmado con el espía de
  escritura), la tarjeta desaparece, y la conversación sigue —el cuadro de escribir sigue visible.
- **Permitir** (con un segundo pedido, para no chocar con el mismo pedido ya respondido) escribe
  `'1'` a la PTY, la tarjeta desaparece, y la conversación sigue.

Verificación manual, con el agente real, contra el vault de prueba: pasos en `COMO-VERLO.md` en la
raíz de este worktree — no corrida por esta sesión (política de trabajo: sin login/crédito real de
Claude dentro del e2e automatizado); queda para que Peter la corra y confirme en el Gate 2.

### Criterio 7 — parcial

En modo simple, la superficie ya no depende de `experimentalNativeChat` (ver arriba). En modo
developer el ajuste sigue mandando exactamente igual que antes — no se tocó esa rama del gate. No
se escribió el test unitario dedicado que pide el criterio (quedó cubierto solo por el e2e); se
declara **no verificado formalmente**, diferido junto con el resto de los criterios de esta spec
que la sesión supervisora sacó del alcance de esta etapa.

### `pnpm tc`

```
$ pnpm run typecheck
$ node config/scripts/run-typecheck-projects-in-parallel.mjs
```

Sin salida — en verde.

### `pnpm run check:code-quality:changed`

```
$ node config/scripts/check-changed-code-quality.mjs
code quality: 0 new finding(s) across 9 changed file(s).
type-aware code quality: 0 new finding(s) across 9 changed file(s).
React Doctor: 0 new finding(s) across 9 changed file(s).
Changed-code quality gate passed since a970e14c8bda.
```

### `verify:localization-*`

```
$ pnpm run verify:localization-catalog
Verified 12457 localization key references against en.json.

$ pnpm run verify:localization-extraction
Extracted 11035 keys; 25 dynamic defaults are report-only, 2698 existing English entries are not statically referenced, and 38 inline defaults differ.

$ pnpm run verify:localization-coverage
Localization coverage check passed with 12 allowlisted candidates.
```

Sin texto nuevo agregado al catálogo en esta etapa (no se tocó ningún componente que renderice
texto nuevo); estos tres corren igual que en `main`.

### Tests unitarios de los archivos tocados

```
$ pnpm exec vitest run --config config/vitest.config.ts \
    src/renderer/src/lib/native-chat-initial-view-mode.test.ts \
    src/renderer/src/components/native-chat/native-chat-launch-session-options.test.ts

 Test Files  2 passed (2)
      Tests  21 passed (21)

$ pnpm exec vitest run --config config/vitest.config.ts \
    src/renderer/src/lib/worktree-creation-agent-seeds.test.ts \
    src/renderer/src/lib/worktree-draft-startup-view-mode.test.ts

 Test Files  2 passed (2)
      Tests  17 passed (17)
```

Los otros archivos tocados (`worktree-default-terminal-tabs.ts`,
`worktree-initial-terminal-seeding.ts`, `launch-agent-in-new-tab.ts`,
`terminal-{request,presentation}-ipc-bridge.ts`, los tres hooks de `composer-state/`, y
`use-terminal-pane-chat-state.ts`) no tienen archivo de test unitario dedicado en el repo; quedan
cubiertos por `pnpm tc`, `check:code-quality:changed` y el e2e nuevo de arriba.

No se corrió la suite completa (`pnpm test` ni `pnpm test:e2e`) — política de trabajo de esta
sesión, acotada a lo tocado; corre entera en el Gate 2 sobre `main`.

## Diferido a la spec de restos

Sin implementar en esta pasada — cada uno queda como criterio abierto para la próxima spec:

- Criterio 2b: el permiso llega como dato del kit de agentes, no por teclas. Estado previo: la
  respuesta del criterio 0 de arriba, con los cuatro archivos y líneas exactos.
- Criterio 3: verificar (o rehacer) que el título de la tarjeta esté en lenguaje de resultado —no
  se tocó `NativeChatApprovalCard.tsx` en esta etapa, así que lo que haya hoy no fue re-verificado.
- Criterio 4: la tarjeta de subagente como trabajo en curso, con nombre en lenguaje de resultado y
  resultado plegado al terminar.
- Criterio 6: el hilo nace con el alcance puesto al abrirlo desde el Command Center — bloqueado
  además porque la spec 009 (Command Center) todavía no está mergeada a `main`.
- Criterio 7 formal: el test unitario dedicado que compara modo simple vs. developer sobre el gate
  de `experimentalNativeChat` — el comportamiento en sí quedó implementado (ver Evidencia), falta
  el test que lo prueba de forma aislada.
- Criterio 8: estados incómodos (agente sin sesión, caída a mitad, respuesta vacía) con su mensaje
  propio.
- Criterio 9: correr la suite e2e completa en modo developer para confirmar que no hay regresión.
- Criterio 10: revisión de jerga (terminal, PTY, stream, rutas crudas) en los textos nuevos — no se
  agregó texto nuevo al catálogo en esta etapa, así que no hay nada que revisar todavía, pero el
  chequeo formal contra el catálogo sigue pendiente para cuando la spec de restos agregue texto.
