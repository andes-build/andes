---
status: pendiente
depends_on: []
---

# 006 · Restos de la marca Orca

La app todavía se llama Orca por dentro: 695 textos de la interfaz dicen "Orca", ocho enlaces
visibles mandan al GitHub de Stably, y —lo más grave— el actualizador automático apunta a las
versiones de Orca, así que Andes se actualizaría convirtiéndose en Orca. Esta spec termina el
cambio de nombre en todo lo que una persona ve o toca.

**Tipo**: residuals · **Flujo**: requirements-first

## Estado previo

`main` en `d33a26af57` (specs 001 a 005 mergeadas). El agente corre `git log d33a26af57..main --stat` antes de
empezar.

Cuatro grupos, verificados el 2026-09-03:

1. **Textos de la interfaz**: 695 cadenas con "Orca" en `src/renderer/src/i18n/locales/en.json`,
   más sus traducciones en `es.json`, `ja.json`, `ko.json`, `zh.json`. Ejemplos: "A short,
   workflow-by-workflow tour of Orca.", "Add Remote Orca Server", "Orca could not fast-forward…".
2. **Enlaces visibles al GitHub de Orca** (8): `Landing.tsx:28`,
   `sidebar/SidebarFeedbackDialog.tsx:27`, `sidebar/SidebarSettingsHelpMenu.tsx:40`,
   `terminal-pane/TerminalErrorToast.tsx:272`, `stats/ShareUsageButton.tsx:113`,
   `stats/share-card-utils.tsx:218`, `github-project/ProjectViewStates.tsx:11`,
   `link-routing-preference-dialog.tsx:104` (este último es un ejemplo de URL en un diálogo).
3. **Actualizador y canales de versión**: `src/shared/release-channel.ts:24-27`
   (`stablyai/orca-hourly`, `-daily`, `-adhoc`, `stablyai/orca`),
   `src/main/updater-prerelease-feed.ts:5-13,156`, `src/main/updater/updater-release-feed.ts:206`,
   `src/main/updater/updater-setup.ts:158`.
4. **Marketplace de plugins**: `src/shared/plugins/plugin-marketplace.ts:9,11,119` y
   `src/main/plugins/plugin-install-trust.ts:15,26` declaran a `stablyai` como editor oficial.

Lo que **no** es marca y no se toca: `orca.yaml` (formato de configuración de proyecto, leído por
107 archivos), la fuente `Orca Nerd Font Symbols`, los skills `orca-cli` y `orca-emulator` que ya
no existen en el repo pero cuyos nombres viven en constantes, las carpetas de tests
`src/main/runtime/orca-runtime-tests/`, y `vendor/ai-first-os-core/` (código de terceros
versionado).

