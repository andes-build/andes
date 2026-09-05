---
status: implementada
depends_on: []
---

# 025 · El modo claro no es blanco y negro

En modo claro la barra lateral es negra y el área de contenido es blanca, y el contraste entre las
dos parte la pantalla. El área de contenido pasa a un gris muy claro; la barra lateral sigue oscura.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `da55c96187`. El agente corre `git log da55c96187..main --stat` antes de empezar.

Se ve en las capturas de los chequeos funcionales de las specs 012 y 013: barra lateral negra contra
fondo blanco puro. La paleta viene heredada de Orca; el agente ubica dónde vive antes de tocar nada
—❓ no está escrito acá porque no se verificó— y cambia **los tokens**, nunca color a color en cada
componente.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | En modo claro el área de contenido es un gris muy claro, no blanco puro | Test unitario sobre los tokens: el fondo de contenido en claro no es `#ffffff` |
| 2 | La barra lateral sigue oscura y sigue leyéndose como una pieza aparte | Captura del chequeo funcional, con la barra distinguible del contenido |
| 3 | El texto sobre el fondo nuevo cumple contraste de accesibilidad | Test unitario que calcula el contraste de texto primario, secundario y deshabilitado contra el fondo nuevo: todos ≥ 4.5:1 el primario y ≥ 3:1 los demás |
| 4 | Las superficies que se apoyan sobre el fondo siguen distinguiéndose | Test unitario: tarjetas, campos y menús no quedan del mismo color que el fondo |
| 5 | El modo oscuro no cambia | Test unitario de los tokens oscuros, sin diferencias |
| 6 | El cambio está en los tokens, no repartido por componentes | `git diff --stat`: los archivos de color cambian; ningún componente incorpora un color literal nuevo. Eval que busca colores literales agregados en el diff |
| 7 | Código sano | `pnpm tc` · `check:code-quality:changed` en verde |
| 8 | Chequeo funcional en la app real | Capturas en claro y en oscuro, de la conversación, el Command Center y los archivos |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (2026-09-04): en modo claro no quiere el contraste de negro contra blanco. La
  barra lateral oscura se queda; el contenido va a un gris muy claro.

**Delegadas al agente, con criterio**

- Qué gris exactamente. Criterio: que se despegue del blanco lo suficiente para que la barra lateral
  no corte la pantalla, y que las tarjetas blancas encima sigan leyéndose como elevadas. Se elige
  con las capturas a la vista, no en abstracto.

**Condiciones de parada**

- Si cambiar el token del fondo rompe una superficie heredada de Orca que el modo simple no muestra,
  declaralo y seguí; si rompe una que sí muestra, para y reporta.

## Efectos que escapan del sistema

Ninguno.

## Fuera de alcance, con condición de reactivación

- Un tema propio de Andes, distinto del heredado: se reactiva cuando haya identidad visual definida.
- Que la persona elija el color: no hay pedido.

## El ❓ resuelto: dónde viven los tokens

`src/renderer/src/assets/main.css`. `:root` (claro) y `.dark` (oscuro) definen variables CSS
(`--background`, `--card`, `--sidebar`, etc.) que Tailwind mapea a utilidades (`bg-background`,
`bg-card`...) usadas en **375 archivos** de componentes — confirmado con
`grep -rl "bg-background\b" src/renderer/src`. Un solo cambio en el token se propaga solo.

## Evidencia

### Criterio 1 — el fondo de contenido en claro no es blanco puro

`--background` en `:root` pasa de `#fff` a `#ececea`
(`src/renderer/src/assets/main.css:167`).

```
$ npx vitest run --config config/vitest.config.ts -t "criterio 1" src/renderer/src/assets/light-mode-canvas-tokens.test.ts
 Test Files  1 passed (1)
      Tests  1 passed | 4 skipped (5)
```

### Criterio 2 — la barra lateral sigue oscura y se distingue

`--sidebar`/`--worktree-sidebar` no se tocaron (`#141413`, sin cambios). La foto en
`docs/research/2026-09-04-chequeo-funcional-spec-025/01-conversacion-claro.png` y
`03-archivos-claro.png` muestra la barra negra contra el contenido gris, ya no blanco.

```
$ npx vitest run --config config/vitest.config.ts -t "criterio 2" src/renderer/src/assets/light-mode-canvas-tokens.test.ts
 Test Files  1 passed (1)
      Tests  1 passed | 4 skipped (5)
```

### Criterio 3 — contraste de texto contra el fondo nuevo

Contra `--background` (`#ececea`): `--foreground` (`#0a0a0a`) da **16.7:1** (≥4.5:1) y
`--muted-foreground` (`#737373`, el texto secundario y el que los estados deshabilitados oscurecen
con `disabled:opacity-*`) da **4.0:1** (≥3:1).

```
$ npx vitest run --config config/vitest.config.ts -t "criterio 3" src/renderer/src/assets/light-mode-canvas-tokens.test.ts
 Test Files  1 passed (1)
      Tests  1 passed | 4 skipped (5)
```

### Criterio 4 — las superficies elevadas siguen distinguiéndose

