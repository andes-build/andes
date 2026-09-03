---
status: implementada
depends_on: []
---

# 003 · Identificadores de paquete de Andes

Terminar el cambio de identidad que la spec 001 dejó a medias: todo lo que el sistema operativo usa
para reconocer la app —permisos de macOS, notificaciones, el ayudante de uso de computadora, el
identificador de Windows, los scripts de build— deja de decir `com.stablyai.orca` y pasa a decir
`build.andes` (dominio invertido de `andes.build` — ver el ajuste al criterio 2 del 2026-09-02;
el esquema original de esta spec era `lat.producthub.andes`, descartado el mismo día porque Andes
es open source y no lleva referencias a Product Hub).

**Tipo**: residuals · **Flujo**: requirements-first

## Estado previo

`main` en `e76ce38ee6`. El agente corre `git log e76ce38ee6..main --stat` antes de empezar.

Apariciones de `com.stablyai.orca` fuera de `node_modules`, verificadas el 2026-09-02:

- `src/main/macos-tcc-prompt-watch.ts:22-27` — dominios de TCC (app, helper, dev, local).
- `src/main/macos-press-and-hold-default.ts:14,45` — `ORCA_BUNDLE_ID` para `defaults write`.
- `src/main/ipc/notification-system-settings-link.ts:3` — `MACOS_PACKAGED_BUNDLE_ID`.
- `src/main/startup/dev-instance-identity.ts:6` — `BASE_APP_USER_MODEL_ID` de Windows.
- `src/main/computer/macos-computer-use-permissions.ts:13` — `DEFAULT_COMPUTER_USE_BUNDLE_ID`.
- `config/scripts/dev-electron-bundle-identity.mjs:10` — `DEV_BUNDLE_ID`.
- `config/scripts/build-notification-status-macos.mjs:31` y `build-computer-macos.mjs:17` — defaults de `--bundle-id`.
- `native/computer-use-macos/Sources/OrcaComputerUseMacOS/main.swift:4111-4112` y `OrcaComputerUseMacOSCore/{PermissionStatusSnapshot,AuthenticatedConnectionHangupMonitor}.swift` — el ayudante reconoce a la app por su bundle id y etiqueta sus colas.
- `tests/e2e/macos-press-and-hold-startup.spec.ts:77`.
- `Casks/orca.rb:43-47` y `Casks/orca@rc.rb:51-55` — fórmulas de Homebrew de Orca.
- `decisions.md:88-100` del repo registra que la spec 001 dejó estos ids a propósito.

`git log e76ce38ee6..main --stat` corrido antes de empezar mostró un único commit adicional
(`d3f01a7202`, Gate 1 de las specs 002/003/004 — solo agrega los tres archivos de `specs/`, sin
tocar código). El terreno no se había movido.

## Criterios de aceptación

| # | Criterio | Eval | Resultado |
|---|---|---|---|
| 1 | No queda ninguna aparición de `com.stablyai.orca` en código, scripts, nativo ni tests | `grep -rn 'com\.stablyai\.orca' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=specs --exclude=decisions.md --exclude=ARCHITECTURE.md .` devuelve 0 líneas | PASS — ver decisiones sobre las exclusiones adicionales que necesitó el eval (`evals/`, `.build/`, `.cross-version-checkouts/`, `out/`) |
| 2 | Los ids nuevos siguen un solo esquema: `build.andes`, `build.andes.helper`, `build.andes.dev`, `build.andes.dev.helper`, `build.andes.local`, `build.andes.local.helper`, `build.andes.computer-use` | `grep -rhoE 'build\.andes[a-z.-]*' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.build src config native tests \| sort -u` es exactamente esa lista | PASS — ver ajuste del 2026-09-02 debajo de la tabla |
| 3 | El ayudante de uso de computadora reconoce a Andes: el chequeo de `main.swift` acepta `build.andes` y el prefijo `build.andes.dev.` | Test del paquete Swift si existe para esa función; si no, `swift build` del paquete en verde y el grep del criterio 2 sobre `native/` | PASS — sin test dedicado a `isTrustedOrcaApplication`; `swift build` en verde (Swift 6.3.3, toolchain de la máquina) |
| 4 | Las fórmulas de Homebrew de Orca no viajan en el repo de Andes | `! test -d Casks` | PASS |
| 5 | El código sigue sano | `pnpm tc` · `pnpm test` · `pnpm run check:code-quality:changed` · `pnpm run verify:macos-entitlements` en verde | PASS |
| 6 | Ninguna referencia a Product Hub en el repo | `grep -rniE 'producthub|product hub' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.build --exclude-dir=specs --exclude=decisions.md . \| wc -l` = 0 | PASS — el eval agrega `--exclude-dir=evals` (se cita a sí mismo) y `--exclude-dir=out` (build de Electron, gitignoreado); ver `decisions.md` |