Además, la spec 002 dejó un hueco: al pasar de modo desarrollo a modo simple, las pestañas de
desarrollo ya abiertas no se cierran (solo se bloquea abrir nuevas).

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | Ningún texto de la interfaz dice "Orca": los cinco catálogos de idiomas no tienen la palabra, salvo la lista de excepciones técnicas declarada en el criterio 6 | `grep -c '"[^"]*\bOrca\b[^"]*"' src/renderer/src/i18n/locales/*.json` = 0 tras excluir las excepciones; `verify:localization-catalog`, `-extraction` y `-coverage` en verde |
| 2 | Los cinco idiomas quedan consistentes: la misma clave dice "Andes" en todos | Test unitario que recorre las claves cambiadas y verifica que ninguna traducción conserva "Orca" |
| 3 | Los ocho enlaces visibles apuntan a `github.com/andes-build/andes` | `grep -rn "stablyai/orca" src/renderer --include='*.tsx' \| grep -v "\.test\."` = 0 |
| 4 | El actualizador no puede convertir a Andes en Orca: los cuatro canales de versión y las tres URL de descarga apuntan a `andes-build/andes` | `grep -rn "stablyai/orca" src/shared/release-channel.ts src/main/updater*` = 0 |
| 5 | Mientras el repo de Andes no tenga versiones publicadas, la búsqueda de actualizaciones no rompe la app: si el canal no responde o no hay versiones, la app sigue abriendo y lo dice en Ajustes, sin ventana de error al arrancar | Test unitario del alimentador de versiones con respuesta vacía y con error de red: en los dos casos devuelve "sin actualizaciones" y no lanza |
| 6 | Las excepciones técnicas quedan declaradas en un solo lugar, con el motivo, y el eval del criterio 1 las lee de ahí en vez de tenerlas escritas dos veces | El archivo de excepciones existe, lo importa el eval, y cada entrada tiene su motivo en una línea |
| 7 | Al pasar de modo desarrollo a modo simple, las pestañas de desarrollo abiertas se cierran y las conversaciones se conservan | Test unitario del cambio de modo con pestañas abiertas de navegador, tablero y PR: quedan cerradas y el hilo sigue; e2e que abre una en developer, cambia a simple y verifica que desaparece |
| 8 | Código sano | `pnpm tc` · `pnpm test` · `check:code-quality:changed` en verde; los e2e de onboarding y de modo simple en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-03): la app se llama Andes en todo lo que una persona ve.
- DECIDIDO por Peter (2026-09-02): el repo público es `andes-build/andes`.
- 🔍 Resolución de la sesión, a confirmar en el Gate 2: **el marketplace de plugins sigue siendo el
  de Orca** (`stablyai` como editor oficial). No es marca de Andes: es la fuente de unos plugins de
  terceros, los plugins están escondidos en modo simple, y apropiarse de ese identificador
  rompería la verificación de confianza de los plugins ya instalados. Se documenta, no se cambia.
- 🔍 Resolución de la sesión: **la documentación de `docs/` y los README traducidos quedan fuera**;
  son documentación de Orca que Andes va a reescribir, no traducir. Spec propia.

**Delegadas al agente, con criterio**

- Cómo se reemplaza en los catálogos: sustitución mecánica más revisión de los casos donde "Orca"
  es sujeto de una oración y "Andes" cambia la concordancia (español: "el Orca" nunca aparece, pero
  sí "Orca no pudo…" → "Andes no pudo…"). Criterio: ninguna oración queda agramatical; ante la
  duda, se reescribe la oración entera.
- Qué hacer con "Orca Cloud", "Orca Relay" y "Orca Server", que nombran servicios de Stably que
  Andes no ofrece. Criterio: si la función está escondida en modo simple, se renombra igual a
  Andes; si nombra un servicio externo que sigue siendo de Stably, se deja y se anota en las
  excepciones con su motivo.
- Cómo se apaga o degrada la búsqueda de actualizaciones sin versiones publicadas. Criterio: la
  opción que deje el diff más chico y no toque la capa que lanza el binario del agente.

**Condiciones de parada**

- Si cambiar los canales de versión exige tocar la firma del paquete o el flujo de actualización
  automática de Electron más allá de las URL, para y pregunta.
- Si un texto del catálogo dice "Orca" dentro de un ejemplo de comando o de una ruta de archivo que
  el sistema realmente usa, para y pregunta en vez de renombrarlo.
- Si cerrar las pestañas del criterio 7 puede perder una conversación sin guardar, para y pregunta.

## Efectos que escapan del sistema

Ninguno: no se publica, no se firma, no se sube nada. Nota para quien publique: hasta que
`andes-build/andes` tenga versiones, la app no va a encontrar actualizaciones, y eso es lo
correcto.

## Fuera de alcance, con condición de reactivación

- `docs/` y los README traducidos: spec propia cuando exista la documentación de Andes.
- El marketplace de plugins: se reactiva si Andes publica plugins propios.
- El ícono y el logotipo: se reactiva cuando exista el archivo de diseño (📌 Peter lo debe).
- `orca.yaml` como nombre del archivo de configuración de proyecto: se reactiva si alguna vez se
  rompe la compatibilidad con Orca a propósito.
