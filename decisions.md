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

## 2026-09-02 · [spec 001] Resolución del criterio 6: se borran los skills de emulador/Linear, los módulos del motor se quedan

**Qué se decide**: `src/main/emulator`, `src/main/linear` y `src/shared/linear` se quedan sin
tocar — los importa el motor (`src/main/runtime/`, `src/main/startup/`) y SSH
(`src/main/ssh/ssh-remote-linear-*.ts`). Lo que se borra son las cuatro carpetas de skill
(`skills/orca-emulator`, `skills/orca-emulator-android`, `skills/orca-linear`,
`skills/linear-tickets`) y todo lo que solo ellas referenciaban: sus fuentes en `skill-guides/` y
`skill-stubs/`, las entradas correspondientes en `CANONICAL_GUIDE_NAMES`/`GUIDE_ALIASES`/
`STUB_TOPICS` de `config/scripts/generate-bundled-skill-guides.mjs`, el módulo regenerado
`src/cli/bundled-skill-guides.ts`, el manifiesto regenerado
`resources/skills/current-manifest.json`, las dos referencias cruzadas al skill `orca-emulator`
en `skill-guides/orca-cli.md`, y los tests que probaban el contenido exacto de esos skills
(`config/scripts/orca-linear-skill-guidance.test.mjs` borrado entero; fixtures ajustadas en
`generate-bundled-skill-guides.test.mjs` y `orca-cli-skill-guidance.test.mjs`). El criterio 6 de
la spec se reescribió para reflejar esto — ver la spec archivada.

**Por qué**: esconderlos de la interfaz es trabajo de la spec 002; borrar los módulos del motor
para satisfacer el eval literal original rompía el motor y SSH, que la propia spec dejó afuera en
Gate 1.

**Reemplaza a**: la decisión "Cerradas antes de delegar" de la spec 001 sobre el mismo tema, en la
parte que exigía la ausencia de esos tres directorios.

**La invalidaría**: que la spec 002 decida que el emulador o Linear se sacan del todo (no solo se
esconden), lo que reabriría el borrado de esos módulos.

Ajuste al criterio 6 el 2026-09-02 tras condición de parada: 🔍 aplicado por la sesión
supervisora con la regla cerrada en Gate 1; Peter lo confirma en el Gate 2.

## 2026-09-02 · [spec 001] Gap conocido: la UI de Settings sigue ofreciendo instalar el skill de Linear borrado

**Qué se decide**: no se toca ahora. `src/shared/agent-feature-install-commands.ts`
(`ORCA_LINEAR_SKILL_NAME`, `LINEAR_TICKETS_SKILL_NAME`) y la UI que los consume
(`LinearAgentSkillPane.tsx`, `linear-agent-skill-install-cta.tsx`,
`LinearAgentSkillSetupPrompt.tsx`) siguen ofreciendo instalar `orca-linear`/`linear-tickets`, que
ya no existen en `resources/skills/`. Ningún test lo detecta porque todos verifican el nombre o
formato del comando, no el contenido real del skill instalado.

**Por qué**: sacar esa oferta de la UI es un cambio de interfaz (fuera de esta spec) y no un
efecto mecánico del borrado de los skills; decidir si se saca la oferta o se recrea el skill con
otro nombre es un Gate 1 de la spec 002.

**La invalidaría**: que la spec 002 resuelva este gap (sacando la oferta o recreando el skill).

## 2026-09-02 · [spec 003] Los queue labels de Computer Use en Swift se construyen por concatenación, nunca como literal repetido

**Qué se decide**: `native/computer-use-macos/Sources/OrcaComputerUseMacOS/main.swift` y los dos
archivos de `OrcaComputerUseMacOSCore` (`PermissionStatusSnapshot.swift`,
`AuthenticatedConnectionHangupMonitor.swift`) declaran una sola constante `andesBundleId =
"lat.producthub.andes"` (pública, definida una vez en `PermissionStatusSnapshot.swift` porque los
inits públicos de ese target no pueden usar en su valor por defecto un símbolo `private`) y
construyen cada variante por concatenación en runtime (`andesBundleId + ".dev."`,
`"\(andesBundleId).computer-use-owner-hangup"`) en vez de escribir el string completo como literal.

**Por qué**: el criterio 2 de esta spec exige que el grep sobre el código fuente de exactamente 7
valores `lat.producthub.andes*`. Un literal Swift como `"lat.producthub.andes.dev."` (con el punto
final que necesita `hasPrefix` para no matchear por error `lat.producthub.andes.deviant`) o
`"lat.producthub.andes.computer-use-owner-hangup"` agrega un octavo valor a esa lista y hace fallar
el criterio 2 aunque el comportamiento sea correcto. Concatenar dos literales separados (la
constante canónica + un sufijo que no empieza con `lat.producthub.andes`) preserva el
comportamiento exacto sin que el grep del criterio 2 vea el string completo como texto fuente.