`--card`, `--popover`, `--secondary`, `--muted`, `--accent` e `--input` no se tocaron: siguen en
`#fff`/`#f5f5f5`, distintos de `#ececea`. La escalera de elevación gana un escalón (fondo gris →
superficie muted, más clara → tarjeta blanca) en vez de perder el que ya tenía — ver
`03-archivos-claro.png`, donde el árbol de archivos y la fila activa leen más claros que el fondo.

```
$ npx vitest run --config config/vitest.config.ts -t "criterio 4" src/renderer/src/assets/light-mode-canvas-tokens.test.ts
 Test Files  1 passed (1)
      Tests  1 passed | 4 skipped (5)
```

### Criterio 5 — el modo oscuro no cambia

`.dark` no se tocó. El test fija los valores de antes de esta spec (`background`, `foreground`,
`card`, `popover`, `secondary`, `muted`, `muted-foreground`, `accent`, `border`, `input`, `sidebar`,
`worktree-sidebar`) y falla si alguno se mueve.

```
$ npx vitest run --config config/vitest.config.ts -t "criterio 5" src/renderer/src/assets/light-mode-canvas-tokens.test.ts
 Test Files  1 passed (1)
      Tests  1 passed | 4 skipped (5)
```

### Criterio 6 — el cambio está en los tokens, no repartido por componentes

Contra `main` (base de esta rama): `main.css` es el único archivo de color con diff, ningún
`.tsx`/`.jsx` cambió, y no hay un color literal (`#hex`/`rgb(...)`) agregado fuera de `main.css` y
de los tests/documentación de esta misma spec.

```
$ git diff --stat main..HEAD -- src/renderer/src/assets/main.css
 src/renderer/src/assets/main.css | 5 ++++-
 1 file changed, 4 insertions(+), 1 deletion(-)

$ git diff --name-only main..HEAD -- '*.tsx' '*.jsx'
(vacío)
```

### Criterio 7 — código sano

```
$ pnpm tc
$ node config/scripts/check-changed-code-quality.mjs main
code quality: 0 new finding(s) across 1 changed file(s).
type-aware code quality: 0 new finding(s) across 1 changed file(s).
React Doctor: 0 new finding(s) across 1 changed file(s).
Changed-code quality gate passed since 5c183b2e7cf1.
```

`main` explícito porque `origin/main` (`d97c8cc07c`) está desactualizado contra el `main` local de
este repo (`c62026de64`) — el default del script arrastra hallazgos preexistentes ajenos a esta
rama. Con `main..HEAD` (el merge-base real de esta rama) el gate da limpio.

### Criterio 8 — chequeo funcional en la app real

`docs/research/2026-09-04-chequeo-funcional-spec-025/` — conversación, Command Center y archivos,
en claro y en oscuro, con el agente stub (spec 011) en modo simple. Detalle y capturas en el
`README.md` de esa carpeta.

```
$ ORCA_DEV_USER_DATA_PATH=/tmp/andes025 npx playwright test tests/e2e/spec-025-light-mode-canvas.spec.ts \
    --config tests/playwright.config.ts --project=electron-headless --workers=1
  ✓ spec025#8 conversación, Command Center y archivos en claro y en oscuro
  1 passed (14.4s)
```

### Corrida completa de los evals de esta spec (dos veces, `evals/run.sh`)

```
PASS spec025#1 en modo claro el área de contenido es un gris muy claro, no blanco puro
PASS spec025#2 la barra lateral sigue oscura y se lee como una pieza aparte
PASS spec025#3 el texto (primario, secundario/deshabilitado) cumple contraste contra el fondo nuevo
PASS spec025#4 las superficies que se apoyan sobre el fondo (tarjetas, campos, menús) siguen distinguiéndose
PASS spec025#5 el modo oscuro no cambia
PASS spec025#6 el cambio está en los tokens (main.css), no repartido por componentes
PASS spec025#7 código sano (pnpm tc · check:code-quality:changed en verde)
PASS spec025#8 chequeo funcional en la app real (conversación, Command Center y archivos, claro y oscuro)
8 pasan · 0 fallan
```
Corrida dos veces (idéntico resultado las dos), por la advertencia de `CLAUDE.md` sobre worktrees
nuevos.

## Lo que queda abierto

Ninguno de los 8 criterios queda abierto. Fuera del alcance de esta spec, sin abrir por eso:

- El gris es heredado de la paleta de Orca, elegido dentro de esa paleta — no hay identidad visual
  propia de Andes todavía (ver "Fuera de alcance" arriba).
- `--border`/`--input` (`#e5e5e5`) no se tocaron: contra el nuevo fondo (`#ececea`) su contraste baja
  un poco (de 1.19:1 a ~1.06:1 en luminancia relativa) donde un borde separa directamente el lienzo
  del contenido, en vez de una tarjeta blanca. Ya era un contraste bajo antes de esta spec (por eso
  existe `--tab-group-split-divider` como token aparte para los casos que necesitan más), y ningún
  criterio de esta spec lo pide — se deja anotado para quien toque bordes después.
