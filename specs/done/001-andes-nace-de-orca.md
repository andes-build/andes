---
status: implementada
depends_on: []
---

# 001 · Andes nace de Orca

Convertir el clon de Orca en el repo de Andes: nombre propio, sin la app móvil ni lo que solo
sirve para desarrollo móvil o para Linear, y con el uso de computadora fuera del paquete
publicado pero intacto en el código. Nada de la interfaz cambia todavía: eso es la spec 002.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `ba9e5de` (el commit de nacimiento: andamiaje del producto sobre Orca 1.4.178-rc.2,
`upstream` en `ef4e9c40`). El agente corre `git log ba9e5de..main --stat` antes de empezar.

- `package.json`: `name: orca`, `description: Next-gen IDE for parallel agentic development`,
  `homepage` y `author` de stablyai.
- `config/electron-builder.config.cjs`: `appId com.stablyai.orca`, `productName Orca`; copia
  `Orca Computer Use.app` como recurso extra (líneas 491-492), lo firma (366) y falla si falta
  (673-687); Windows copia `runtime.ps1` (412-413) y Linux `runtime.py` (559-560).
- `mobile/` (12 MB, app Android con `package.json` propio); `src/renderer/src/components/mobile/`;
  ajuste `mobile` en settings.
- `src/main/emulator/`, `src/renderer/src/components/emulator-pane/`, `skills/orca-emulator*`.
- `src/main/linear/`, `src/shared/linear/`, `skills/orca-linear`, `skills/linear-tickets`.
- `src/relay/` y `src/main/ssh/`: se quedan (decisión abajo).
- `LICENSE`: MIT de Stably. `CLAUDE.md` carga `@AGENTS.md` con las convenciones de código de Orca.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | El paquete se llama Andes | `grep -c '"name": "andes"' package.json` = 1 · `grep -c "productName: 'Andes'" config/electron-builder.config.cjs` = 1 · `grep -c "appId = 'lat.producthub.andes'"` = 1 |
| 2 | La bajada y el sitio son los decididos | `grep -c '"description": "The Agentic Work Environment (AWE) for AI Native Companies"' package.json` = 1 · `grep -c '"homepage": "https://andes.build"' package.json` = 1 |
| 3 | La versión arranca de cero | `grep -c '"version": "0.1.0"' package.json` = 1 |
| 4 | El crédito a Orca es visible | `LICENSE` conserva "Copyright" y "Stably" · `README.md` nombra Orca y enlaza `github.com/stablyai/orca` en las primeras 30 líneas |
| 5 | No queda app móvil | `! test -d mobile` · `! test -d src/renderer/src/components/mobile` · `grep -rL` — ninguna referencia a `mobile/` en `pnpm-workspace.yaml` ni en `package.json` |
| 6 | No quedan los skills de emulador ni de Linear | `ls skills/` sin `orca-emulator*`, `orca-linear`, `linear-tickets` · `verify:skill-bundle-manifest` y `verify:bundled-skill-guides` en verde. Los módulos `src/main/emulator`, `src/main/linear` y `src/shared/linear` se quedan: los importa el motor y SSH, y se esconden en la spec 002 |
| 7 | El uso de computadora no viaja en el paquete | `grep -c 'Computer Use.app' config/electron-builder.config.cjs` = 0 · `grep -c 'computer-use-windows/runtime.ps1'` = 0 · `grep -c 'computer-use-linux/runtime.py'` = 0 · `native/computer-use-*` y `skills/computer-use` siguen existiendo |
| 8 | El código sigue sano | `pnpm tc` en verde · `pnpm test` en verde · `pnpm run check:code-quality:changed` en verde |
| 9 | Ningún rastro de la marca Claude o Anthropic en nombre, ícono ni `appId` | `grep -ci 'claude\|anthropic' <<< "$(jq -r .name,.description package.json)"` = 0 |

