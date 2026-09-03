---
status: implementada
depends_on: [006]
---

# 014 · Sin marca visual de Orca

La spec 006 cubrió textos, enlaces y actualizador; dejó explícitamente afuera "el ícono y el
logotipo" a la espera del archivo de diseño de Peter (ver "Fuera de alcance" de
`specs/done/006-restos-de-la-marca-orca.md`). Esta spec cierra ese hueco: ningún ícono, imagen,
selector o ventana de la interfaz muestra la ballena de Orca. Peter la pidió sin spec previa;
la escribe el mismo agente que la implementa.

**Tipo**: residuals · **Flujo**: requirements-first

## Estado previo

`main` en `a970e14c8b` (specs 001 a 008 mergeadas). Archivos de marca que Peter entregó para esta
spec:

- `/tmp/andes-logo-real.png` (201×201, transparencia): isologo para la interfaz.
- `/tmp/andes-icon-dock.png` (200×200): ícono del dock de macOS.
- `/tmp/andes-icon-512.png`: copia escalada a 512 del anterior.

## Inventario (punto 1, verificado el 2026-09-03 antes de tocar nada)

**Íconos e imágenes con la ballena o el nombre**, bajo `resources/`:

| Archivo | Qué es |
|---|---|
| `resources/icon.png`, `icon-dev.png` | Ícono de la app (256×256); el segundo con la insignia "D" de build de desarrollo |
| `resources/build/icon.icns`, `icon.ico`, `icon.png` | Ícono compilado para macOS/Windows y su fallback de 1024 |
| `resources/app-icons/orca-blue.png`, `orca-watercolor.png` | Íconos alternativos del selector de Ajustes |
| `resources/logo.svg` | Logo usado inline en la interfaz (Landing, sidebar, onboarding, titlebar) |
| `resources/icon-source/icon.icon/Assets/logo.svg` + `icon.json` | Fuente del pipeline de Icon Composer (`resources/icon-source/generate.sh`), no usada en runtime |
| `resources/tray/orca-menu-barTemplate.png`, `@2x.png` | Ícono de la bandeja del sistema (macOS "template image") |

**Código que referencia esos archivos o el nombre**:

| Archivo | Qué hace |
|---|---|
| `src/shared/app-icon.ts` | Declara las 3 opciones del selector de ícono (`classic`/`watercolor`/`blue`), las 3 con la ballena |
| `src/main/app-icon.ts` | Resuelve la ruta de cada ícono y persiste el ícono elegido en el Dock de macOS |
| `src/renderer/src/components/settings/AppIconSelector.tsx` | El selector de ícono en Ajustes → Apariencia, con flechas para ciclar entre las 3 opciones |
| `src/renderer/src/components/settings/orca-logo-settings-icon.tsx` | Ícono de la fila "Ajustes" en el buscador de navegación; renderiza `logo.svg` |
| `src/main/tray/system-tray.ts` | Importa los PNG de bandeja por nombre |
| `config/electron-builder.config.cjs` | `icon: 'resources/build/icon.icns'` (macOS y Linux); sin más referencias de marca visual |

**No es marca visual y no se toca** (nombres de binario o de servicio, ya sea fuera de alcance de
esta spec o decidido en la 006/007): `resources/darwin/bin/orca`, `resources/linux/bin/orca-ide`,
`resources/win32/bin/orca.cmd`, `resources/plugins/launch/orca-marketplace.json` y los
`orca-plugin.json` de ejemplo (marketplace de terceros, decisión de Gate 1 de la spec 006),
`orca.yaml` (formato de configuración de proyecto).

**Hallazgo adicional, no image pero visible** (fuera del inventario del punto 1, encontrado al
verificar el punto 4): un heading en mayúsculas ("ORCA") en la pantalla vacía de `Landing.tsx`, y
el título nativo de la ventana + el título de una notificación de Windows, los tres con el
literal `'Orca'` sin pasar por el catálogo de textos. Ver "Hallazgos" más abajo.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | Inventario completo entregado antes de reemplazar nada | Este documento, sección "Inventario", escrito antes del primer commit |
| 2 | El ícono de la app, el del Dock y el del instalador son el de Peter, en todos los tamaños que el empaquetado exige | `spec014#1`; `file` sobre `resources/build/icon.icns`/`icon.ico`/`icon.png` confirma multi-tamaño (evidencia abajo) |
| 3 | Los íconos alternativos de Orca ya no son elegibles en Ajustes | `spec014#2` |
| 4 | La app corriendo no muestra la ballena en ningún lado: Dock, ventana, bandeja, notificaciones, Ajustes | `spec014#3`, `spec014#5`; capturas de pantalla en "Evidencia" |
| 5 | Los evals quedan en `evals/run.sh` con prefijo `spec014#N` | Los 5 están, ver "Evidencia" |
| 6 | Código sano | `spec014#4`; `pnpm tc` y `check:code-quality:changed` en verde (evidencia abajo) |

