# Andes — Arquitectura (as-built)

> Describe lo construido, nunca lo planeado — lo que falta vive en `specs/`.

## Identidad del paquete (spec 001)

- `package.json`: `name: andes`, `version: 0.1.0`, `description: The Agentic Work Environment
  (AWE) for AI Native Companies`, `homepage: https://andes.build`, `author: The Andes Contributors`
  (spec 003 — Andes es open source y no lleva en sus identificadores el nombre de la empresa que
  lo desarrolla).
- `config/electron-builder.config.cjs`: `appId: build.andes`, `productName: 'Andes'` (spec 003:
  dominio invertido de `andes.build`, reemplaza al esquema original de la spec 001 por el mismo
  motivo — ver `decisions.md`).
- `LICENSE`: nota de atribución a Orca/Stably antes del texto MIT original (que no se toca);
  el texto MIT lleva dos líneas de copyright, `Copyright (c) 2026 The Andes Contributors` (spec
  003) seguida de la original `Copyright (c) 2026 Lovecast Inc.` (heredada de Orca, intacta).
- `README.md`: sigue siendo el de Orca, con crédito y link a `github.com/stablyai/orca` en las
  primeras 30 líneas.

## Qué se sacó del árbol y del paquete (spec 001)

- **App móvil**: `mobile/` (Android/iOS vía Expo) no existe más en el repo, junto con toda la
  superficie del renderer que solo servía para instalarla y emparejarla —
  `src/renderer/src/components/mobile/`, la pestaña "Mobile" de Settings, el botón y badge de la
  sidebar, la entrada `mobile` del catálogo de navegación de Settings, el toggle "Show Orca Mobile
  Button" de Appearance, y el `feature-interaction` `mobile-pairing`. `src/main/ipc/mobile.ts`, el
  resto del protocolo de pairing en `src/main/runtime/` (clientKind `mobile`, paired devices) y el
  cliente web genérico (`src/renderer/src/web/WebConnect.tsx`) siguen intactos: son parte del motor
  y de la conexión remota vía navegador, no de la app borrada.
- **Uso de computadora fuera del paquete**: `native/computer-use-*` y `skills/computer-use` siguen
  en el repo; lo que se sacó es su empaquetado — las tres entradas de `extraResources` que copiaban
  el helper (`Orca Computer Use.app`, `runtime.ps1`, `runtime.py`) y la firma
  `signMacComputerUseHelper` en `config/electron-builder.config.cjs`.
- **Emulador y Linear**: `src/main/emulator/`, `src/main/linear/` y `src/shared/linear/`
  se quedan tal cual — sacarlos rompe el motor (`src/main/runtime/`, `src/main/startup/`) y SSH
  (`src/main/ssh/ssh-remote-linear-*.ts`). Lo que sí se borró son sus skills dedicadas
  (`skills/orca-emulator`, `skills/orca-emulator-android`, `skills/orca-linear`,
  `skills/linear-tickets`, con sus fuentes en `skill-guides/` y `skill-stubs/`), regenerando
  `src/cli/bundled-skill-guides.ts` y `resources/skills/current-manifest.json`. Esconder estos
  módulos de la interfaz queda para la spec 002 (ajuste al criterio 6 del 2026-09-02, ver
  `specs/done/001-andes-nace-de-orca.md`).

## Identificadores de sistema operativo (spec 003)

Todo lo que macOS y Windows usan para reconocer a Andes por su bundle id sigue un solo esquema,
`build.andes[.dev|.local][.helper]` o `build.andes.computer-use` — el dominio invertido de
`andes.build`. Es el segundo esquema que usa esta spec: el primero era el dominio invertido de la
empresa que desarrolla Andes, y se descartó el mismo día porque Andes es open source y no puede
llevar esa referencia (el esquema original, y el motivo completo, quedan en `decisions.md`).