Ajuste al criterio 6 el 2026-09-02 tras condición de parada: 🔍 aplicado por la sesión supervisora con la regla cerrada en Gate 1; Peter lo confirma en el Gate 2.

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-02): repo propio con Orca adentro, `upstream` apunta a
  `stablyai/orca`. Se esconde por configuración; se borra solo lo que es paquete aparte.
- DECIDIDO por Peter (Gate 1, 2026-09-02): sin Orca Mobile.
- DECIDIDO por Peter (Gate 1, 2026-09-02): el uso de computadora queda en el repo y fuera de la
  versión publicada.
- DECIDIDO por Peter y Maxi Delgado (Gate 1, 2026-09-02): emulador Android y Linear no se traen;
  relay y SSH se quedan sin tocar hasta que exista el nivel Team con servidor.
- DECIDIDO por Peter (2026-09-02): dominio andes.build.
- DECIDIDO por Peter (2026-09-02): nombre Andes (reemplaza a Workr del 2026-08-30) y bajada "The Agentic Work Environment (AWE) for
  AI Native Companies".

**Delegadas al agente, con criterio**

- Qué archivos de `src/renderer` y `src/main` que solo servían a `mobile/`, al emulador o a
  Linear se borran junto con ellos. Criterio: se borra lo que no importa nadie más una vez sacado
  el paquete; si un módulo lo importa el relay o el motor, se queda y no se toca.
- Cómo se saca el uso de computadora del paquete: borrar las entradas de `extraResources` y la
  firma del helper, o ponerlas detrás de una variable de build. Criterio: la opción que deja el
  diff más chico y que no rompe `pnpm run verify:macos-entitlements`.
- El `appId`: `lat.producthub.andes` salvo que la convención de dominio invertido exija otra cosa.

**Condiciones de parada**

- Si sacar `mobile/` rompe el relay o el reparto de skills y arreglarlo exige tocar `src/relay/`,
  el agente para y pregunta.
- Si un test de Orca prueba algo borrado y no se puede quitar sin tocar tests ajenos al borrado,
  para y pregunta.
- Si aparece cualquier credencial, identidad de firma o token de Stably en la configuración, no se
  reemplaza ni se borra: se reporta.

## Efectos que escapan del sistema

Ninguno. No hay publicación, no hay firma, no hay push: el paquete no se construye en esta spec.

## Fuera de alcance, con condición de reactivación

- El interruptor modo simple / modo desarrollo y qué se esconde: spec 002.
- La conversación sobre el Agent SDK como superficie del modo simple: spec 003, con lo que
  `tsk-182` ya probó.
- Firmar y publicar el paquete: exige certificado de Apple Developer y de Windows de Product Hub,
  que hoy no existen. Se reactiva cuando Peter los tenga.
- Ícono y logotipo de Andes en `resources/`: se reactiva cuando exista el archivo de diseño.
- Traducir al español lo que Andes agregue: el catálogo de Orca ya tiene español; lo nuevo se
  traduce en la spec que lo agregue.

## Evidencia

Rama `spec-001-andes-nace-de-orca`, worktree `/Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-001`.

### evals/run.sh

```
$ evals/run.sh
PASS spec001#1 el paquete se llama Andes
PASS spec001#2 la bajada y el sitio son los decididos
PASS spec001#3 la versión arranca de cero
PASS spec001#4 el crédito a Orca es visible
PASS spec001#5 no queda app móvil
PASS spec001#6 no quedan los skills de emulador ni de Linear
     | src/main/emulator, src/main/linear y src/shared/linear se quedan a propósito: los importa
     | el motor (src/main/runtime/, src/main/startup/) y SSH (src/main/ssh/ssh-remote-linear-*.ts).
     | Esconderlos de la interfaz es trabajo de la spec 002 (ajuste del 2026-09-02, ver spec archivada).
PASS spec001#7 el uso de computadora no viaja en el paquete
PASS spec001#8 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed en la spec archivada)
PASS spec001#9 ningún rastro de la marca Claude o Anthropic
9 pasan · 0 fallan
```

### pnpm tc

