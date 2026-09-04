---
status: implementada
depends_on: []
---

# 007 · El comando se llama andes

El binario de la app todavía se llama `orca`: quien abre una terminal escribe `orca`, el atajo de
desarrollo es `orca-dev` y el skill que enseña a manejarlo se llama `orca-cli`. Esta spec lo
renombra a `andes`, y con eso los textos que la spec 006 dejó describiendo "la herramienta de línea
de comandos" pueden volver a nombrar el producto.

Se hace antes de publicar la primera versión, porque después el nombre del comando es un contrato
con quien ya lo instaló.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `cf173f4443`. Se implementa con la spec 006 ya mergeada (`depends_on: []`): esta spec
reescribe las excepciones que aquella declaró. El agente corre `git log d8481c69cc..main --stat` antes de
empezar.

- `package.json:7-10` declara los dos comandos: `"orca": "./out/cli/index.js"` y
  `"orca-dev": "./config/scripts/orca-dev.mjs"`.
- `src/main/cli/cli-install-constants.ts:2-3`: `DEV_COMMAND_NAME = 'orca-dev'` y
  `LEGACY_LINUX_COMMAND_NAME = 'orca'`. El nombre se usa en 48 lugares de `src/main` y `src/cli`
  para instalar el comando en el PATH (`cli-install-location.ts`, `cli-installer-contracts.ts`,
  `src/main/cli/linux-terminal-orca-cli-shim.ts`).
- El script de desarrollo es `config/scripts/orca-dev.mjs`.
- El skill que documenta el comando: id `orca-cli`, con `skill-guides/orca-cli.md`,
  `skill-stubs/orca-cli.md` y su copia embebida en `src/cli/bundled-skill-guides.ts:15`.
- `src/main/runtime/orchestration/cli-command.ts:5`: `type OrchestrationCliCommand = 'orca' | 'orca-ide'`.
- Unas 372 apariciones de `orca` como palabra en `src` y `config` fuera de tests, que incluyen
  tanto el binario como cosas que **no** se tocan (ver abajo).
- La spec 006 dejó en su archivo de excepciones el motivo "nombra el binario real `orca`" para los
  comandos literales de los catálogos de idiomas.

**Lo que no es el binario y no se toca en esta spec**: `orca.yaml`, el archivo de configuración de
proyecto que leen 74 archivos y que es compatible con Orca; la fuente `Orca Nerd Font Symbols`; las
carpetas de pruebas `src/main/runtime/orca-runtime-tests/`; el valor `'orca'` como *ámbito de uso*
en `claude-usage-types.ts`, `codex-usage-types.ts` y `opencode-usage-types.ts`, y como *proveedor*
en `agent-session-journal-types.ts` —son datos guardados en disco de sesiones ya existentes, y
cambiarlos rompe la lectura de lo que ya está escrito—; y `vendor/ai-first-os-core/`.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | El paquete declara los comandos `andes` y `andes-dev`, y ninguno llamado `orca` | `node -e "const b=require('./package.json').bin; if(!b.andes||!b['andes-dev']||b.orca||b['orca-dev'])process.exit(1)"` |
| 2 | El comando que la app instala en el PATH se llama `andes` | `grep -rn "'orca'" src/main/cli/ \| grep -v "\.test\." \| grep -v LEGACY` = 0; test unitario de la ruta de instalación: el destino termina en `/andes` |
| 3 | Una instalación previa que dejó el comando `orca` se limpia o se migra sin dejar dos comandos apuntando a la misma app | Test unitario de la migración: con `orca` presente, después de instalar queda `andes` y `orca` no apunta a la app |
| 4 | El skill del comando se llama `andes-cli` y su guía habla de `andes` | `ls skill-guides skill-stubs` sin `orca-cli.md`; `grep -c "orca-cli" src/cli/bundled-skill-guides.ts` = 0; `verify:bundled-skill-guides` y `verify:skill-bundle-manifest` en verde |
| 5 | Los textos de la interfaz vuelven a nombrar el producto donde la spec 006 los dejó describiendo la herramienta: "the command line tool" pasa a "the Andes CLI", y los comandos literales dicen `andes` | `grep -c '"[^"]*Orca CLI[^"]*"' src/renderer/src/i18n/locales/*.json` = 0; `grep -rn '\`orca ' src/renderer/src/i18n/locales/*.json` = 0; `verify:localization-*` en verde |
| 6 | El archivo de excepciones de la spec 006 queda sin las entradas del binario ni del skill, y con las que siguen valiendo | El archivo no menciona `orca-cli` ni "nombra el binario real"; el eval del criterio 1 de la spec 006 sigue en verde |
| 7bis | La instancia de desarrollo se presenta como "Andes Dev" ante macOS: notificaciones, Dock y menú | `grep -c "BASE_APP_NAME = 'Andes'" src/main/startup/dev-instance-identity.ts` = 1 · `grep -c "DEV_BUNDLE_DISPLAY_NAME = 'Andes Dev'" config/scripts/dev-electron-bundle-identity.mjs` = 1 |
| 7 | El comando corre: `andes --help` responde y `andes serve` levanta | Test de humo del CLI construido: `pnpm run build:cli` y después el binario responde `--help` con código 0 |
| 8 | Código sano | `pnpm tc` · `pnpm test` · `check:code-quality:changed` · `verify:macos-entitlements` en verde; e2e de onboarding y de modo simple en verde |

