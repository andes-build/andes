---
status: implementada
depends_on: [010, 011]
---

# 015 · El hilo responde

En modo simple, "New thread" abría la conversación sobre una pestaña de terminal que nunca lanzaba
el agente: lo que el operador escribía llegaba a un shell y nada se dibujaba de vuelta. Esta spec
hace que crear un hilo lance el agente detectado y que los dos callejones sin salida —sin carpeta,
sin agente instalado— se digan en pantalla en vez de quedar en silencio.

**Tipo**: fallo en producción · **Flujo**: diagnóstico primero

## Estado previo

`main` en `90890c6cbb`. Reportado por Peter probando la app: abre un hilo, escribe "hola" y no pasa
nada. Dos pestañas abiertas, "Claude Code" y "Terminal 2", con la conversación montada sobre la
segunda.

## Causa

📌 `src/renderer/src/components/sidebar/workspace-scope/SimpleModeNav.tsx:21-35` (en `90890c6cbb`):

```
function openNewThread(): void {
  const state = useAppStore.getState()
  const worktreeId = state.activeWorktreeId
  if (!worktreeId) { return }
  const launchAgent = state.detectedAgentIds?.[0]
  state.setActiveView('terminal')
  state.createTab(worktreeId, undefined, undefined, {
    viewMode: 'chat', activate: true, recordInteraction: true,
    ...(launchAgent ? { launchAgent } : {})
  })
}
```

`createTab` con `launchAgent` **etiqueta** la pestaña; no lanza nada.
📌 `src/renderer/src/store/terminals/terminal-tab-creation.ts:131`: la opción solo se copia al
objeto de la pestaña.

Lo que lanza el binario del agente es el comando de arranque encolado aparte.
📌 `src/renderer/src/lib/launch-agent-in-new-tab.ts:203-231`: el único camino que crea la pestaña
**y** llama a `queueTabStartupCommand` con `startupPlan.launchCommand`. `openNewThread` no pasaba
por ahí, así que el PTY levantaba el shell de login. La vista de chat quedaba montada encima de un
shell: lo escrito iba a `zsh` y su salida no se dibujaba porque la conversación solo lee
transcripciones de agente.

Segundo defecto, en el mismo camino: la detección de agentes es perezosa.
📌 `src/renderer/src/store/slices/local-detected-agent-store-state.ts:35`: `detectedAgentIds`
arranca en `null` y solo lo llena `ensureDetectedAgents`, que `openNewThread` nunca llamaba. En una
carpeta recién abierta la etiqueta también salía vacía, y la pestaña se quedaba con su título por
omisión —`Terminal 2`, 📌 `terminal-tab-creation.ts:92`—, que es exactamente lo que vio Peter.

### Hipótesis descartadas

- **El hilo exige un alcance de workspace.** No: lo único que exige es `activeWorktreeId`. La
  leyenda "No workspaces yet" es el estado vacío del listado de la barra lateral
  (📌 `SimpleModeScopeEmptyState.tsx:18-28`, spec 010 criterio 10) y no participa de la creación del
  hilo. Una carpeta sin subcarpeta `workspaces/` abre hilos igual.
- **`spawn codex ENOENT`.** Ruido de la detección de agentes probando binarios ausentes; no toca
  este camino.

### Por qué el eval de la spec 010 no lo agarró

📌 `SimpleModeNav.test.tsx:63-92` (en `90890c6cbb`) afirmaba la forma del argumento de `createTab` y
nada más. Una pestaña que abre un shell pelado pasaba ese chequeo. Y el e2e de la spec 011
(📌 `tests/e2e/simple-mode-native-chat-thread.spec.ts:47`) nunca usa el botón "New thread": lanza el
agente desde el menú de la barra de pestañas, que sí pasa por `launchAgentInNewTab`.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | Crear un hilo encola el comando de arranque del agente detectado, nunca un shell pelado | `spec015#1` |
| 2 | El hilo abre como conversación en modo simple, con el agente puesto en la pestaña | `spec015#2` |
| 3 | Sin agente instalado, la pantalla lo dice y ofrece una acción; no abre ninguna pestaña | `spec015#3` |
| 4 | Sin carpeta abierta, la pantalla lo dice; no abre ninguna pestaña | `spec015#4` |
| 5 | Prueba de interfaz: escribir un mensaje en el hilo trae una respuesta del agente, con un agente simulado | `spec015#5` |
| 6 | El botón delega en el lanzador del hilo y nunca vuelve a `createTab` crudo | `spec015#6` |
| 7 | Código sano | `spec015#7` |