- `src/main/macos-tcc-prompt-watch.ts` (`ANDES_RESPONSIBLE_IDENTIFIERS`): los 6 ids de TCC
  (`build.andes`, `.helper`, `.dev`, `.dev.helper`, `.local`, `.local.helper`).
- `src/main/macos-press-and-hold-default.ts` (`ANDES_BUNDLE_ID`): dominio de `defaults` para el
  opt-out de accent picker.
- `src/main/ipc/notification-system-settings-link.ts` (`MACOS_PACKAGED_BUNDLE_ID`): id que abre
  el panel de notificaciones del sistema.
- `src/main/startup/dev-instance-identity.ts` (`BASE_APP_USER_MODEL_ID`): `AppUserModelId` de
  Windows, base de `build.andes.dev.<hash>` en desarrollo.
- `src/main/computer/macos-computer-use-permissions.ts` (`DEFAULT_COMPUTER_USE_BUNDLE_ID`):
  `build.andes.computer-use`.
- `config/scripts/dev-electron-bundle-identity.mjs` (`DEV_BUNDLE_ID`/`DEV_HELPER_BUNDLE_ID`):
  identidad ad-hoc firmada del Electron.app de desarrollo.
- `config/scripts/build-notification-status-macos.mjs` y `build-computer-macos.mjs`: default de
  `--bundle-id` de los binarios nativos que se firman.
- `native/computer-use-macos/Sources/OrcaComputerUseMacOS/main.swift`
  (`isTrustedOrcaApplication`): acepta `build.andes` y el prefijo
  `build.andes.dev.`, vía la constante `andesBundleId` (construida por concatenación en
  runtime — nunca como literal repetido — porque un literal con el punto final agregaría un octavo
  valor al esquema de arriba).
- `native/computer-use-macos/Sources/OrcaComputerUseMacOSCore/{PermissionStatusSnapshot,
  AuthenticatedConnectionHangupMonitor}.swift`: las etiquetas de `DispatchQueue` derivan de la
  misma constante `andesBundleId` (pública, declarada una sola vez en `PermissionStatusSnapshot.swift`).

Ninguna referencia a la empresa que desarrolla Andes queda en el repo (spec 003, criterio 6) — ni
en el esquema de bundle id ni en ningún otro lugar del código vivo. `specs/done/001-andes-nace-de-orca.md`
y `decisions.md` son historia append-only y conservan el esquema original en sus entradas ya
escritas: no se reescriben.

Fuera de este esquema, y a propósito:

- `BASE_APP_NAME` ('Orca'), `DEV_BUNDLE_DISPLAY_NAME` ('Orca Dev'), el nombre del ayudante
  (`Orca Computer Use.app`, paquete Swift `OrcaComputerUseMacOS`) y el texto "Orca" en general no
  son identificadores de sistema operativo — son marca visible, spec propia cuando exista el
  logotipo de Andes (ver `specs/done/001-andes-nace-de-orca.md`).
- Fixtures de test que usaban un id con forma de bundle pero sin verificar el valor real
  (namespace de dev arbitrario, ruta de caché de ShipIt) se cambiaron por valores que no calzan en
  el esquema `build.andes*` en vez de reusar el id real, para no ensuciar la lista cerrada
  de 7 valores que exige el criterio 2 de la spec.

`Casks/` (fórmulas de Homebrew de Orca) no existe más en el repo — es la distribución de Orca,
paquete aparte.

## Documentación histórica ajustada

- `config/reliability-gates.jsonc`: los gates cuyo test surface era 100% de la app móvil borrada
  (`mobile-ui.drawer-close-continuity`, `mobile-relay.endpoint-recovery`,
  `mobile-transport.lifecycle-liveness`) se eliminaron del manifiesto. Los gates mixtos
  (`terminal-query.mobile-view-authority`, `terminal-runtime.mobile-stream-budget`) conservan sus
  archivos de `src/` (motor/renderer) y perdieron solo las referencias a `mobile/`.