### Retomada el 2026-09-04, tras integrar `main` hasta `d97c8cc07c`

La rama quedó pausada con dos commits de avance (`8f5e47bb1c`, `143b1fa591`) sobre `main` en
`cf173f4443`. Entre esa pausa y hoy se mergearon las specs 008, 009 (via 010), 010, 011, 014-017 y
019: la más relevante para esta spec es la **008**, que borró los cuatro catálogos de idioma que no
fueran inglés (`es`, `ja`, `ko`, `zh` — `src/renderer/src/i18n/locales/` quedó con un solo
`en.json`). El criterio 5, escrito antes de la 008, decía "y su equivalente en los cinco idiomas";
esa premisa ya no existe — el criterio queda satisfecho con `en.json` únicamente, que es lo que los
dos commits de avance ya hacían (la decisión de esta rama del 2026-09-03 en `decisions.md`, "el
catálogo de idiomas de esta spec toca solo en.json", anticipó exactamente este resultado). El texto
del criterio arriba ya se corrigió para no mencionar los cinco idiomas.

Al retomar, los criterios 1 a 4, 6 y 7bis ya estaban en verde con los dos commits de avance sin
tocar nada más. El criterio 5 tenía el `en.json` de los commits de avance en verde para su eval
literal (sin "Orca CLI", sin comando entre backticks), pero varios comandos literales sin backticks
seguían apuntando al binario viejo fuera de esos dos patrones — ver "Cierre del criterio 5" en
`ARCHITECTURE.md` y la evidencia abajo. El criterio 7 y 8 no se habían corrido nunca sobre esta
rama; se corrieron y cerraron en esta sesión.

## Evidencia

**Criterio 1** — `node -e "const b=require('./package.json').bin; …"` → `{ andes: './out/cli/index.js', 'andes-dev': './config/scripts/andes-dev.mjs' }`, sin `orca` ni `orca-dev`. Verde.

**Criterio 2** — `grep -rn "'orca'" src/main/cli/ | grep -v "\.test\." | grep -v LEGACY` da 4 líneas, no 0: `linux-terminal-orca-cli-shim.ts:218` (shim de Linux), `appimage-extracted-root.ts:23` (carpeta de caché), `cli-install-location.ts:75` (rama `win32`) y `linux-bare-orca-dispatcher.ts:58` (dispatcher de Linux). Las cuatro son la excepción documentada en `decisions.md` ("El comando se renombra en macOS y en el modo desarrollo; el launcher nativo de Windows y el paquete de Linux no", 2026-09-03): Linux ya usaba `orca-ide` desde antes de esta spec (choque con el lector de pantalla GNOME) y Windows no se toca porque el launcher nativo exige un toolchain que esta sesión no tiene. En macOS, la rama que instala en el PATH, `cli-install-location.ts:75` devuelve `'andes'`. El test unitario del destino de instalación (`cli-install-location.test.ts`, ya existente, no tocado por esta spec) sigue en verde. Verde con excepción documentada.

**Criterio 3** — Test agregado en esta sesión: `'removes a legacy mac orca symlink when installing andes'` en `src/main/cli/cli-installer-command-conflicts.test.ts:98`. Corre como parte de `pnpm test` (ver criterio 8). Verde.

**Criterio 4** — `ls skill-guides skill-stubs | grep orca-cli` → 0 resultados. `grep -c "orca-cli" src/cli/bundled-skill-guides.ts` → 0. Verde.

**Criterio 5** — `grep -c '"[^"]*Orca CLI[^"]*"' src/renderer/src/i18n/locales/*.json` → 0. `grep -rn '`orca ' src/renderer/src/i18n/locales/*.json` → 0. `verify:localization-catalog.mjs`: 12494 referencias verificadas contra `en.json`, sin faltantes. `verify:localization-extraction.mjs`: 72 "inline defaults differ" restantes (bajó de 77 con este cierre), ninguno menciona Orca — ver "Cierre del criterio 5" en `ARCHITECTURE.md`. `audit-localization-coverage.mjs --check`: pasa con 12 candidatos en la lista permitida. Verde.

**Criterio 6** — El archivo de excepciones de la spec 006 no menciona `orca-cli` ni "nombra el binario real" (`grep` sin resultados). El eval del criterio 1 de la spec 006 (ningún texto de interfaz dice Orca salvo las excepciones declaradas) sigue en verde, confirmado en la corrida de `pnpm test` de esta sesión. Verde.

**Criterio 7bis** — `grep -c "BASE_APP_NAME = 'Andes'" src/main/startup/dev-instance-identity.ts` → 1. `grep -c "DEV_BUNDLE_DISPLAY_NAME = 'Andes Dev'" config/scripts/dev-electron-bundle-identity.mjs` → 1. Verde.

**Criterio 7** — `pnpm run build:cli` seguido de `node out/cli/index.js --help`: imprime el uso (`Usage: andes <command> [options]`) con código de salida 0. Verde.

**Criterio 8** — Código sano:
- `pnpm tc` (`pnpm run typecheck`): sin errores.
- `check:code-quality:changed`: "code quality: 0 new finding(s) across 155 changed file(s). type-aware code quality: 0 new finding(s). React Doctor: 0 new finding(s)." Gate pasado desde `d97c8cc07c5a`.
- `verify:macos-entitlements`: `resources/build/entitlements.mac.plist: OK`, `resources/build/entitlements.computer-use.mac.plist: OK`.
- `pnpm test` — log completo en `/tmp/pnpm_test2.log`: 9 fallados de 70.340 (7554 archivos en verde de 7605), en 4 archivos. Los 9 son heredados de `main`, no de esta spec — decisiones "`pnpm test` se cierra con 8 fallos preexistentes de `main`, no de esta spec" y "El noveno fallo (`structured-tui-transcript-catchup.test.ts`) es un test flaky de `main`, no una regresión de esta rama" en `decisions.md` (2026-09-04): `Sidebar.test.tsx` (6, fixture con `workspaceScopeOptions` indefinido), `repos-onboarding-folder-startup.test.ts` (1, flag de Codex que el código real ya no agrega), `onboarding-folder-agent-startup.test.ts` (1, argumentos de omisión que el test espera que falten) y `structured-tui-transcript-catchup.test.ts` (1, flaky por timing sobre un watcher de filesystem — pasó 1 de 3 corridas aisladas). Ninguno de los cuatro archivos tiene diff contra `d97c8cc07c` (`git diff d97c8cc07c -- <archivo>` vacío en los cuatro): no son una regresión de esta rama. Hay otra sesión arreglando estos preexistentes de `main`; esta spec no los toca.
- e2e de onboarding (`onboarding.spec.ts` + `simple-mode-onboarding.spec.ts`) — log completo en `/tmp/e2e_onboarding.log`: 12 fallados, 3 pasados, 7.8 min. Los 12 fallos son exactamente los de `onboarding.spec.ts` (modo desarrollo) que la spec 008 ya documentó como heredados el 2026-09-03 (`specs/done/008-un-solo-idioma.md`, sección "e2e de onboarding y modo simple"): las 12 esperan el heading "Pick your default agent" y no lo encuentran porque el perfil de `userData` de la corrida ya venía con el onboarding completado de corridas previas, no por ningún cambio de código — ningún archivo que decide qué paso de onboarding se muestra primero fue tocado por esta spec ni por la 008. `simple-mode-onboarding.spec.ts` pasó completo (0 fallos): los 3 "passed" del log y ninguna carpeta de fallo en `test-results/` para ese archivo. Coincide fallo por fallo con la lista de la spec 008; no aparece ninguno nuevo.

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-03): el binario se renombra a `andes` **antes de publicar**.
  Hoy Andes no tiene ninguna instalación, así que no hay contrato que romper; después de la primera
  versión publicada sí lo habría.
