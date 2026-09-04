---
status: pendiente
depends_on: [009]
---

# 013 · El hilo se ve como un hilo

Los hilos dejan de abrirse como pestañas y pasan a listarse en la barra lateral. Arriba de la
conversación aparece el título del hilo con el workspace y el foco, y desaparece de la pantalla todo
rastro de comandos y nombres de herramienta.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `d97c8cc07c`. El agente corre `git log d97c8cc07c..main --stat` antes de empezar. Se
implementa **después** de que la spec 009 esté en `main`: las dos tocan la barra lateral.

- "New thread" (`SimpleModeNav.tsx:69`) llama a `openNewThread()`, que en `open-new-thread.ts:97-105`
  lanza `launchAgentInNewTab`, y esa función crea una **pestaña** en
  `launch-agent-in-new-tab.ts:213-218`.
- La pestaña ya guarda todo lo que esta spec necesita: `title`, `generatedTitle`, `aiVaultTitle`,
  `customTitle`, `launchAgent`, `threadScope` y `createdAt` — `src/shared/terminal-tab-types.ts:6-63`.
- Arriba de la conversación hoy hay una sola línea y ningún título: `ThreadScopeBadge.tsx:36-51`,
  montado en `TerminalPaneNativeChatPortal.tsx:47`. Con `threadScope` en `null` no dibuja nada
  (`ThreadScopeBadge.tsx:40-42`).
- El renglón `2× Bash …` lo arma `NativeChatToolRun.tsx:177-178` con `countToolCalls` y
  `summarizeToolRun` (`src/shared/native-chat-tool-summary.ts:235-252`), que concatena el nombre de
  la herramienta con `briefToolArg(input)` (líneas 147-168). El bloque de origen no trae texto
  legible: `NativeChatToolCallBlock` es `{ type, name, input, state? }`
  (`src/shared/native-chat-types.ts:50-56`).
- Ya existe una lista de hilos **abiertos**, la del atajo Cmd+J:
  `src/renderer/src/lib/recent-workspace-tab-rows.ts:25-42`, con su orden por recencia en la línea
  192. **No existe** historial de hilos cerrados.
- Claude Code escribe el título en el archivo de su sesión: `{"type":"ai-title","aiTitle":…}` y
  `{"type":"custom-title","customTitle":…}`. El escáner de sesiones de Andes ya modela eso en
  `src/shared/ai-vault-session-title.ts:6-10`.
- La maqueta aprobada es el tablero `Hilo` del lienzo de diseño de Andes:
  claude.ai/code/artifact/18c77072-09f3-4c87-a18d-f900ad67146a
- ❓ Lo que la lectura previa no cerró: quién llena hoy `generatedTitle` y `aiVaultTitle`. El agente
  lo averigua antes de tocar nada.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | En modo simple no hay barra de pestañas; los hilos abiertos se listan en la barra lateral bajo "Recent threads" | e2e: abrir dos hilos, la barra lateral muestra dos filas y no existe ningún elemento de la tab bar en el árbol |
| 2 | La lista muestra solo los hilos del workspace elegido, por actividad, con el abierto marcado | Test unitario de la proyección con tres hilos de dos workspaces |
| 3 | Clic en una fila abre ese hilo; "New thread" crea uno y lo deja seleccionado | e2e del recorrido |
| 4 | Arriba de la conversación va el título del hilo y debajo `workspace · foco: <nombre>`, con "My work" en la raíz | Test de componente con los dos alcances; e2e verifica el renglón |
| 5 | El título sale del CLI: `custom-title` gana sobre `ai-title`; sin ninguno el hilo se llama "New thread". Renombrar a mano gana sobre los dos | Test unitario de la resolución con las cuatro combinaciones |
| 6 | Un CLI que no escribe título se degrada declarándolo: no se inventa un título | Test unitario con una sesión sin registro de título |
| 7 | La conversación no muestra nombres de herramienta, comandos ni rutas: va una línea de actividad en lenguaje de persona, y si el evento no se puede redactar así dice "Working…" y nada más | Eval de texto sobre el redactor con Bash, Read, Write, Grep y Task: ninguna salida contiene un nombre de herramienta, una ruta con `/`, ni acento grave. Rúbrica de la redacción: verbo en presente + qué se está mirando o escribiendo, sin nombre propio de archivo (bien: "leyendo la decisión del proveedor de pagos"; mal: "leyendo decisions.md") |
| 8 | En modo desarrollo no cambia nada: pestañas y línea de herramientas como hoy | e2e en modo desarrollo |
| 9 | Código sano | `pnpm tc` · `check:code-quality:changed` · `verify:localization-*` y los tests nuevos en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-04): los hilos van en la barra lateral, no en pestañas, con la
  cabecera de la maqueta. Las pestañas son vocabulario de editor de código y contradicen el modo
  simple.
- DECIDIDO por Peter (Gate 1, 2026-09-04): la interfaz no muestra comandos ni nombres de herramienta.
  Hoy se lee `2× Bash .os/core/lib/session-start.s`, que es código y no le dice nada a quien no
  programa.
- DECIDIDO por Peter (Gate 1, 2026-09-04): el título del hilo se comporta como el de Claude Code por
  omisión — lo genera el CLI a partir de la conversación y se puede renombrar.
- DECIDIDO por Peter (2026-09-03): un solo idioma, inglés. Los rótulos son "Recent threads" y
  "New thread", aunque la maqueta esté escrita en español.

**Delegadas al agente, con criterio**

- Si las pestañas se borran o se esconden en modo simple. Criterio: se esconden — el modo desarrollo
  las usa y el criterio 8 las exige.
- Cuántos hilos entran en la lista antes de cortar. Criterio: los que entren sin barra de
  desplazamiento; el resto queda para el historial, que no es de esta spec.
- Dónde vive la lista. Criterio: reutiliza la proyección de `recent-workspace-tab-rows.ts` en vez de
  escribir una segunda.

**Condiciones de parada**

- Si sacar la barra de pestañas del modo simple obliga a tocar la capa que lanza el binario del
  agente, para y pregunta.
- Si el título del CLI solo se puede leer abriendo un archivo fuera de la carpeta de datos de la
  app, para y pregunta.
- Si el criterio 2 exige el historial de hilos cerrados, para: es spec aparte.

## Efectos que escapan del sistema

Ninguno.

## Fuera de alcance, con condición de reactivación

- Historial de hilos cerrados, el "Ver historial" de la maqueta: se reactiva cuando alguien pida
  recuperar un hilo que cerró.
- Los archivos del hilo, el botón "Archivos del hilo · 2" de la maqueta: se reactiva cuando el hilo
  adjunte archivos.
- La tarjeta de subagente, diferida desde la spec 011.
