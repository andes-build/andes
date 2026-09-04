---
status: implementada
depends_on: [010, 011, 015]
---

# 016 · El hilo usa el agente correcto

En modo simple, "New thread" abría una terminal cruda corriendo
`agy '--dangerously-skip-permissions'`: el agente por omisión de la máquina (Antigravity, sin
superficie de conversación) y el argumento que anula el pedido de permiso. Esta spec decide qué
agente puede lanzar un hilo, qué argumentos puede llevar, y cierra dos defectos vecinos: la
terminal que se abría sola al agregar una carpeta y el aviso de "falta una carpeta" sin acción.

**Tipo**: fallo en producción · **Flujo**: diagnóstico primero

## Estado previo

`main` en `f5665d6db4`. Reportado por Peter probando la app con
`~/Documents/proyectos/ai-first-os-demo` abierta: "New thread" abre "Terminal 2", que corre
`agy '--dangerously-skip-permissions'` y muestra la terminal de Antigravity con Gemini 3.8 Flash.

## Causa

**Tres defectos, dos causas.**

📌 `src/renderer/src/components/sidebar/workspace-scope/open-new-thread.ts:37-41` (en `f5665d6db4`):
la elección del agente era `resolveDefaultAgentForNewTab`, el mismo resolutor del atajo de pestaña
nueva. Ese resolutor honra `settings.defaultTuiAgent` —el agente por omisión de la máquina— y, si
ese no está, recorre `TUI_AGENT_AUTO_PICK_ORDER`. Ninguno de los dos pasos pregunta si el agente
tiene conversación. Con `defaultTuiAgent: 'antigravity'` detectado, el hilo lanzaba Antigravity.

La conversación solo existe para los agentes de
📌 `src/shared/native-chat-agent-support.ts:7-16` (`claude`, `openclaude`, `codex`, `grok`, `omp`),
que es exactamente lo que consulta `decideInitialAgentTabViewMode`
(📌 `src/renderer/src/lib/native-chat-initial-view-mode.ts:44-46`) para devolver `viewMode: 'chat'`.
Con cualquier otro agente devuelve `undefined` y la pestaña queda en terminal: **el defecto 3 es
consecuencia del 1**, no un defecto propio.

📌 `src/shared/tui-agent-launch-defaults.ts:10`: `DEFAULT_TUI_AGENT_ARGS = YOLO_TUI_AGENT_ARGS`. Los
argumentos por omisión de lanzamiento **son** los de omisión de permisos, y
📌 `src/shared/default-global-settings.ts:206` los copia al perfil (`agentDefaultArgs`) en cada
instalación nueva. `launchAgentInNewTab` los resuelve con `resolveTuiAgentLaunchArgs`
(📌 `src/renderer/src/lib/launch-agent-in-new-tab.ts:115-118`) cuando el llamador no pasa
`agentArgs`, y `open-new-thread.ts` no pasaba ninguno.

**La respuesta a la pregunta del Gate 1** (¿ajuste del perfil o código?): **las dos, y el origen es
el código.** En un perfil recién creado por el chequeo funcional de esta spec,
`settings.agentDefaultArgs.claude` ya venía `'--dangerously-skip-permissions'` sin que nadie lo
tocara en `AgentsPane`; ese valor sale de la constante de arriba. Por eso el arreglo no toca los
valores por omisión —eso cambiaría el modo desarrollo, que es Orca— sino que limpia los argumentos
en el camino del modo simple.

**Hallazgo del chequeo funcional, que el diagnóstico de escritorio no anticipaba**: sacar el
argumento no alcanza. Claude Code 2.1.260 lanzado sin argumentos corre en su modo `auto` y escribió
`/tmp/spec016-permiso.txt` sin preguntar nada. La tarjeta de permitir/rechazar solo aparece pidiendo
el modo explícitamente: `claude --permission-mode manual` (valores de `claude --help`:
`acceptEdits, auto, bypassPermissions, manual, dontAsk, plan`).

### Defectos vecinos

- **La terminal que se abre sola al agregar una carpeta.**
  📌 `src/renderer/src/lib/worktree-initial-terminal-seeding.ts:130-133` (en `f5665d6db4`): toda
  activación de un espacio sin pestañas siembra una terminal. En modo simple esa superficie no
  existe.
- **El aviso de "falta una carpeta" sin acción.** Era una decisión declarada abierta de la spec 015
  ("❓ Queda para el Gate: si Peter prefiere una acción también ahí"). Peter la pidió.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | En modo simple el hilo lanza solo un agente con conversación; nunca cae a otro agente ni a un shell | `spec016#1` |
