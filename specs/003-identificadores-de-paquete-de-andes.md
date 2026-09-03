---
status: pendiente
depends_on: []
---

# 003 · Identificadores de paquete de Andes

Terminar el cambio de identidad que la spec 001 dejó a medias: todo lo que el sistema operativo usa
para reconocer la app —permisos de macOS, notificaciones, el ayudante de uso de computadora, el
identificador de Windows, los scripts de build— deja de decir `com.stablyai.orca` y pasa a decir
`lat.producthub.andes`.

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

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | No queda ninguna aparición de `com.stablyai.orca` en código, scripts, nativo ni tests | `grep -rn 'com\.stablyai\.orca' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=specs --exclude=decisions.md --exclude=ARCHITECTURE.md .` devuelve 0 líneas |
| 2 | Los ids nuevos siguen un solo esquema: `lat.producthub.andes`, `lat.producthub.andes.helper`, `lat.producthub.andes.dev`, `lat.producthub.andes.dev.helper`, `lat.producthub.andes.local`, `lat.producthub.andes.local.helper`, `lat.producthub.andes.computer-use` | `grep -rhoE 'lat\.producthub\.andes[a-z.-]*' --exclude-dir=node_modules --exclude-dir=.git src config native tests \| sort -u` es exactamente esa lista |
| 3 | El ayudante de uso de computadora reconoce a Andes: el chequeo de `main.swift` acepta `lat.producthub.andes` y el prefijo `lat.producthub.andes.dev.` | Test del paquete Swift si existe para esa función; si no, `swift build` del paquete en verde y el grep del criterio 2 sobre `native/` |
| 4 | Las fórmulas de Homebrew de Orca no viajan en el repo de Andes | `! test -d Casks` |
| 5 | El código sigue sano | `pnpm tc` · `pnpm test` · `pnpm run check:code-quality:changed` · `pnpm run verify:macos-entitlements` en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (Gate 1, 2026-09-02, spec 001): el `appId` es `lat.producthub.andes`. Esta
  spec extiende el mismo id a las integraciones del sistema operativo.
- DECIDIDO por Peter (2026-09-02): "se borra solo lo que es paquete aparte" — `Casks/` es la
  distribución de Orca por Homebrew, paquete aparte: se borra. Andes tendrá la suya cuando se publique.

**Delegadas al agente, con criterio**

- Si renombrar constantes (`ORCA_BUNDLE_ID` → `ANDES_BUNDLE_ID`) además de sus valores. Criterio:
  se renombra el símbolo solo cuando el archivo ya se toca por el valor; no se abre un archivo
  solo para renombrar un símbolo.

**Condiciones de parada**

- Si algún id aparece en un archivo firmado o generado (`.plist` de entitlements, perfil de
  firma) cuyo cambio exige una identidad de firma de Apple, para y reporta: la firma es de Peter
  y no existe todavía.
- Si `swift build` del ayudante no corre en la máquina (toolchain ausente), para y reporta con el
  error, sin marcar el criterio 3 como cumplido.

## Efectos que escapan del sistema

Ninguno: no se firma ni se publica. Nota para quien publique: un usuario que ya tenía Orca
instalada no hereda sus permisos de TCC en Andes — son apps distintas para macOS, y eso es correcto.

## Fuera de alcance, con condición de reactivación

- Renombrar el ayudante `Orca Computer Use.app` y el paquete Swift `OrcaComputerUseMacOS`: se
  reactiva cuando el uso de computadora vuelva al paquete publicado.
- Texto "Orca" en la interfaz y en la documentación de `docs/`: spec propia, cuando exista el
  logotipo de Andes.