## Decisiones

**Cerradas antes de delegar (Peter, en el pedido)**

- El isologo de `/tmp/andes-logo-real.png` es el que va en la interfaz; `/tmp/andes-icon-dock.png`
  (o su copia a 512) es el que va al ícono de la app/Dock.
- Generar con `sips`/la herramienta que el repo ya use; avisar si hace falta un tamaño mayor al que
  hay.
- Borrar los íconos alternativos del selector de Ajustes en vez de dejarlos elegibles.

**Delegadas al agente, con criterio** (registradas también en `decisions.md`)

- El origen de 200px se escala a 1024 con `sips` en vez de pasar por
  `resources/icon-source/generate.sh` (Icon Composer/`xcrun actool`), porque ese pipeline necesita
  un vector propio que todavía no existe. Avisado: la nitidez a 1024 es la de un archivo escalado
  5×, no la de un origen ya grande.
- `resources/logo.svg` envuelve el PNG de Peter como raster embebido (no hay `.svg` vectorial entre
  lo que se entregó); mismo criterio para la fuente de Icon Composer.
- Con una sola opción de ícono, `AppIconSelector` pierde las flechas de ciclado (no hay entre qué
  elegir) y `app-icon.ts` pierde la rama de "ícono personalizado" del Dock (quedaba muerta).
- Los tres hallazgos de texto ("ORCA" en mayúsculas, título de ventana, título de notificación) se
  corrigieron aunque están fuera del inventario de imágenes, por ser directamente visibles y de
  una línea cada uno; ninguno tocó `Landing.tsx`, sidebar ni native-chat (specs 010/011 en curso).

**Condiciones de parada**: ninguna — no hubo que tocar la firma del paquete, el flujo de
`electron-builder`/`electron-updater`, ni ningún archivo de `sidebar/`, `Landing.tsx` o
`native-chat/`.

## Efectos que escapan del sistema

Ninguno: no se publica, no se firma, no se sube nada.

## Fuera de alcance, con condición de reactivación

- `BASE_APP_NAME`/`DEV_BUNDLE_DISPLAY_NAME` y el nombre visible de la instancia de desarrollo
  (texto, no imagen): spec 007, ya aprobada por Peter — ver `decisions.md` de la spec 006.
- El marketplace de plugins (`stablyai`): decidido en Gate 1 de la spec 006, se reactiva si Andes
  publica plugins propios.
- Redibujar el logo como vector real: se reactiva si Peter entrega un `.svg` o un raster de mayor
  resolución (ver `decisions.md`).
- `resources/icon-source/icon.icon` como fuente del pipeline de Icon Composer: se retoma cuando
  exista un logo vectorial; hasta entonces `resources/build/icon.icns` se genera directo con
  `iconutil` desde un iconset armado con `sips`.

## Evidencia

Rama `spec-014-sin-marca-visual-orca`, worktree
`/Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-014`, sobre `main` en `a970e14c8b`.

### `evals/run.sh` — los 5 criterios de spec 014, en verde

Corridos sueltos (no la corrida completa del script, que reejecuta specs 001-008 con suites de
test pesadas — política de pruebas acotada):

```
PASS spec014#1 ningún ícono/imagen bajo resources/ tiene "orca" en el nombre o en el contenido de un .svg
PASS spec014#2 el selector de ícono de Ajustes tiene una sola opción y no referencia los íconos alternativos borrados
PASS spec014#3 los íconos de bandeja no tienen "orca" en el nombre ni el código los referencia
PASS spec014#4 código sano (evidencia completa de pnpm tc / check:code-quality:changed en la spec archivada)
PASS spec014#5 sin la ballena visible: sin heading "ORCA" en el catálogo ni título 'Orca' en la ventana nativa (evidencia de capturas en la spec archivada)
5 pasan · 0 fallan
```

### Tamaños de los íconos regenerados (criterio 2)

```
$ file resources/build/icon.icns resources/build/icon.ico resources/build/icon.png resources/icon.png resources/icon-dev.png
resources/build/icon.icns: Mac OS X icon, 317560 bytes, "ic12" type
resources/build/icon.ico:  MS Windows icon resource - 6 icons, 256x256 with PNG image data, ...
resources/build/icon.png:  PNG image data, 1024 x 1024, 8-bit/color RGBA, non-interlaced
resources/icon.png:        PNG image data, 256 x 256, 8-bit/color RGBA, non-interlaced
resources/icon-dev.png:    PNG image data, 256 x 256, 8-bit/color RGBA, non-interlaced
```

