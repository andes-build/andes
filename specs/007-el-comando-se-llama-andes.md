---
status: pendiente
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
| 5 | Los textos de la interfaz vuelven a nombrar el producto donde la spec 006 los dejó describiendo la herramienta: "the command line tool" pasa a "the Andes CLI" (y su equivalente en los cinco idiomas), y los comandos literales dicen `andes` | `grep -c '"[^"]*Orca CLI[^"]*"' src/renderer/src/i18n/locales/*.json` = 0; `grep -rn '\`orca ' src/renderer/src/i18n/locales/*.json` = 0; `verify:localization-*` en verde |
| 6 | El archivo de excepciones de la spec 006 queda sin las entradas del binario ni del skill, y con las que siguen valiendo | El archivo no menciona `orca-cli` ni "nombra el binario real"; el eval del criterio 1 de la spec 006 sigue en verde |
| 7bis | La instancia de desarrollo se presenta como "Andes Dev" ante macOS: notificaciones, Dock y menú | `grep -c "BASE_APP_NAME = 'Andes'" src/main/startup/dev-instance-identity.ts` = 1 · `grep -c "DEV_BUNDLE_DISPLAY_NAME = 'Andes Dev'" config/scripts/dev-electron-bundle-identity.mjs` = 1 |
| 7 | El comando corre: `andes --help` responde y `andes serve` levanta | Test de humo del CLI construido: `pnpm run build:cli` y después el binario responde `--help` con código 0 |
| 8 | Código sano | `pnpm tc` · `pnpm test` · `check:code-quality:changed` · `verify:macos-entitlements` en verde; e2e de onboarding y de modo simple en verde |

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

**Delegadas al agente, con criterio**

- Si `LEGACY_LINUX_COMMAND_NAME` se conserva para limpiar instalaciones viejas o se borra.
  Criterio: se conserva solo si la limpieza del criterio 3 lo necesita, con un comentario que diga
  que es para desinstalar, nunca para instalar.
- Qué hacer con `OrchestrationCliCommand = 'orca' | 'orca-ide'`. Criterio: si el valor viaja a
  disco o a un proceso ya lanzado, se conserva y se documenta; si es solo interno, se renombra.
- Nombre del script de desarrollo (`config/scripts/orca-dev.mjs`). Criterio: se renombra junto con
  el comando; los scripts de `package.json` que lo invocan se actualizan en el mismo commit.

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