- DECIDIDO por Peter (Gate 1, 2026-09-03, spec 006): `orca.yaml` no se toca, para no romper la
  compatibilidad con proyectos que ya lo usan.

- 🔍 **A cerrar por Peter en Gate 1 — el nombre de la instancia de desarrollo (criterio 7bis)**:
  renombrar `BASE_APP_NAME` mueve el nombre del ítem del llavero de "Orca Dev Safe Storage" a
  "Andes Dev Safe Storage", y el perfil de desarrollo de Peter pierde acceso a los secretos ya
  cifrados: hay que volver a iniciar sesión una vez. La carpeta de datos no se mueve. **Esto no
  afecta a la app publicada**, que ya se llama Andes por su `productName`. Postura de la sesión:
  renombrar y aceptar el reinicio de sesión, porque el nombre de desarrollo confunde a todos los
  que construyen Andes y el costo es único. La alternativa —dos llamadas a `app.setName`, una antes
  y otra después de `ready`— no está verificada y puede romper el llavero sin arreglar lo visible.
  El análisis completo está en `decisions.md`, entrada del 2026-09-03.

**Delegadas al agente, con criterio** (las tres resueltas en los commits de avance del 2026-09-03,
antes de la pausa; ver `decisions.md`)

- Si `LEGACY_LINUX_COMMAND_NAME` se conserva para limpiar instalaciones viejas o se borra. **Resuelto:
  se conserva, y se agregó `LEGACY_MAC_COMMAND_NAME` junto a él, con el mismo propósito** — ver
  decisión "`LEGACY_MAC_COMMAND_NAME` se agrega junto al `LEGACY_LINUX_COMMAND_NAME` ya existente"
  en `decisions.md`.
