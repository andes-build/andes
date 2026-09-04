# Cómo ver la spec 015 corriendo

Estos pasos levantan Andes desde este worktree (`andes-wt-spec-015`, rama
`spec-015-el-hilo-responde`) y muestran el hilo respondiendo de verdad.

## 1. Levantar la app

```
cd /Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-015
pnpm install --frozen-lockfile   # si no lo corriste ya en este worktree
pnpm run dev
```

Arranca en modo simple. No hace falta ninguna variable de entorno.

## 2. Abrir una carpeta y crear el hilo

Abrí cualquier carpeta (sirve una sin subcarpeta `workspaces/`: el hilo no la necesita) y hacé clic
en **New thread** en la barra lateral.

Lo que tiene que pasar:

- La pestaña nueva se llama con el nombre del agente, **no** "Terminal N".
- La conversación abre y el agente arranca solo.
- Escribís "hola", apretás Enter, y la respuesta aparece como burbuja.

Antes de esta spec la pestaña se llamaba "Terminal 2", lo escrito iba a un shell y no volvía nada.

## 3. Los dos callejones sin salida

- **Sin agente instalado**: sacá `claude`/`codex` del `PATH` y hacé clic en New thread. Aparece el
  aviso "No coding agent is installed, so there is nobody to talk to yet." con el botón
  "Agents & skills". No se abre ninguna pestaña.
- **Sin carpeta abierta**: aparece "Open a folder before starting a thread."

## 4. La prueba automática, si querés verla sola

```
cd /Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-015
pnpm run ensure:electron-runtime
npx playwright test tests/e2e/simple-mode-thread-answers.spec.ts \
  --config tests/playwright.config.ts --project=electron-headless --workers=1
```

Usa el agente de stub, así que no gasta crédito de una sesión en vivo.