| 2 | En modo simple el comando lanzado no lleva ningún argumento de omisión de permisos | `spec016#2` |
| 3 | Sin agente con conversación: aviso con acción, ninguna pestaña abierta | `spec016#3` |
| 4 | El aviso de falta de carpeta lleva la acción que abre una | `spec016#4` |
| 5 | En modo simple, activar una carpeta no abre una terminal sola | `spec016#5` |
| 6 | En modo desarrollo no cambia nada de lo que Orca hace hoy | `spec016#6` |
| 7 | Prueba de interfaz: el comando lanzado en modo simple no contiene ningún argumento de omisión de permisos | `spec016#7` |
| 8 | Prueba de interfaz: con un agente sin conversación no se abre terminal sino el aviso | `spec016#8` |
| 9 | Código sano | `spec016#9` |
| 10 | Chequeo funcional en la app real, seis pasos con una captura cada uno | `spec016#10` |

## Decisiones

**Tomadas por el agente, con criterio**

- **El hilo del modo simple filtra los agentes por soporte de conversación, no por una lista de un
  solo nombre.** El filtro es `isNativeChatSupportedAgent` más la condición de transcripción local
  (`nativeChatRequiresLocalTranscript`), los mismos dos predicados con los que
  `decideInitialAgentTabViewMode` decide si dibuja la conversación. Descartado: fijar `claude`
  literal, que es lo que hoy tiene todo el mundo instalado pero deja la regla escrita en dos lugares
  con criterios distintos — el día que la conversación soporte otro agente, el hilo seguiría sin
  poder lanzarlo. Dentro del conjunto filtrado se respeta el agente por omisión del operador si
  califica, y si no, el orden de auto-elección compartido, que empieza por Claude Code.
- **Los argumentos se limpian en el camino del modo simple, no en los valores por omisión.**
  `resolveSimpleModeThreadAgentArgs` saca todo argumento de `PERMISSION_BYPASS_ARGS` (los valores de
  `YOLO_TUI_AGENT_ARGS`, de cualquier agente) y deja el resto intacto: un `--model opus` puesto por
  el operador sobrevive. Descartado: cambiar `DEFAULT_TUI_AGENT_ARGS`, que le cambiaría el
  comportamiento al modo desarrollo —Orca— que el pedido declara intocable.
- **El modo simple pide el modo de permisos manual al agente que lo soporta.** Sacar el argumento de
  omisión es necesario y no suficiente: el modo por omisión de Claude Code hoy es `auto` y escribe
  sin preguntar. `ASK_PERMISSION_TUI_AGENT_ARGS` lo declara para `claude` y `openclaude`
  (`--permission-mode manual`, verificado contra `claude --help` de la versión 2.1.260). Un
  `--permission-mode` ya elegido a mano no se pisa. Descartado: confiar en el modo por omisión del
  agente —que fue lo que dejó pasar la escritura en el primer recorrido del chequeo funcional— y
  también inventar el argumento equivalente de `codex`, `grok` y `omp` sin verificarlo contra su
  CLI: esos tres siguen con su propio modo por omisión, y queda anotado abajo.
- **El aviso sin agente nombra Claude Code.** "Claude Code is not installed, so there is no
  conversation to open yet", con la acción que abre "Agents & skills". Descartado: el texto genérico
  de la spec 015 ("No coding agent is installed"), que hoy es falso — el operador puede tener tres
  agentes instalados y ninguno con conversación, que es exactamente el caso de Peter.
- **El aviso sin carpeta ofrece "Open folder", que llama a `addRepo`.** Es la misma acción del botón
  "Add Project" de la pantalla vacía: abre el selector de carpetas del sistema. Cierra la decisión
  que la spec 015 había dejado abierta para el Gate.
- **En modo simple, activar un espacio no siembra ninguna terminal.** El gate está solo sobre el
  sembrado automático: un arranque explícito (un agente sembrado, un script de setup) sigue creando
  su superficie. Descartado: apagar también el sembrado explícito, que rompería el arranque de
  carpeta del onboarding sin que nadie lo haya pedido.
- **El arranque de carpeta del onboarding hereda las dos reglas.** En modo simple
  `buildOnboardingFolderAgentStartup` no siembra un agente sin conversación y no pasa el argumento
  de omisión; en modo desarrollo queda igual que antes, con su propia prueba.

**Condición de parada que no se activó**: ninguna. Sí hubo un obstáculo en el chequeo funcional —ver
abajo—, resuelto sin encadenar workarounds.

## Evidencia

### Chequeo funcional en la app real (criterio 10)

App levantada desde el worktree con `pnpm run dev` y un perfil aislado
(`ORCA_DEV_USER_DATA_PATH=/tmp/andes-spec016-profile`), con `defaultTuiAgent: 'antigravity'` puesto
a mano para reproducir la máquina de Peter. Capturas en
`docs/research/2026-09-03-chequeo-funcional-spec-016/`.

1. `paso-1-carpeta-abierta-sin-terminal.png` — `~/Documents/proyectos/ai-first-os-demo` abierta, el
   árbol de archivos a la derecha, **cero pestañas**: no se abre ninguna terminal sola.
2. `paso-2-hilo-claude-code-conversacion.png` — "New thread" abre una pestaña **"✳ Claude Code"** con
   la conversación ("Start a chat with Claude"), no una terminal, aunque el agente por omisión de la
   máquina sea Antigravity.