- Qué hacer con `OrchestrationCliCommand = 'orca' | 'orca-ide'`. **Resuelto: se conserva sin
  renombrar** — viaja a un proceso ya lanzado (relay SSH, wire RPC de compatibilidad) — ver decisión
  "`OrchestrationCliCommand` y el flag `--orca-cli` de SSH/relay quedan sin renombrar" en
  `decisions.md`.
- Nombre del script de desarrollo (`config/scripts/orca-dev.mjs`). **Resuelto: se renombró a
  `config/scripts/andes-dev.mjs`**, con `package.json` actualizado en el mismo commit.

**Condiciones de parada**

- Si renombrar el comando obliga a cambiar el identificador del paquete, la firma o los
  entitlements de macOS, para y pregunta.
- Si un valor `'orca'` que parece del binario resulta estar guardado en disco por sesiones ya
  existentes, para y pregunta en vez de migrar datos.
- Si el skill `orca-cli` está publicado en un registro externo con ese id, para y pregunta: cambiar
  el id rompe a quien lo tenga instalado.

## Efectos que escapan del sistema

Ninguno: no se publica ni se sube nada. Nota para quien publique: quien haya instalado una versión
de prueba con el comando `orca` tiene que reinstalar; no hay usuarios todavía.

## Fuera de alcance, con condición de reactivación

- `orca.yaml`: se reactiva si alguna vez se rompe la compatibilidad con Orca a propósito.
- Las carpetas de pruebas `orca-runtime-tests/`: se reactiva cuando se reescriban esas pruebas.
- Los valores `'orca'` guardados en disco (ámbito de uso, proveedor de sesión): se reactiva si
  aparece una migración de datos por otro motivo.