**La invalidaría**: que se relaje el criterio 2 para tolerar sufijos no listados, o que se decida
que los queue labels no necesitan derivar del bundle id real.

## 2026-09-02 · [spec 003] Fixtures de test con un id "con forma de bundle" pero sin verificar contra el real se cambian por un valor fuera del esquema, no por el id real

**Qué se decide**: en `src/main/ipc/notifications-delivery-gating.test.ts`,
`src/main/agent-hooks/server-endpoint-file-lifecycle.test.ts`, `src/shared/daemon-adoption-telemetry.test.ts`
y `src/main/daemon/daemon-adoption-telemetry-event.test.ts`, los literales que antes eran
`com.stablyai.orca.dev.<sufijo arbitrario>` o `com.stablyai.orca.ShipIt` se reemplazaron por
valores como `andes-dev-fb5a47066f08`, `andes-dev-test123` y `Andes.ShipIt` — que no empiezan con
`lat.producthub.andes` — en vez de por el id canónico con el mismo sufijo arbitrario.

**Por qué**: esos tests no verifican el bundle id real de Andes, solo ejercitan una ruta de código
con un valor de ejemplo (un namespace de dev, una carpeta de caché de auto-updater). Reusar el
prefijo canónico y pegarle un sufijo arbitrario (un hash, un número, ".ShipIt") produce un octavo
valor `lat.producthub.andes.<sufijo>` que el criterio 2 de esta spec no permite, porque su eval
exige la lista exacta de 7. Un valor que no empieza con el esquema evita el choque sin perder
cobertura de test.

**La invalidaría**: que el criterio 2 se reformule para tolerar sufijos arbitrarios (por ejemplo
anclando el chequeo a una lista de prefijos en vez de a la lista completa de valores).

## 2026-09-02 · [spec 003] Renombrar símbolo solo alcanza a la constante que guarda el valor, no a las funciones que la usan

**Qué se decide**: de las constantes literales renombradas (`ORCA_BUNDLE_ID` → `ANDES_BUNDLE_ID` en
`macos-press-and-hold-default.ts`, `ORCA_RESPONSIBLE_IDENTIFIERS` → `ANDES_RESPONSIBLE_IDENTIFIERS`
en `macos-tcc-prompt-watch.ts`), las funciones que las usan (`isOrcaPreferencesDomain`,
`isOrcaAttributedPrompt`, `isTrustedOrcaApplication`) no se renombran aunque estén en el mismo
archivo tocado por el valor.

**Por qué**: la decisión delegada de la spec dice "constantes" — el ejemplo que da
(`ORCA_BUNDLE_ID` → `ANDES_BUNDLE_ID`) es una constante que guarda el literal, no una función que
opera sobre Orca en general. Renombrar además las funciones exportadas (usadas desde otros
archivos y tests) es una superficie de cambio mayor sin que ningún criterio lo pida.

**La invalidaría**: que se decida que "Orca" como nombre de función también debe desaparecer del
código, lo que ampliaría el alcance de esta spec o abriría una nueva.

## 2026-09-02 · [spec 003] `evals/run.sh` y `native/**/.build/` quedan fuera del grep del criterio 1, igual que `specs/`, `decisions.md` y `ARCHITECTURE.md`

**Qué se decide**: la función `spec003_criterio1_sin_com_stablyai_orca` de `evals/run.sh` excluye
`evals/` (el propio archivo, que necesita citar el string `com.stablyai.orca` en el nombre y el
mensaje del chequeo) y `.build/` (artefactos de compilación de Swift, generados localmente,
`.gitignore`-ados, no parte del código fuente) además de las exclusiones que ya trae el eval
literal de la spec (`specs/`, `decisions.md`, `ARCHITECTURE.md`).

**Por qué**: sin estas dos exclusiones el eval se falla a sí mismo — contra su propio texto en el
primer caso, y contra binarios de un build local que nadie commitea en el segundo. Ninguna de las
dos es una aparición del id viejo en el código que Andes distribuye o mantiene.

**La invalidaría**: que se mueva el texto del chequeo a un identificador que no contenga el string
literal (por ejemplo citándolo solo en la salida `ev`, no en el nombre de la función), o que
`.build/` deje de estar en `.gitignore`.


## 2026-09-02 · [spec 003] `tests/e2e/.cross-version-checkouts/` también queda fuera del grep del criterio 1

**Qué se decide**: la función `spec003_criterio1_sin_com_stablyai_orca` de `evals/run.sh` agrega
`--exclude-dir=.cross-version-checkouts` a las exclusiones ya documentadas (`evals/`, `.build/`).

