# 2026-09-04 · Chequeo funcional de la spec 012 — INCOMPLETO

**El criterio 9 no pasa.** El carril de datos de Claude funciona contra el binario real
(criterio 1, `docs/research/2026-09-04-permiso-de-claude-como-dato/`), pero **no se llega a él desde
la aplicación**: ningún camino de la interfaz abre hoy un hilo estructurado de Claude.

## Qué se hizo

Aplicación de desarrollo levantada con `config/scripts/spec-012-functional-check.mjs`, manejada solo
por el puerto de depuración —nunca con clics del sistema, por la advertencia de `CLAUDE.md` sobre
dos instancias que comparten `build.andes.dev`—, sobre una carpeta de prueba en `/tmp` y con el
`HOME` real, porque Claude firma contra él.

| Captura | Qué muestra |
|---|---|
| `01-app-abierta.png` | La aplicación abierta, modo simple, sin carpeta |
| `02-carpeta-agregada.png` | La carpeta de prueba agregada y activa |
| `04-intento-claude.png` | Modo desarrollo, "New tab → Claude": no aparece ningún hilo |
| `05-estado-final-sin-hilo-estructurado.png` | El estado final: tres terminales, ningún hilo estructurado |

## El hallazgo que frena el criterio 9

**El "New thread" del modo simple nunca puede tomar el camino estructurado.** El portón
(`src/renderer/src/lib/launch-agent-in-new-tab.ts`) exige `!hasPrompt`, y el modo simple **siempre**
manda un primer mensaje: el del alcance del hilo, que la spec 019 hizo obligatorio
(`openNewThread` → `buildThreadFirstMessage`, `src/renderer/src/components/sidebar/workspace-scope/open-new-thread.ts:117`).
`agentSession.create` no tiene ranura para un primer mensaje, y por eso ese portón se escribió así
cuando el único carril era Codex.

Con las dos opciones prendidas (`experimentalStructuredNativeChat` y `openAgentTabsInChatByDefault`)
y en modo desarrollo, "New tab → Claude" tampoco abrió un hilo: no se creó pestaña, no hubo aviso de
error, y el proceso principal no registró ningún `agentSession.*`. Queda sin diagnosticar.

## Lo que sí quedó probado sin la aplicación

- El permiso llega como dato y la respuesta vuelve, con permitir y con rechazar, contra el binario
  real: `src/main/claude/claude-structured-permission-as-data.integration.test.ts`.
- El adaptador entero contra un hijo guionado, incluidas las dos respuestas:
  `src/main/claude/claude-structured-session-adapter.test.ts`.
- La tarjeta contesta con el id de la opción y no con una tecla:
  `src/renderer/src/components/native-chat/NativeChatApprovalCard.test.tsx`.

## Cómo se repite

```
node config/scripts/spec-012-functional-check.mjs
```

Deja la aplicación abierta media hora contra el puerto que imprime, y la cierra sola al terminar.
