# Andes — Decisiones

> Append-only: acá no se corrige nada. Cuatro campos por decisión — el formato está en
> `CLAUDE.md`.

## 2026-09-02 · [spec 001] El crédito a Stably en LICENSE va como nota de atribución, no como copyright holder

**Qué se decide**: `LICENSE` conserva el `Copyright (c) 2026 Lovecast Inc.` original intacto y
suma, antes del texto MIT, una línea de atribución: "Andes is built on Orca
(https://github.com/stablyai/orca) by Stably. Original license below."

**Por qué**: el criterio 4 de la spec 001 exige que `LICENSE` contenga "Copyright" y "Stably", pero
el archivo heredado de Orca nunca mencionó "Stably" literalmente (el copyright holder registrado es
"Lovecast Inc."). Agregar una nota de procedencia dice la verdad (Andes es un fork de Orca, hecho
por Stably) sin alterar quién es el titular legal del copyright del código heredado.

**La invalidaría**: que Stably pida remover la mención, o que legal confirme que el copyright
holder correcto a citar es otro.

## 2026-09-02 · [spec 001] appId de Andes es `lat.producthub.andes`

**Qué se decide**: `config/electron-builder.config.cjs` y
`src/shared/local-build-compatibility-contract.json` usan `lat.producthub.andes` como `appId`,
reemplazando `com.stablyai.orca`.

**Por qué**: la spec 001 delega el appId a "dominio invertido salvo que la convención exija otra
cosa"; Product Hub es el dueño del producto y `.lat` es su TLD, así que se sigue la convención
estándar de dominio invertido con el dominio real de la organización.

**La invalidaría**: que Product Hub registre otro dominio propio para Andes.

## 2026-09-02 · [spec 001] Uso de computadora sale del empaquetado borrando las entradas, no con flag de build

**Qué se decide**: las tres entradas de `extraResources` que copiaban el helper de Computer Use
(macOS `.app`, `runtime.ps1` de Windows, `runtime.py` de Linux) y la función que las firmaba
(`signMacComputerUseHelper`) se borraron de `config/electron-builder.config.cjs` en vez de
esconderlas detrás de una variable de entorno.

**Por qué**: la spec delega la elección a "la opción que deja el diff más chico y que no rompe
`pnpm run verify:macos-entitlements`"; borrar es más chico que agregar una rama condicional, y
`verify:macos-entitlements` sigue en verde porque no depende del contenido de `extraResources`.
`native/computer-use-*` y `skills/computer-use` no se tocaron: siguen en el repo, solo dejan de
viajar en el paquete.

**La invalidaría**: que se decida reactivar el empaquetado de Computer Use detrás de un flag de
build en vez de reintroducirlo sin condición.

## 2026-09-02 · [spec 001] "No queda app móvil" incluye toda la superficie de la app en el renderer, no solo los dos directorios nombrados

**Qué se decide**: además de borrar `mobile/` y `src/renderer/src/components/mobile/` (los dos
directorios que el criterio 5 nombra), se borró todo lo que servía exclusivamente a esa pantalla
dentro del renderer: la pestaña "Mobile" de Settings completa (`MobilePane`, `MobileSettingsPane`,
`MobilePairing*`, `MobilePaired*`, `mobile-pane-search`, `mobile-settings-search`,
`mobile-network-interface-selection`, `mobile-pairing-device-polling`,
`mobile-auto-restore-options`), el botón y el badge de onboarding en la sidebar
(`mobile-sidebar-onboarding-badge`, el bloque `showMobileButton` de `SidebarNav.tsx`), la entrada
"mobile" del catálogo de navegación de Settings (`settings-navigation-types.ts`,
`settings-navigation-capability-sections.ts`, `settings-setup-workflow-section-renderers.tsx`,
`settings-page-renderer.tsx`) y el toggle "Show Orca Mobile Button" de Appearance
(`AppearanceWindowSidebarSection.tsx`, `appearance-sidebar-search.ts`). El ícono compartido
`MobileBrandIcons.tsx` se movió a `src/renderer/src/components/settings/mobile-brand-icons.tsx`
porque también lo usa el panel del emulador (que no se tocó). No se tocó `src/main/ipc/mobile.ts`
ni el resto del protocolo de pairing en el proceso principal: nada de eso está exclusivamente al
servicio de la app borrada, y tocarlo es la zona que el criterio 6 dejó bloqueada (ver más abajo).

**Por qué**: dejar esa pantalla y ese botón sin conectar a nada (activeView 'mobile' sin página,
un botón de sidebar que abre una pantalla en blanco) es una regresión del camino crítico aunque el
eval literal del criterio 5 no la detecte; el criterio delega "qué archivos que solo servían a
mobile/ se borran junto con él" con el criterio de "se borra lo que no importa nadie más", y toda
esta superficie no tiene otro consumidor.

**La invalidaría**: que la spec 002 (que sí toca interfaz) decida reintroducir una pantalla de
pairing con otro nombre o mecanismo.

## 2026-09-02 · [spec 001] El appId vive duplicado en `.ts` y `.json`; los dos se actualizan juntos

**Qué se decide**: `src/shared/local-build-compatibility-contract.ts` (la fuente real que importa
`local-build-compatibility.ts`) y `src/shared/local-build-compatibility-contract.json` (que leen
el test de alineación, `mac-build-compatibility.cjs` y `electron-builder-config.test.mjs`) llevan
el mismo `appId: 'lat.producthub.andes'`. Node resuelve la extensión `.ts` antes que `.json` para
un import sin extensión, así que el `.json` por sí solo no alcanza.

**Por qué**: `pnpm test` quedó en rojo (`local-build-compatibility-contract.test.ts`) hasta corregir
el `.ts`; el `.json` ya estaba corregido pero no era el módulo que se importaba en runtime.

**La invalidaría**: que se unifiquen ambos archivos en uno solo.

## 2026-09-02 · [spec 001] Los bundle IDs de integraciones macOS (`com.stablyai.orca*`) no se tocan

**Qué se decide**: constantes como `ORCA_BUNDLE_ID` (press-and-hold), `MACOS_PACKAGED_BUNDLE_ID`
(notification-system-settings-link), `DEFAULT_COMPUTER_USE_BUNDLE_ID` (computer-use permissions),
`BASE_APP_USER_MODEL_ID` (Windows AppUserModelId), el dominio de `defaults` de TCC
(`macos-tcc-prompt-watch.ts`) y `DEV_BUNDLE_ID`/`--bundle-id` de los scripts de build de macOS
siguen hardcodeadas en `com.stablyai.orca*` y no se renombran a `lat.producthub.andes*`.

**Por qué**: el criterio 1 de la spec 001 solo pide `package.json` y `productName`/`appId` de
`config/electron-builder.config.cjs`; el "Estado previo" no releva estas constantes. Son
identidades propias de integraciones del sistema operativo (TCC, notificaciones, permisos de
Computer Use, AppUserModelId), no el `appId` del paquete, y sus propios tests siguen en verde
porque se comparan contra sí mismas. Cambiarlas es un rediseño de identidad de sistema operativo
más amplio que "no agregues alcance" no autoriza acá.

**La invalidaría**: quedan rotas de hecho apenas el paquete real se firme como
`lat.producthub.andes` — el permiso de TCC, la búsqueda de la app en Preferencias del Sistema y el
gate de Computer Use van a buscar el bundle id viejo contra un binario que ya no lo usa. Esto se
reactiva en la spec que firme y publique el paquete (fuera de alcance según "Efectos que escapan
del sistema" de esta spec).
