# Cómo ver la spec 009 corriendo

Estos pasos levantan Andes desde este worktree (`andes-wt-spec-009`, rama
`spec-009-command-center`) y muestran el Command Center.

## 1. Levantar la app

```
cd /Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-009
pnpm install --frozen-lockfile   # si no lo corriste ya en este worktree
pnpm run dev
```

Arranca en modo simple. No hace falta ninguna variable de entorno.

## 2. Abrir una carpeta preparada

Abrí una carpeta que ya haya pasado por el onboarding de Andes (con `.os/` instalado). Con
ningún hilo activo, la pantalla principal ya no es el estado vacío de Orca ("Add a project"):
es el Command Center.

Lo que tiene que verse:

- Arriba, una sola línea con la acción sugerida (o "nothing urgent" si el arranque no sugirió
  nada).
- Cuatro tarjetas, en este orden: **Waiting for your decision** (la primaria, más grande, una
  fila por ítem con su botón de resolver), **In progress**, **Queued**, **Checks**.
- El contenido de cada tarjeta es la salida real del arranque del núcleo sobre la carpeta, tal
  como salió — no un resumen.

Apretar el botón de una fila de **Waiting for your decision** abre un hilo nuevo (el mismo
camino que "New thread" de la barra lateral) cuyo primer mensaje ya nombra esa iniciativa.

## 3. Los estados incómodos

- **Carpeta sin preparar**: abrí una carpeta sin `.os/`. Aparece el mensaje de carpeta sin
  preparar con un botón para prepararla — nunca la pantalla en blanco ni la salida cruda de un
  error.
- **Arranque lento**: si el escaneo tarda más de diez segundos, la pantalla lo dice y ofrece
  reintentar en lugar de quedar colgada.

## 4. Modo desarrollo: nada cambia

Con `ANDES_INTERFACE_MODE=developer` (o sin la preferencia de modo simple activada) sigue
apareciendo el estado vacío de Orca, "Add a project" — el Command Center no aparece ahí.

## 5. El bloqueante conocido, fuera de esta spec

Con un workspace elegido en el selector de la barra lateral (no en la raíz), el panel del hilo
queda en blanco al abrirlo — le pasa igual al botón "New thread" de la barra lateral, sin pasar
por el Command Center. Es un defecto de `main` (specs 010 y 019), no de esta rama; va a spec
propia. Evidencia: `docs/research/2026-09-04-chequeo-funcional-spec-009/06-comparacion-new-thread-alcance-root-pinta.png`
y `07-comparacion-new-thread-alcance-workspace-en-blanco.png`.

## 6. La prueba automática, si querés verla sola

```
cd /Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-009
pnpm run ensure:electron-runtime
npx playwright test tests/e2e/command-center-simple-mode.spec.ts \
  --config tests/playwright.config.ts --project=electron-headless --workers=1
```

Usa el agente de stub, así que no gasta crédito de una sesión en vivo.
