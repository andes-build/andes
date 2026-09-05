# 2026-09-04 · Chequeo funcional de la spec 025 — PASA

**El criterio 8 pasa.** Recorrido completo en la app real (Electron, modo simple, agente stub —
sin gastar crédito de Claude): conversación, Command Center y Files, en claro y en oscuro.

## Cómo se corre

```
ORCA_DEV_USER_DATA_PATH=/tmp/andes025 npx playwright test \
  tests/e2e/spec-025-light-mode-canvas.spec.ts \
  --config tests/playwright.config.ts --project=electron-headless --workers=1
```

El test fuerza el tema con `store.getState().updateSettingsOrThrow({ theme })` en vez de navegar el
menú de Ajustes — es el mismo mecanismo que usa el selector real (agrega/saca la clase `.dark` del
`<html>`), y evita depender del tema del sistema operativo del host.

## Las capturas

| Captura | Qué muestra |
|---|---|
| `01-conversacion-claro.png` | Conversación vacía ("Start a chat with Claude"), claro |
| `02-command-center-claro.png` | Command Center, claro |
| `03-archivos-claro.png` | Files con un archivo abierto, claro |
| `04-archivos-oscuro.png` | Files con un archivo abierto, oscuro |
| `05-command-center-oscuro.png` | Command Center, oscuro |
| `06-conversacion-oscuro.png` | Conversación (hilo nuevo), oscuro |

## Qué se ve

**Claro (`01`, `03`)**: el fondo de contenido es un gris muy claro (`#ececea`), no blanco. La barra
lateral sigue negra (`#141413`) y se distingue del contenido a simple vista — ya no hay un corte
duro blanco-contra-negro. En `03`, el árbol de archivos y la fila del archivo activo
(`diff-note-layout.ts`) leen más claros que el fondo, como una superficie apoyada encima.

**Oscuro (`04`, `05`, `06`)**: sin cambios — mismo fondo casi negro (`#0a0a0a`) y misma barra
lateral que antes de esta spec. El código pinneado en
`src/renderer/src/assets/light-mode-canvas-tokens.test.ts` (criterio 5) lo confirma a nivel de
tokens; estas capturas lo confirman a nivel de pantalla.

**Command Center (`02`)** quedó capturado en su estado "Reading your workspace…" — el test no
esperó a que terminara de cargar las tarjetas, porque el gris de fondo (lo que importa acá) ya es
visible desde el primer frame. No hace falta re-correrlo por eso.