El `.icns` contiene el iconset completo (16 a 1024, @1x/@2x) generado con `sips` desde el origen de
200px escalado a 1024 (ver `decisions.md`: el origen queda corto en nitidez para el instalador,
avisado a Peter).

### `pnpm tc` — en verde

```
$ pnpm run typecheck
$ node config/scripts/run-typecheck-projects-in-parallel.mjs
```

Sin salida — en verde. Corrido después de cada tanda de cambios (4 veces en total).

### `check:code-quality:changed` — en verde

```
$ node config/scripts/check-changed-code-quality.mjs
code quality: 0 new finding(s) across 13 changed file(s).
type-aware code quality: 0 new finding(s) across 13 changed file(s).
React Doctor: 0 new finding(s) across 13 changed file(s).
Changed-code quality gate passed since a970e14c8bda.
```

### Tests tocados — en verde

```
$ pnpm exec vitest run --config config/vitest.config.ts \
    src/main/app-icon.test.ts \
    src/main/tray/system-tray.test.ts \
    src/main/ipc/settings.test.ts \
    src/main/persistence-settings-update.test.ts \
    src/main/window/createMainWindow.test.ts \
    src/main/window/createMainWindow-tray-minimize-close.test.ts

Test Files  6 passed
```

No se corrió `pnpm test` completo (política de pruebas acotada: solo lo tocado). `app-icon.test.ts`
se reescribió para las 3 opciones → 1 (se borraron los casos de `watercolor`/`blue`; se agregó un
caso que confirma que un id heredado de un build viejo con ícono alternativo igual limpia el Dock).
`persistence-settings-update.test.ts` e `ipc/settings.test.ts` se ajustaron porque
`normalizeAppIconId('watercolor'|'blue')` ahora cae a `'classic'` (antes eran valores válidos).
`system-tray.test.ts` se ajustó a los nombres de archivo nuevos.

### Verificación visual (criterio 4) — app corriendo en modo dev, capturas propias

Se levantó la app con `node config/scripts/run-electron-vite-dev.mjs` y se verificó, conectando por
CDP (`ws://127.0.0.1:9408`, sin depender del foco del sistema operativo) y con `screencapture` del
escritorio real:

- **Dock**: el ícono muestra el isologo de Andes (flecha blanca sobre fondo negro) con la insignia
  naranja "D" del build de desarrollo — sin ballena.
- **Ventana**: la pantalla vacía (`Landing.tsx`) muestra el isologo grande y, tras el fix del
  catálogo, el texto "ANDES" (antes decía "ORCA" en mayúsculas — ver "Hallazgos").
- **Título nativo de la ventana**: pasó de `'Orca'` a `'Andes'` (`createMainWindow.ts:91`) — no
  verificable por captura de pantalla (es metadata de la ventana, no texto dibujado), confirmado
  leyendo el valor con el que se instancia `BrowserWindow`.
- **Ajustes → Apariencia → App Icon**: buscando "App Icon" en el buscador de Ajustes, la tarjeta
  muestra un único ícono (el isologo de Andes), sin flechas de ciclado ni las variantes
  watercolor/blue.
- **Notificaciones**: la única notificación con marca (`'Orca'` al minimizar a la bandeja en
  Windows, `main-window-close-lifecycle.ts:78`) pasó a `'Andes'` — no reproducible en una captura
  desde macOS (la ruta es Windows-only), confirmado leyendo el código y el test
  `createMainWindow-tray-minimize-close.test.ts` en verde.

### Hallazgos de texto encontrados al verificar (no estaban en el inventario del punto 1)

Verificando visualmente aparecieron tres restos de "Orca" que no son imágenes pero sí visibles, que
la spec 006 no atrapó:

1. **"ORCA" en mayúsculas** en el heading de la pantalla vacía (`Landing.tsx:263`, catálogo
   `auto.components.Landing.6ca6ff404e`). La regla de reemplazo de la spec 006 era sensible a
   mayúsculas/minúsculas y esta variante no calzaba. Se corrigió solo el valor del catálogo
   (`en.json`), sin tocar `Landing.tsx` (spec 010 lo está editando en paralelo).
2. **Título nativo de la ventana**: `src/main/window/createMainWindow.ts:91`,
   `title: opts?.title ?? 'Orca'` → `'Andes'`.
3. **Título de notificación de Windows**: `src/main/window/main-window-close-lifecycle.ts:78`,
   `title: 'Orca'` → `'Andes'`.

Los tres son cambios de una línea, en archivos fuera de `sidebar/`, `Landing.tsx` y `native-chat/`.