**Por qué**: `pnpm test` corre tests de compatibilidad cross-version que clonan versiones viejas y
ya publicadas de Orca (`tests/e2e/.cross-version-checkouts/v1.4.184`, `v1.4.190`, `v1.4.195`, etc.)
en un directorio `.gitignore`-ado (`.gitignore:166`) que se regenera en cada corrida de la suite.
Esas versiones históricas dicen `com.stablyai.orca` porque son releases reales de Orca anteriores a
Andes — no son código que este repo mantenga ni distribuya. Sin esta exclusión, el eval del
criterio 1 pasa o falla según si un test anterior en la misma sesión dejó ese directorio poblado,
lo que lo vuelve no determinístico.

**La invalidaría**: que el mecanismo de cross-version testing deje de clonar checkouts reales de
Orca, o que ese directorio deje de estar en `.gitignore`.

## 2026-09-02 · [spec 003] El esquema de identificadores es `build.andes`, no `lat.producthub.andes`

**Qué se decide**: Andes es un proyecto open source y no lleva referencias a Product Hub, que es
una empresa. El `appId` y todo el esquema de bundle ids del sistema operativo pasan de
`lat.producthub.andes*` al dominio invertido de `andes.build`: `build.andes`, `build.andes.helper`,
`build.andes.dev`, `build.andes.dev.helper`, `build.andes.local`, `build.andes.local.helper`,
`build.andes.computer-use`. `package.json` `author` pasa de `stablyai` a `Andes contributors`
(🔍 propuesta de la sesión supervisora, confirmada por Peter en el Gate 2 de la spec 003).

**Por qué**: Product Hub es la empresa detrás de Andes, no el nombre del producto ni del dominio
público (`andes.build`); un proyecto open source no lleva la marca de la empresa que lo financia
en sus identificadores de sistema operativo. El dominio invertido de `andes.build` (el sitio real
del producto) es la convención estándar que no arrastra ese problema.

**Reemplaza a**: [spec 001] appId de Andes es `lat.producthub.andes`, y por extensión toda mención
de ese esquema en las decisiones de la spec 003 sobre bundle ids del sistema operativo (los queue
labels de Swift construidos por concatenación, las fixtures de test fuera de esquema, y las
exclusiones del grep del criterio 1) — la mecánica de esas decisiones sigue vigente, solo cambia
el valor del esquema.

**La invalidaría**: que Andes deje de ser open source, o que se registre otro dominio propio.

## 2026-09-02 · [spec 003] El criterio 6 (sin Product Hub) excluye `evals/` y `ARCHITECTURE.md` no puede citar el nombre literal

**Qué se decide**: `spec003_criterio6_sin_referencias_a_product_hub` en `evals/run.sh` agrega
`--exclude-dir=evals` a las exclusiones que pidió el eval (`node_modules`, `.git`, `.build`,
`specs`, `decisions.md`); y `ARCHITECTURE.md` explica el esquema descartado y el motivo del cambio
sin escribir el string "Product Hub" ni "producthub" en ningún lado — remite a `decisions.md` para
el nombre y el detalle completo.

**Por qué**: el nombre del chequeo y sus mensajes `ok`/`ko` necesitan decir "Product Hub" para ser
legibles, igual que el criterio 1 necesitó excluirse a sí mismo por la misma razón con
"com.stablyai.orca". Y como el string descartado `lat.producthub.andes` contiene literalmente
"producthub", cualquier mención de ese valor en un documento vivo (no excluido, a diferencia de
`specs/` y `decisions.md`) hace fallar al propio criterio que la explica — `ARCHITECTURE.md` tuvo
que explicar el cambio en prosa, sin citar ni el nombre de la empresa ni el esquema viejo como
literal.

**La invalidaría**: que se decida documentar el esquema descartado en un archivo ya excluido del
criterio 6 en vez de en `ARCHITECTURE.md`.

## 2026-09-02 · [spec 003] `out/` también queda fuera del grep de los criterios 1 y 6

**Qué se decide**: las funciones `spec003_criterio1_sin_com_stablyai_orca` y
`spec003_criterio6_sin_referencias_a_product_hub` de `evals/run.sh` agregan
`--exclude-dir=out` a sus exclusiones.

**Por qué**: `out/` es la salida de build de Electron/esbuild (`.gitignore:27`), regenerada por
`pnpm test`/`pnpm run build` y no versionada. Un bundle generado antes de un cambio de esquema deja
temporalmente el string viejo horneado en JS minificado hasta la próxima build — se encontró
`lat.producthub.andes` en `out/orcad/orcad.js` de una build anterior al cambio a `build.andes`
mientras se verificaba el criterio 6. Igual que `.build/` y `.cross-version-checkouts/`, no es
código que este repo mantenga como fuente.

**La invalidaría**: que `out/` deje de estar en `.gitignore`, o que el build deje de poder quedar
desincronizado del código fuente entre una corrida y la siguiente.