```
$ pnpm tc
> pnpm run typecheck
> node config/scripts/run-typecheck-projects-in-parallel.mjs
```
(sin salida = los tres proyectos de TypeScript — node, cli, web — pasan; exit code 0)

### pnpm test

```
$ pnpm test
...
Test Files  7546 passed | 48 skipped (7595)   (última corrida sin flakes)
     Tests  70136 passed | 289 skipped (70426)
```

Sobre 5 corridas completas de la suite (~7595 archivos) durante la implementación, dos archivos
mostraron una falla intermitente bajo carga paralela, nunca junto con nada tocado por esta spec:
`config/scripts/macos-computer-helper-owner-loss-processes.test.mjs` (timing de spawn/kill de
procesos reales) y `src/main/native-chat/agent-session-wire/structured-tui-transcript-catchup.test.ts`
(una carrera en un `vi.waitFor`). Los dos pasan siempre corridos solos:

```
$ npx vitest run --config config/vitest.config.ts src/main/native-chat/agent-session-wire/structured-tui-transcript-catchup.test.ts config/scripts/macos-computer-helper-owner-loss-processes.test.mjs
 Test Files  2 passed (2)
      Tests  23 passed (23)
```

La corrida final completa (después de stagear todo) solo repitió esos dos flakes; ambos confirmados
intermitentes en el párrafo anterior — no hay ninguna falla real pendiente.

### check:code-quality:changed

```
$ node config/scripts/check-changed-code-quality.mjs
code quality: 0 new finding(s) across 21 changed file(s).
type-aware code quality: 0 new finding(s) across 21 changed file(s).
React Doctor: 0 new finding(s) across 21 changed file(s).
Changed-code quality gate passed since a0d179134aa8.
```

### Decisiones delegadas cerradas durante la implementación (ver `decisions.md` del repo)

- LICENSE lleva una nota de atribución a Orca/Stably antes del MIT original (que no se toca), para
  satisfacer el criterio 4 sin alterar el copyright holder heredado.
- `appId`: `lat.producthub.andes` (dominio invertido de Product Hub).
- Computer Use sale del empaquetado borrando las tres entradas de `extraResources` y la firma del
  helper, no con flag de build — diff más chico, `verify:macos-entitlements` no depende de eso.
- "No queda app móvil" incluyó toda la pestaña Mobile de Settings, el botón/badge de sidebar, la
  entrada de navegación y el toggle de Appearance — no solo los dos directorios nombrados
  literalmente — porque dejarlos huérfanos era una regresión de interfaz.
- Bundle IDs de integraciones macOS/Windows (`com.stablyai.orca*` en TCC, notificaciones, Computer
  Use, AppUserModelId) no se tocan: quedan como gap conocido para cuando se firme el primer build
  de Andes (tarea de seguimiento abierta).
- Gap conocido: la UI de Settings sigue ofreciendo instalar el skill de Linear que esta spec borró
  (`ORCA_LINEAR_SKILL_NAME`/`LINEAR_TICKETS_SKILL_NAME` en `src/shared/agent-feature-install-commands.ts`);
  ningún test lo cubre. Requiere Gate 1 de la spec 002 (tarea de seguimiento abierta).

### Condición de parada aplicada y resuelta

El criterio 6 original (borrar `src/main/emulator`, `src/main/linear`, `src/shared/linear`) chocó
con la decisión de Gate 1 de dejar el motor y SSH sin tocar: esos tres módulos los importa
`src/main/runtime/`, `src/main/startup/` y `src/main/ssh/ssh-remote-linear-*.ts`. La sesión
supervisora resolvió aplicando la regla ya cerrada en Gate 1 ("se esconde por configuración; se
borra solo lo que es paquete aparte"): el criterio 6 se reescribió arriba para pedir solo el
borrado de las skills dedicadas (`skills/orca-emulator`, `skills/orca-emulator-android`,
`skills/orca-linear`, `skills/linear-tickets`), que sí se hizo. Los tres módulos del motor quedan
intactos; esconderlos de la interfaz es trabajo de la spec 002.
