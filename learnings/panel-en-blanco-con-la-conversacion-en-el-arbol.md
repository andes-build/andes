# Un panel en blanco con todo en el árbol del documento es geometría, no creación

**Cuándo aplica**: cuando algo "no abre" en la interfaz de Andes y el store ya tiene lo que
debería verse.

El primer chequeo no es si la pestaña existe. Es medir el elemento:

```js
const pane = document.querySelector(`[data-terminal-tab-id="${store.getState().activeTabId}"]`)
pane.getBoundingClientRect()   // 0x0 con display:flex = está montado y no ocupa lugar
document.body.innerText        // si trae el texto de la conversación, se creó todo
```

`toBeVisible()` de Playwright no distingue los dos casos: un elemento de 0x0 dentro de un ancestro
absoluto lo pasa. Las pruebas de interfaz de esta clase afirman sobre `getBoundingClientRect`, no
sobre presencia.

**Por qué el panel puede medir 0x0**: la superposición del panel se posiciona con anclas CSS
(`position-anchor: --orca-tab-group-body-<id del grupo en hexadecimal>`). Si el elemento con ese
`anchor-name` no está en la página, el anclado colapsa a 0x0 **sin ningún error en consola**. El
cuerpo del grupo falta cuando `layoutByWorktree` nombra un grupo que `groupsByWorktree` ya no
tiene.

**El invariante que hay que mirar**: `layoutByWorktree[worktreeId]` y `groupsByWorktree[worktreeId]`
los escriben acciones distintas y quedan en desacuerdo. Volcarlos juntos es el diagnóstico entero:

```js
const s = window.__store.getState()
console.log(s.layoutByWorktree, Object.fromEntries(
  Object.entries(s.groupsByWorktree).map(([k, v]) => [k, v.map((g) => g.id)])))
```

**Cómo se descubrió**: la spec 021. El hilo "no abría" con un workspace elegido; la conversación
entera —el rótulo del alcance y "Start a chat with Claude"— estaba en el árbol del documento, y el
panel medía 0x0.

**No confiar en el arnés e2e para reproducirlo**: en `pnpm test:e2e` el desacuerdo se repara solo
entre la siembra y la aserción; en `pnpm dev` persiste. La reproducción vive en la app real,
manejada por `chromium.connectOverCDP` contra el puerto de depuración.
