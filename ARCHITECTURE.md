# Andes — Arquitectura (as-built)

> Describe lo construido, nunca lo planeado — lo que falta vive en `specs/`.

## Identidad del paquete (spec 001)

- `package.json`: `name: andes`, `version: 0.1.0`, `description: The Agentic Work Environment
  (AWE) for AI Native Companies`, `homepage: https://andes.build`.
- `config/electron-builder.config.cjs`: `appId: lat.producthub.andes`, `productName: 'Andes'`.
- `LICENSE`: nota de atribución a Orca/Stably antes del texto MIT original (que no se toca).
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
- **Emulador y Linear**: no se tocaron. `src/main/emulator/`, `src/main/linear/`,
  `src/shared/linear/` y sus skills siguen en el repo — sacarlos rompe el motor
  (`src/main/runtime/`, `src/main/startup/`) y SSH (`src/main/ssh/ssh-remote-linear-*.ts`). Ver
  `specs/done/001-andes-nace-de-orca.md` § Evidencia para el detalle del bloqueo.

## Documentación histórica ajustada

- `config/reliability-gates.jsonc`: los gates cuyo test surface era 100% de la app móvil borrada
  (`mobile-ui.drawer-close-continuity`, `mobile-relay.endpoint-recovery`,
  `mobile-transport.lifecycle-liveness`) se eliminaron del manifiesto. Los gates mixtos
  (`terminal-query.mobile-view-authority`, `terminal-runtime.mobile-stream-budget`) conservan sus
  archivos de `src/` (motor/renderer) y perdieron solo las referencias a `mobile/`.