3. `paso-3-respuesta-del-agente.png` — "hola" enviado, Claude Code responde en la conversación.
4. `paso-4-tarjeta-de-permiso.png` — pedido de escribir `/tmp/spec016-permiso2.txt`: aparece la
   tarjeta **"Allow Write?"** con Allow y Deny.
5. `paso-5-rechazo-sin-archivo.png` — rechazado: `ls /tmp/spec016-permiso2.txt` da
   "No such file or directory" y la conversación sigue (se le pide "contestá solo: ok" y contesta).
6. `paso-6-comando-sin-omision-de-permisos.png` — la misma sesión vista como terminal: la línea de
   estado de Claude Code dice **"manual mode on"** y la traza dice "User rejected write to
   …/tmp/spec016-permiso2.txt". El registro de lanzamiento de la app
   (`agentLaunchConfigByPaneKey`) para ese panel es
   `{"agentCommand":"claude '--permission-mode' 'manual'","agentArgs":"--permission-mode manual","agentEnv":{}}`.

**El recorrido se corrió dos veces.** En el primero los pasos 1, 2, 3 y 6 pasaron y el 4 falló:
Claude Code escribió el archivo sin preguntar, con el comando ya limpio (`agentArgs: ""`). Eso
produjo la decisión del modo manual; con ella, el recorrido entero vuelve a pasar.

**Obstáculo, y cómo se resolvió**: los dos builds de desarrollo comparten identificador de paquete
(`build.andes.dev`, constante a propósito — `config/scripts/dev-electron-bundle-identity.mjs:10`),
así que el control de pantalla resuelve una sola de las dos ventanas y en esta máquina resolvía la
de la app que Peter ya tenía abierta desde `andes-mirar`. Manejar esa ventana habría sido escribir
sobre la sesión de otro. El recorrido se hizo sobre la ventana propia por el puerto de depuración
del build del worktree (`127.0.0.1:9499`), que es la app real corriendo, no un entorno de prueba: lo
único que cambia es que el clic y el tecleo entran por ahí en vez de por el mouse. Los scripts
auxiliares no quedaron en el repo.

### Pruebas

- **Las dos pruebas de interfaz fallan con el código de `main`**: con `open-new-thread.ts` de `main`
  en su lugar, `spec016#7` muere esperando que la pestaña lleve `claude` (recibe `null`) y `spec016#8`
  no encuentra el aviso. Con el arreglo pasan las dos en 11 s.
- `npx playwright test tests/e2e/simple-mode-thread-agent.spec.ts --project=electron-headless
  --workers=1`: 2 pasan.
- `bash evals/run.sh`: **97 pasan · 0 fallan**.
- `pnpm tc`: en verde.
- `pnpm run check:code-quality:changed`: `Changed-code quality gate passed since f5665d6db4ad` — 0
  hallazgos nuevos en los 3 chequeos.
- `pnpm test` sobre los archivos tocados: `open-new-thread.test.ts` (8),
  `simple-mode-thread-launch.test.ts` (9), `worktree-activation-simple-mode-terminal.test.ts` (3),
  `onboarding-folder-agent-startup.test.ts` (10 de 11).
- `pnpm run verify:localization-catalog` / `-extraction` / `-coverage`: en verde.
- ⚠️ **Rojos pre-existentes, verificados contra el código de `main` en este mismo checkout**:
  `Sidebar.test.tsx` (6 pruebas) y `onboarding-folder-agent-startup.test.ts > omits native-chat
  preferences from terminal-default folder launches` fallan igual sin ninguno de estos cambios. Es
  el mismo cuadro que dejó anotado el último commit de `main` (idioma del entorno).

## Pendientes que esta spec no cierra

- **El modo de permisos de `codex`, `grok` y `omp` en modo simple.** Solo `claude` y `openclaude`
  declaran su argumento de "preguntar siempre"; los otros tres arrancan con el modo por omisión de su
  CLI, que no está verificado. Si alguno también escribe sin preguntar, se agrega a
  `ASK_PERMISSION_TUI_AGENT_ARGS` con la verificación al lado.
- **Las variables de entorno de omisión de permisos** (`YOLO_TUI_AGENT_ENV`, hoy solo
  `goose: GOOSE_MODE=auto`) no se limpian: `launchAgentInNewTab` no acepta un `agentEnv` del
  llamador y `goose` no tiene conversación, así que el modo simple nunca lo lanza. Si algún agente
  con conversación suma una variable así, hay que abrir ese camino.
- **La conversación no muestra el agente en la pestaña de un hilo sin arrancar**: `tab.viewMode`
  queda `undefined` en el store aunque la vista sea la conversación (visto en las dos pruebas de
  interfaz). No afecta lo que se ve; queda como rareza anotada.
- Lo que la spec 015 dejó abierto y sigue abierto: el permiso llega por teclas y no como dato
  (criterio 2b de la spec 011), y el hilo no nace con el alcance del Command Center puesto.