## Decisiones

**Tomadas por el agente, con criterio**

- **El hilo pasa por `launchAgentInNewTab`, no por una segunda ruta de lanzamiento.** Es el único
  camino que ya sabe resolver el comando, los argumentos, el entorno, la plataforma y las opciones
  de sesión, y el que decide `viewMode: 'chat'` para modo simple
  (📌 `native-chat-initial-view-mode.ts:34`). Descartado: encolar el comando de arranque a mano
  desde `SimpleModeNav` — duplicaría esa resolución y volvería a divergir en la próxima vuelta.
- **La elección del agente usa `resolveDefaultAgentForNewTab`, no `detectedAgentIds[0]`.** Respeta
  el agente por omisión del operador y saltea los deshabilitados. Descartado: el primero de la
  lista, que es orden de detección y no una preferencia.
- **La detección se espera antes de decidir.** `openNewThread` llama a `ensureDetectedAgents` y usa
  lo que devuelve. Descartado: leer `detectedAgentIds` del store, que es justo lo que fallaba en una
  carpeta recién abierta.
- **Los dos callejones sin salida se avisan con un aviso emergente (`toast`), el mecanismo que el
  repo ya usa para fallas de lanzamiento** (📌 `fix-checks-agent-launch.ts:41`). Sin agente
  instalado el aviso lleva una acción que abre "Agents & skills"; sin carpeta abierta va sin acción,
  porque no hay una sola acción correcta —abrir carpeta vive en el onboarding, no en una acción del
  store— y inventar una sería peor que el mensaje solo. ❓ Queda para el Gate: si Peter prefiere una
  acción también ahí, la decisión es cuál.
- **El agente simulado del e2e responde escribiendo una transcripción.** El stub dorado acepta
  `--transcript <ruta>` y, por cada línea enviada, escribe el turno del usuario y una respuesta del
  asistente en formato Claude. Descartado: inyectar una transcripción fija desde la prueba —probaría
  que la conversación dibuja un archivo, no que lo escrito llega a un agente y vuelve—. La prueba
  sigue apuntando la sesión del proveedor a mano porque el stub no instala el hook que la declara.

**Condición de parada que no se activó**: ninguna. El diagnóstico cerró con archivo y línea sin
decisiones abiertas de producto.

## Evidencia

- **La prueba de interfaz falla sin el arreglo.** Con `SimpleModeNav.tsx` de `main` en su lugar,
  `tests/e2e/simple-mode-thread-answers.spec.ts` muere esperando la respuesta del agente en
  `simple-mode-thread-answers.spec.ts:106`; la pestaña llega a llevar `launchAgent: 'claude'` y aun
  así no hay respuesta, que es la prueba directa de que la etiqueta no lanza nada. Con el arreglo
  pasa en 24,1 s.
- `bash evals/run.sh`: `87 pasan · 0 fallan`.
- `pnpm tc`: en verde.
- `pnpm run check:code-quality:changed`: `Changed-code quality gate passed since 90890c6cbbae` —
  0 hallazgos nuevos en los 3 chequeos.
- `pnpm run verify:localization-catalog` / `-extraction` / `-coverage`: en verde.
- `pnpm test` sobre `open-new-thread.test.ts` y `SimpleModeNav.test.tsx`: 6 pruebas en verde.
- `npx playwright test tests/e2e/simple-mode-thread-answers.spec.ts --project=electron-headless
  --workers=1`: 1 pasa.
- ⚠️ `pnpm run typecheck:e2e` ya estaba en rojo en `main` por archivos ajenos a esta spec
  (`worktree-jump-palette-filter.spec.ts`, `worktree-lineage-state.ts` y otros). Ninguno de sus
  errores toca los archivos de esta spec.

## Pendientes que esta spec no cierra

- El permiso sigue llegando por teclas y no como dato (criterio 2b de la spec 011).
- El hilo no nace con el alcance del Command Center puesto (criterio 6 de la spec 011).