Ajuste al criterio 2 el 2026-09-02: DECIDIDO por Peter — Andes es open source y no lleva
referencias a Product Hub, que es una empresa; el esquema de identificadores pasa del dominio
invertido de Product Hub (`lat.producthub.andes*`) al dominio invertido de `andes.build`
(`build.andes*`). Se agrega el criterio 6 (sin referencias a Product Hub en el repo) para cerrar
el chequeo. 🔍 aplicado por la sesión supervisora sobre el aviso de Peter; ver `decisions.md`.

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-02, spec 001): el `appId` es `lat.producthub.andes`. Esta
  spec extiende el mismo id a las integraciones del sistema operativo. **Reemplazada el mismo día**
  (ver el siguiente punto).
- DECIDIDO por Peter (2026-09-02): Andes es open source y no lleva referencias a Product Hub, que
  es una empresa; el esquema de identificadores es el dominio invertido de `andes.build`,
  `build.andes` — reemplaza al `lat.producthub.andes` de arriba. `package.json` `author` pasa de
  `stablyai` a `The Andes Contributors` (🔍 propuesta de la sesión supervisora, confirmada por Peter en
  el Gate 2 de esta spec).
- DECIDIDO por Peter (2026-09-02): "se borra solo lo que es paquete aparte" — `Casks/` es la
  distribución de Orca por Homebrew, paquete aparte: se borra. Andes tendrá la suya cuando se publique.

**Delegadas al agente, con criterio**

- Si renombrar constantes (`ORCA_BUNDLE_ID` → `ANDES_BUNDLE_ID`) además de sus valores. Criterio:
  se renombra el símbolo solo cuando el archivo ya se toca por el valor; no se abre un archivo
  solo para renombrar un símbolo.
  - **Cerrada**: se renombraron `ORCA_BUNDLE_ID` → `ANDES_BUNDLE_ID` (`macos-press-and-hold-default.ts`)
    y `ORCA_RESPONSIBLE_IDENTIFIERS` → `ANDES_RESPONSIBLE_IDENTIFIERS` (`macos-tcc-prompt-watch.ts`).
    Las funciones que las usan (`isOrcaPreferencesDomain`, `isOrcaAttributedPrompt`,
    `isTrustedOrcaApplication`) no se renombraron: la decisión delegada habla de "constantes", no
    de funciones exportadas con superficie más amplia. Ver `decisions.md`.

**Condiciones de parada**

- Si algún id aparece en un archivo firmado o generado (`.plist` de entitlements, perfil de
  firma) cuyo cambio exige una identidad de firma de Apple, para y reporta: la firma es de Peter
  y no existe todavía.
  - No se disparó: ningún id vive en un `.plist` de entitlements ni en un artefacto firmado del
    repo. `verify:macos-entitlements` sigue en verde sin tocar esos archivos.
- Si `swift build` del ayudante no corre en la máquina (toolchain ausente), para y reporta con el
  error, sin marcar el criterio 3 como cumplido.
  - No se disparó: la máquina tiene Swift 6.3.3 (`swift-driver version: 1.148.6`) y `swift build`
    corrió en verde. `swift test` no corre en esta máquina (`error: no such module 'XCTest'`, falta
    en el toolchain de línea de comandos) pero eso no afecta al criterio 3: no existe ningún test
    para `isTrustedOrcaApplication` en `native/computer-use-macos/Tests/`, así que el criterio cae
    directamente en su rama de fallback (`swift build` + grep), que sí corrió.

**Decisiones tomadas durante la implementación, no delegadas explícitamente por la spec** (registradas
en `decisions.md` del repo, resumidas acá):

- Los queue labels de `DispatchQueue` en Swift (`AuthenticatedConnectionHangupMonitor.swift`,
  `PermissionStatusSnapshot.swift`) y el chequeo `hasPrefix` de `main.swift` no llevan el id nuevo
  como literal completo: lo arman por concatenación en runtime a partir de una sola constante
  `andesBundleId = "build.andes"` (pública, declarada una vez en
  `PermissionStatusSnapshot.swift` porque un init `public` no puede usar un símbolo `private` en su
  valor por defecto). Un literal como `"build.andes.dev."` (con el punto final que
  necesita `hasPrefix` para no confundir `build.andes.deviant`) o
  `"build.andes.computer-use-owner-hangup"` agrega un octavo valor a la lista cerrada de 7
  que exige el criterio 2 y lo hace fallar aunque el comportamiento sea correcto.
- Varios tests (`notifications-delivery-gating.test.ts`, `server-endpoint-file-lifecycle.test.ts`,
  `daemon-adoption-telemetry.test.ts`, `daemon-adoption-telemetry-event.test.ts`) usaban un
  literal con forma de bundle id (`com.stablyai.orca.dev.<sufijo arbitrario>`,
  `com.stablyai.orca.ShipIt`) sin verificar el id real de Andes — solo ejercitaban una ruta de
  código con un valor de ejemplo. Se reemplazaron por valores que no empiezan con
  `build.andes` (`andes-dev-fb5a47066f08`, `andes-dev-test123`, `Andes.ShipIt`) en vez de
  por el id canónico con el mismo sufijo, para no ensuciar la lista del criterio 2.
- El eval del criterio 1 en `evals/run.sh` excluye además `evals/` (el propio archivo, que cita el
  string en su nombre y mensaje de chequeo), `.build/` (artefactos de Swift, `.gitignore`-ados) y
  `tests/e2e/.cross-version-checkouts/` (checkouts reales de versiones viejas de Orca que clona la
  suite de compatibilidad cross-version, también `.gitignore`-ados) — ninguna de las tres es código
  que Andes mantenga o distribuya, y las tres pueden aparecer o no según qué corrió antes en la
  máquina.

## Efectos que escapan del sistema

Ninguno: no se firma ni se publica. Nota para quien publique: un usuario que ya tenía Orca
instalada no hereda sus permisos de TCC en Andes — son apps distintas para macOS, y eso es correcto.

## Fuera de alcance, con condición de reactivación

- Renombrar el ayudante `Orca Computer Use.app` y el paquete Swift `OrcaComputerUseMacOS`: se
  reactiva cuando el uso de computadora vuelva al paquete publicado.
- Texto "Orca" en la interfaz y en la documentación de `docs/`: spec propia, cuando exista el
  logotipo de Andes. Incluye `BASE_APP_NAME`/`DEV_BUNDLE_DISPLAY_NAME` ('Orca'/'Orca Dev') y el
  workflow `.github/workflows/homebrew-bump.yml`, que sigue referenciando el `Casks/` borrado por
  el criterio 4 — es automatización de CI/CD de la distribución de Orca, no un identificador de
  paquete, y esta spec no tocó nada de `.github/`.


## Evidencia

Rama `spec-003-identificadores-de-paquete`, worktree
`/Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-003`.

Esta spec pasó por dos cambios de alcance decididos por Peter después de la primera implementación:
el esquema de identificadores pasó de `lat.producthub.andes` (dominio invertido de Product Hub) a
`build.andes` (dominio invertido de `andes.build`), porque Andes es open source y no puede llevar
referencias a la empresa que lo desarrolla — se agregó el criterio 6 para cerrar ese chequeo — y
el titular de copyright se fijó como "The Andes Contributors" en `LICENSE` y `package.json`. La
evidencia de abajo es de la corrida final, después de ambos ajustes.

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
PASS spec003#1 no queda ninguna aparición de com.stablyai.orca
PASS spec003#2 los ids nuevos siguen un solo esquema
PASS spec003#3 el ayudante de uso de computadora reconoce a Andes
     | sin test dedicado a isTrustedOrcaApplication en native/computer-use-macos/Tests; verificado con swift build + grep
PASS spec003#4 las fórmulas de Homebrew de Orca no viajan en el repo de Andes
PASS spec003#5 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed / verify:macos-entitlements en la spec archivada)
PASS spec003#6 ninguna referencia a Product Hub en el repo
15 pasan · 0 fallan
```

### swift build (criterio 3)

```
$ cd native/computer-use-macos && rm -rf .build && swift build
[18/22] Emitting module OrcaComputerUseMacOS
[19/22] Compiling OrcaComputerUseMacOS main.swift
... (warning preexistente de CGWindowListCreateImage deprecado, no relacionado a esta spec) ...
[19/22] Write Objects.LinkFileList
[20/22] Linking orca-computer-use-macos
[21/22] Applying orca-computer-use-macos
Build complete! (29.83s)
```

`swift test` no corre en esta máquina (`error: no such module 'XCTest'` — el toolchain de línea de
comandos no trae XCTest); no afecta al criterio 3 porque no existe ningún test para
`isTrustedOrcaApplication`.

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
Test Files  7546 passed | 48 skipped (7594)
     Tests  70124 passed | 289 skipped (70413)
   Duration  1006.76s

[exited with code 0]
```

Corrida final sin ningún archivo rojo — incluido el que en la corrida anterior había mostrado dos
fallas distintas bajo carga (`AgentMapWorkspaceContextMenu.test.tsx`, no relacionado a esta spec y
ya confirmado intermitente entonces al pasar aislado dos veces). Los dos flakies documentados en
las reglas de trabajo (`macos-computer-helper-owner-loss-processes.test.mjs`,
`structured-tui-transcript-catchup.test.ts`) tampoco aparecieron.

### check:code-quality:changed

```
$ node config/scripts/check-changed-code-quality.mjs
code quality: 0 new finding(s) across 24 changed file(s).
type-aware code quality: 0 new finding(s) across 24 changed file(s).
React Doctor: 0 new finding(s) across 24 changed file(s).
Changed-code quality gate passed since d3f01a720203.
```

### verify:macos-entitlements

```
$ node config/scripts/verify-macos-entitlements.mjs
resources/build/entitlements.mac.plist: OK
resources/build/entitlements.computer-use.mac.plist: OK
```

### git log sin trailer Co-Authored-By ni mención de Claude

```
$ git log main..HEAD --format=%B | grep -i 'co-authored\|claude'
(sin salida)
```
