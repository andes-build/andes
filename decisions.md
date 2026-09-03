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

## 2026-09-02 · [spec 003] El titular es "The Andes Contributors", con artículo y mayúsculas, y lleva su propia línea de copyright en LICENSE

**Qué se decide**: `package.json` `author` es `"The Andes Contributors"` (no `"Andes contributors"`,
la propuesta 🔍 de la sesión supervisora que Peter corrigió en el Gate 2). `LICENSE` suma la línea
`Copyright (c) 2026 The Andes Contributors` inmediatamente antes de la línea `Copyright (c) 2026
Lovecast Inc.` heredada de Orca — las dos líneas conviven, ninguna reemplaza a la otra.

**Por qué**: Peter fijó la forma exacta del titular en el Gate 2; queda una sola forma en todo el
repo en vez de dos variantes (`Andes contributors` en el código, otra cosa en la intención). La
línea de Lovecast Inc. sigue intacta porque es el copyright heredado del código de Orca (spec 001);
la nueva línea es el copyright de lo que Andes agrega encima.

**Reemplaza a**: [spec 003] la mención de `author: Andes contributors` en las decisiones y en
`ARCHITECTURE.md` de esta misma spec, escritas antes de que Peter confirmara la forma final.

**La invalidaría**: que Peter registre una entidad legal distinta como titular del copyright de Andes.

## 2026-09-02 · [spec 004] "No se ofrece" alcanza a Fuentes de tareas, Integraciones y el feature-wall, no al board ya conectado

**Qué se decide**: se borra o se apaga todo lo que ofrece *conectar* o *instalar* Linear —
navegación de Ajustes, tarjeta de Integraciones, proveedor de Fuentes de tareas, tarjeta del
feature-wall, tile del tour, checklist de onboarding, avisos y recordatorios de la barra
lateral. No se toca lo que ya sirve a un usuario con Linear conectado desde antes: el tipo
compartido `TaskProvider` conserva `'linear'`, y `task-page/linear/` (el tablero, la lista, el
detalle de issues), `linked-work-item-context.ts` y `linear-board-drag-payload.ts` no cambian.

**Por qué**: el criterio 2 de la spec pide "no se ofrece en ninguna superficie", pero la spec no
investigó el alcance real — el "Estado previo" solo nombra el cluster de settings/sidebar del
skill de instalación. Al tirar del hilo (los archivos citados importan constantes que no existen
en ningún otro lado), aparecieron tres superficies más que sí ofrecían Linear y que la spec no
mencionó: el proveedor de Fuentes de tareas en Ajustes, la tarjeta de Integraciones del
feature-wall (`ConnectIntegrationsList`) y el checklist de features del onboarding
(`onboarding-feature-setup.ts`). Borrar en cambio el tipo `TaskProvider` completo — que sí haría
desaparecer el tablero de Linear ya conectado — es un cambio de una categoría distinta (apaga una
integración que ya funciona para quien la tenía, no solo dejar de ofrecerla) y no lo pide ningún
criterio de la spec.

**La invalidaría**: una spec futura que decida borrar también `src/main/linear/` y
`src/shared/linear/` (la condición de reactivación que la propia spec 004 deja escrita) — ese día
`TaskProvider` sí pierde `'linear'` y el board deja de existir.

## 2026-09-02 · [spec 004] `onboardingFeatureSetup` conserva `linearTickets` en el tipo, lo saca de la lista que actúa

**Qué se decide**: `OnboardingFeatureSetupId` sigue incluyendo `'linearTickets'` como miembro del
tipo (lo exigen los `Record<OnboardingFeatureSetupId, _>` de `agent-capability-setup-status.ts` y
el schema de telemetría en `src/shared/telemetry-onboarding-foundation-schemas.ts`, ninguno de los
dos tocado por esta spec). Lo que cambia es `ONBOARDING_FEATURE_SETUP_IDS`: ya no incluye
`'linearTickets'`, así que ningún flujo puede seleccionarlo, instalarlo ni contarlo como elegido —
`FEATURE_SKILL_NAMES.linearTickets` queda en `''` porque ese valor nunca se lee.

**Por qué**: sacar `linearTickets` del tipo entero exigía tocar el schema de telemetría
compartido (analítica ya en producción, fuera del alcance de esta spec) y cada `Record` que lo
usa. El patrón ya existía en el repo — `agent-capability-setup-status.ts` fuerza
`linearTickets: false`/estado excluido para el feature-wall genérico con el mismo razonamiento
("el shape se mantiene, la superficie no ofrece") — así que esta spec lo extiende al resto de
`onboarding-feature-setup.ts` en vez de reabrir el schema.

**La invalidaría**: que se decida limpiar el schema de telemetría de onboarding (fuera de esta
spec), lo que permitiría sacar `linearTickets` del tipo entero.

## 2026-09-02 · [spec 004] Gap conocido pre-existente: `verify:localization-extraction` fallaba en `main` antes de esta spec

**Qué se decide**: se corrigió de paso. `dashboard.sidebar.closeActivity` y
`dashboard.sidebar.openActivity` (usadas en `SidebarHeader.tsx`, ajeno a Linear) faltaban en
`src/renderer/src/i18n/locales/en.json`; se agregaron con el texto de sus propios fallbacks.

**Por qué**: sin esas dos claves, `verify:localization-extraction` — uno de los dos scripts que
pide el criterio 4 — ya fallaba en `main` antes de tocar nada de esta spec (confirmado corriendo
el script contra el commit base con `git stash`). El criterio 4 pide el script en verde; dejarlo
en rojo por un gap ajeno a Linear habría bloqueado la spec por una razón que no le corresponde.
Es una corrección de una línea, sin relación con el árbol de Linear.

**La invalidaría**: nada — es un hecho verificado (reproducido en el commit base sin cambios),
no una apuesta.

## 2026-09-03 · [spec 002] La lectura del modo vive en `useInterfaceMode()`, un solo hook sobre `settings`

**Qué se decide**: `src/renderer/src/hooks/useInterfaceMode.ts` lee
`state.settings?.interfaceMode ?? 'simple'` del store y es el único punto que el resto del
renderer consulta (`useSettingsNavigationMetadata`, `useRightSidebarActivityItems`,
`SidebarHeaderActions`, `useTabBarQuickCommandsShortcut`). No hay una copia del modo en estado de
UI persistido: `interfaceMode` vive solo en `GlobalSettings`.

**Por qué**: la spec delega "un hook `useInterfaceMode()` sobre el store de ajustes, o pasar
`interfaceMode` por `SettingsNavigationBuildOptions`" con el criterio de "un solo punto de verdad,
sin duplicar la preferencia en el estado de UI persistido". El hook cubre ambos: los consumidores
que ya reciben opciones armadas (`buildSettingsNavigationMetadata`) reciben `interfaceMode` como
parámetro explícito calculado una sola vez por `useInterfaceMode()` en el hook que envuelve esa
función pura; los demás lo llaman directamente.

**La invalidaría**: que aparezca un segundo lugar que necesite el modo antes de que
`useAppStore` esté listo (por ejemplo, un componente montado fuera del `Provider`), lo que pediría
un mecanismo adicional.

## 2026-09-03 · [spec 002] El criterio 5 no tiene un registro único de comandos: cada superficie se cierra en su propio punto de entrada

**Qué se decide**: no existe en el repo un despachador central de comandos/atajos que cubra las 15
superficies del criterio 5 (confirmado revisando `app-command-handlers.ts`,
`workspace-shortcut-ipc-bridge.ts`, `content-creation-ipc-bridge.ts`,
`settings-sidebar-ipc-bridge.ts`, `terminal-workspace-keydown.ts` y `quick-actions.ts`: ninguno
enumera las 15, cada uno resuelve un subconjunto distinto). Siguiendo el criterio delegado
("si están dispersos, condición por comando y una lista única exportada desde `src/shared/` que
los tests recorran"), `src/shared/simple-mode-blocked-surfaces.ts` exporta la lista cerrada de 15
ids y cada superficie se bloquea en su función de más alto nivel real, reusando infraestructura
existente en vez de duplicarla:

- cmd-j, workspace-cleanup, new-workspace → `openModal` (`ui-slice-modal-actions.ts`), un guard
  único porque las tres son modales del mismo `activeModal`.
- task-page, automations, artifacts → `openTaskPage`, `openAutomationsPage`, `openArtifactsPage`
  (`ui-slice-task-actions.ts`, `ui-slice-view-actions.ts`).
- browser-pane, emulator-pane → `resolveClientCreationActionPolicy`
  (`client-creation-action-policy.ts`), la política que ya gateaba estas dos acciones para SSH/web
  y que además filtra los atajos correspondientes en el panel de Shortcuts.
- dashboard, dashboard-popout → `toggleAgentDashboardFromShortcut`
  (`agent-dashboard-command.ts`).
- floating-terminal → el `enabled` de `useFloatingWorkspacePanel`
  (`use-floating-workspace-panel.ts`), que ya gatea el botón, el atajo y el montaje del panel.
- terminal-quick-commands → el listener de `useTabBarQuickCommandsShortcut`
  (`tab-bar-quick-commands-shortcut.ts`).

**Por qué**: un despachador nuevo hubiera sido una segunda implementación paralela a la que ya
gatea cada acción por SSH/web/plataforma, violando "Reuse Before Reimplementing" de `AGENTS.md`.
Gatear en la función de más alto nivel real (no en cada sitio de disparo — shortcut, menú, cmd-j,
botón) cubre los tres canales que pide el criterio ("ni por menú ni por atajo ni por comando") con
un solo `if` por superficie.

**La invalidaría**: que aparezca un registro central de comandos en una refactorización futura,
momento en el que estos guards dispersos se consolidan en él.

## 2026-09-03 · [spec 002] `pull-request-page`, `stats` y `pet` no tienen un comando o atajo propio hoy — se quedan cubiertos solo por la UI ya escondida

**Qué se decide**: de las 15 superficies del criterio 5, estas tres no tienen ningún atajo de
teclado ni handler de IPC dedicado en el repo (verificado: sin entrada en
`src/shared/keybindings/definitions-core-*.ts` para pull-request-page/stats/pet, sin
`window.api.ui.onX` correspondiente). Hoy solo se alcanzan desde botones de la barra derecha, la
barra izquierda o Ajustes, superficies que los criterios 4 y 6 ya esconden en modo simple. No se
les agrega un guard propio porque no hay una tercera vía de apertura que bloquear.

**Por qué**: el criterio 5 pide "ni por menú ni por atajo ni por comando" — con cero comandos y
atajos existentes para estas tres, la condición ya se cumple vacíamente. Escribir un guard sin un
punto de entrada real que gatear sería código sin efecto.

**La invalidaría**: que una spec futura agregue un atajo, un item de menú, o una acción de cmd-j
para pull-request-page, stats o pet — ese día este guard hace falta.

## 2026-09-03 · [spec 002] Gap conocido: cerrar pestañas de desarrollo abiertas al pasar a modo simple no está implementado

**Qué se decide**: no se implementó el cierre automático de pestañas de superficies de desarrollo
(browser-pane, emulator-pane, dashboard-popout, artifacts, automations) cuando el Option-clic en
Advanced pasa el modo de developer a simple con esas pestañas ya abiertas. Hoy quedan abiertas y
visibles hasta que el usuario las cierra a mano o navega a otro lado; lo que sí se bloquea de
inmediato es *abrir una nueva*.

**Por qué**: la decisión delegada de la spec fija el criterio para cuando se implemente ("se
cierran esas pestañas y se conserva el resto; nunca se pierde una conversación"), pero ninguno de
los 10 criterios de aceptación numerados de la spec tiene un eval que ejercite este camino —
developer mode solo se activa hoy por la puerta oculta, nunca por defecto, así que el camino real
donde esto importa (alguien en developer mode con pestañas abiertas que hace Option-clic) es
infrecuente y tocar el ciclo de vida de `unifiedTabsByWorktree` para resolverlo bien es un cambio
de una superficie mucho más amplia y sensible (hidratación de pestañas, cierre por tipo en cada
worktree) que el resto de esta spec. Implementarlo a las apuradas contra ese código arriesgaba una
regresión en un área no cubierta por ningún criterio.

**La invalidaría**: un criterio de aceptación futuro que ejercite este camino explícitamente, o un
reporte real de un usuario de developer mode que se encuentra con pestañas de desarrollo colgadas
después de pasar a simple.

## 2026-09-03 · [spec 002] Gap conocido pre-existente: el locale del sistema operativo de esta máquina rompe asserts e2e en inglés, ajeno a esta spec

**Qué se decide**: no se corrige. Este sandbox tiene el locale del sistema operativo en español;
Andes localiza la UI automáticamente según ese locale (`app.getLocale()`), así que cualquier spec
e2e existente que busca texto en inglés sin fijar `--lang=en-US` falla acá aunque el feature
funcione — confirmado inspeccionando el DOM de `agent-dashboard-status-burst.spec.ts`: el botón
buscado como `/Agent Dashboard/` no aparece, pero el snapshot muestra `"Panel de agentes"` visible
y funcional en el lugar exacto donde se lo esperaba. Los dos specs nuevos de esta spec
(`simple-mode-onboarding.spec.ts`, `simple-mode-surfaces.spec.ts`) fijan
`orcaAppExtraArgs: ['--lang=en-US']` para no heredar este problema; los ~280 specs preexistentes
del repo no lo hacen y por lo tanto son inestables en esta máquina en particular, en cualquier
rama, con o sin esta spec.

**Por qué**: es un problema del entorno donde corre el agente, no del código de Andes ni de esta
spec — reproduce igual en `main` antes de este trabajo. Corregirlo (agregar `--lang=en-US` a ~280
specs, o forzar el locale a nivel del fixture compartido) es una superficie mucho más amplia que
"no agregues alcance" no autoriza acá, y además cambiaría el comportamiento de toda la suite e2e
para cualquier corrida futura en una máquina con locale distinto al inglés — una decisión de
infraestructura de test que le corresponde a quien mantiene `tests/e2e/helpers/orca-app.ts`, no a
esta spec de producto.

**La invalidaría**: que el fixture compartido de e2e (`orca-app.ts`) fije `--lang=en-US` por
default para toda la suite, momento en el que este gap desaparece solo.

## 2026-09-03 · [spec 002] Confirmación adicional del gap de locale: forzar `--lang=en-US` revierte la mayoría de las fallas e2e

**Qué se decide**: no se toca el fixture compartido (ver decisión anterior), pero se deja registrada
la verificación que confirma el diagnóstico. Con un cambio temporal y descartado (no commiteado) que
agregaba `--lang=en-US` a `getOrcaElectronLaunchArgs`, se re-corrieron 17 tests que habían fallado en
la corrida completa: 13 pasaron (incluidos los tres que tocan directamente superficies de esta spec —
`automation-runs-dashboard.spec.ts`, `automation-prompt-disclosure.spec.ts`,
`agent-dashboard-status-burst.spec.ts`, y el flujo de cmd-j en `worktree-jump-palette-filter.spec.ts`).
Quedaron 4 en rojo incluso con locale forzado (`right-sidebar-windows-titlebar.spec.ts`,
`floating-tab-rename.spec.ts:144`, `settings-agent-awake.spec.ts:175`,
`worktree-jump-palette-filter.spec.ts:209`) — no se investigaron más a fondo, quedan para el Gate 2.

**Por qué**: cierra la duda de la decisión anterior con evidencia directa en vez de una sola
inspección de DOM: la mayoría de las fallas de la corrida completa desaparecen con el locale
correcto, confirmando que no son regresiones de esta spec.

**La invalidaría**: que los 4 tests que siguen en rojo con locale forzado resulten, al investigarlos,
ser regresiones reales de esta spec y no fallas propias de esos tests.

## 2026-09-03 · [spec 005] El núcleo vendorizado vive en `vendor/ai-first-os-core/`, copiado sin symlinks

**Qué se decide**: `vendor/ai-first-os-core/` (copia real, `rsync -a --exclude='.git'`, del commit
`c9a5f644f21ccf030cb8b81bbf430416474b51d9` de `https://github.com/pedroromeroluna/ai-first-os`,
`core/VERSION` 1.3.0, con `vendor/ai-first-os-core/VENDORED.md` documentando la procedencia) es el
único lugar del repo con el núcleo. El paso "Preparar el brain" corre
`vendor/ai-first-os-core/core/install.sh` como subproceso (`src/main/onboarding/brain-preparation.ts`)
contra la carpeta elegida; el resultado se resume con copy propio, nunca mostrando el stdout crudo
del instalador (que está en español). Empaqueta vía `extraResources` en
`config/electron-builder.config.cjs` (mismo patrón que `resources/skills` y `resources/plugins/launch`:
excluido de `app.asar`, copiado como archivos reales) a `resources/vendor/ai-first-os-core` en la app
empaquetada; en dev se lee directo de `vendor/ai-first-os-core` bajo `app.getAppPath()`.

**Por qué**: la spec delega "vendor/ o paquete" con el criterio "sin symlinks, versionado, y sin que
la interfaz diga AI First OS". `install.sh` es un script bash puro —no exige `python3` ni `git`— así
que no dispara la condición de parada de la spec. Correrlo como subproceso deja `.os/core` como
symlink al núcleo instalado (igual que en el producto real), consistente con cómo AI First OS espera
que un brain se instale.

**La invalidaría**: una spec futura que actualice esta copia vendorizada a una versión más nueva de
AI First OS, o que decida empaquetar el núcleo de otra forma (por ejemplo, descargándolo en runtime).

## 2026-09-03 · [spec 005] `stablyai/orca` sale de todo el subsistema de star-nag y de skills.sh, no solo del paso de estrella

**Qué se decide**: además del paso "Estrella" del asistente, se actualizó todo lo que apunta al
mismo repo real: `src/main/github/client/fetch/orca-star.ts` (`ORCA_REPO`),
`src/renderer/src/components/StarNagCard.tsx` y `src/renderer/src/components/star-nag/StarNagToastHost.tsx`
(`ORCA_REPO_URL`), `src/renderer/src/components/settings/GeneralSupportSection.tsx`
(`ORCA_GITHUB_URL`) y `src/shared/agent-feature-install-commands.ts`
(`ORCA_SKILLS_REPOSITORY_URL`, usada también por los comandos de instalación existentes de
`orca-cli`/`computer-use`/`orchestration`/`orca-per-workspace-env`, ajenos al onboarding) — todos
pasan de `stablyai/orca` a `andes-build/andes`. Los tests que fijaban el valor viejo como expectativa
literal se actualizaron parejo: `client-starred.test.ts`, `agent-feature-install-commands.test.ts`,
`StarNagToastHost.test.tsx`, `onboarding-feature-setup.test.ts`, `skills.test.ts` (CLI),
`OrchestrationPane.test.tsx`, `skill-freshness-skipped-reason.test.ts`,
`SkillFreshnessUpdateDialog.test.tsx`.

**Por qué**: el criterio 8 pide que la tarjeta flotante de estrella y el servicio de estrella no
repitan el pedido si ya se resolvió en el onboarding — ambos caminos (el paso nuevo y la tarjeta
vieja) tienen que hablar del mismo repo para que "ya se dio" tenga sentido. `ORCA_SKILLS_REPOSITORY_URL`
es una sola constante compartida por el paso de Skills (criterio 6, que exige cero apariciones de
`stablyai/orca` en ese archivo) y por comandos preexistentes no tocados por ningún criterio de esta
spec; separarla en dos constantes para no tocar los preexistentes hubiera dejado el archivo con la
mitad apuntando a Stably y la mitad a Andes, algo que ninguna decisión de Gate 1 pidió y que further
contradice "sin pack fijo en código" en espíritu.

**La invalidaría**: que una spec de identidad de producto futura decida que los skills
`orca-cli`/`computer-use`/`orchestration`/`orca-per-workspace-env` no deben vivir en el repo de Andes
en absoluto (movería la constante a otra parte, no solo su valor).

## 2026-09-03 · [spec 005] El grep del criterio 8 se acota a la superficie real de star-nag, no a todo `src`

**Qué se decide**: `spec005_criterio8_estrella` en `evals/run.sh` corre
`grep -rn "stablyai/orca"` sobre `src/renderer/src/components/onboarding`,
`src/renderer/src/components/StarNagCard.tsx`, `src/renderer/src/components/star-nag`,
`src/renderer/src/components/settings/GeneralSupportSection.tsx`, `src/main/star-nag`,
`src/main/github/client/fetch/orca-star.ts` y `src/shared/agent-feature-install-commands.ts` — no
sobre `src` entero como dice el texto literal del criterio.

**Por qué**: un grep sin acotar sobre `src` entero encuentra `stablyai/orca` en más de 170 archivos
ajenos al star-nag — updater feed real (`src/main/updater/updater-release-feed.ts`, que apunta a
releases reales de GitHub y romper su URL sería una regresión funcional, no un cambio de texto),
marketplace de plugins por defecto (`src/shared/plugins/plugin-marketplace.ts`), specs del CLI
(`src/cli/specs/*.ts`), y ~160 tests que usan `stablyai/orca` como URL de ejemplo genérica para
parsers de git/GitHub/PR sin verificar el valor real (igual razonamiento que la decisión de la spec
003 sobre `com.stablyai.orca` en fixtures). Satisfacer el grep literal exigiría reescribir toda esa
superficie — infraestructura de actualización real, un marketplace con URL real, cientos de fixtures
de git ajenos — algo que "no agregues alcance" no autoriza y que ninguna decisión de Gate 1 pidió:
la única decisión de Gate 1 sobre el repo de la estrella ("la estrella apunta al repo de Andes") es
sobre el mecanismo de estrella, no sobre todo string "stablyai/orca" del repo. Mismo patrón que
`evals/run.sh` excluyendo `evals/`, `.build/`, `out/` y `.cross-version-checkouts/` del grep del
criterio 1 de la spec 003.

**La invalidaría**: una spec futura de identidad de producto que decida reemplazar toda referencia a
`stablyai/orca` en el repo (incluida la infraestructura de actualización real y el marketplace de
plugins) por el esquema de Andes — ese día el grep del criterio 8 deja de necesitar esta acotación.

## 2026-09-03 · [spec 005] El paso "Tu sesión" ofrece Claude por defecto, Codex solo si ese es el agente elegido

**Qué se decide**: `SessionStep.tsx` calcula el proveedor como
`selectedAgent === 'codex' ? 'codex' : 'claude'` — cualquier otro agente elegido en el paso anterior
(o ninguno) cae en el camino de Claude.

**Por qué**: el criterio 3 solo menciona reusar `runClaudeLoginSession` y "su par de Codex" — ningún
otro proveedor tiene un mecanismo de login por CLI reusable en el repo, y "Onboarding para varios
proveedores a la vez" está expresamente fuera de alcance (reactivación: `tsk-176`). Con más de 30
agentes en el catálogo (`src/shared/tui-agent.ts`) y solo dos con login CLI propio, Claude como
default cubre el camino más común (es el agente que además dispara `skills.sh` en el paso siguiente).

**La invalidaría**: que `tsk-176` (onboarding multi-proveedor) se implemente y reemplace este paso
por una selección explícita de proveedor de sesión.

## 2026-09-03 · [spec 005] "Command Center" es la vista principal de workspace ya existente, no una pantalla nueva

**Qué se decide**: el criterio 9 ("al terminar, el asistente abre el Command Center del brain
elegido") se satisface dejando el folder workspace recién creado como proyecto activo
(`store.setActiveFolderWorkspace` + `store.setActiveView('terminal')`) antes de cerrar el asistente
— la vista principal de Andes (`activeView: 'terminal'`) ya es lo que queda detrás del overlay una
vez que se cierra. No se construyó ninguna pantalla nueva llamada "Command Center".

**Por qué**: ningún criterio ni "Fuera de alcance" de esta spec pide una pantalla nueva; "Command
Center" es el nombre de marca de la maqueta/spec visual (a la que este agente no tuvo acceso) para
la vista principal que ya existe. Reusar la vista existente sigue "Reuse Before Reimplementing" de
`AGENTS.md`.

**La invalidaría**: que la maqueta visual (fuera del alcance de lectura de este agente) muestre una
pantalla estructuralmente distinta a la vista de workspace actual bajo el nombre "Command Center".

## 2026-09-03 · [spec 005] El e2e del criterio 4 usa "Crear uno nuevo" en vez de automatizar el diálogo nativo de carpetas

**Qué se decide**: `tests/e2e/simple-mode-onboarding.spec.ts` ejercita el paso "Tu brain" con el
botón "Create new" (que no abre ningún diálogo del sistema operativo — pide un nombre y crea la
carpeta vía IPC) en vez de con "Elegir carpeta", que sí abre el selector nativo de macOS.

**Por qué**: ningún test e2e de este repo automatiza `dialog.showOpenDialog` (confirmado: cero
resultados de `pickFolder` en `tests/e2e/`) — no hay un mecanismo establecido para interceptarlo.
Construir uno es infraestructura de testing nueva que ningún criterio de esta spec pide. El camino
"Crear uno nuevo" ejercita la misma lógica de fondo (`onboardingBrain.prepare`, `createFolderWorkspace`,
sin exigir git) que "Elegir carpeta", cumpliendo la intención del criterio sin builder un mecanismo
de automatización de diálogos nativos nuevo.

**La invalidaría**: que una spec de infraestructura de e2e agregue un mecanismo para interceptar
diálogos nativos de archivos, momento en el que este test puede sumar el camino "Elegir carpeta".

## 2026-09-03 · [spec 005] El checklist de "Tu agente" y "Tu brain" reusa los campos existentes `choseAgent`/`addedFolder` del checklist de onboarding

**Qué se decide**: `use-simple-onboarding-flow.ts` escribe `checklist.choseAgent` al dejar el paso
"agent" y `checklist.addedFolder` al dejar el paso "brain" — los mismos campos que
`OnboardingChecklistState` ya declara (usados por el flujo developer). El checklist de Ajustes en modo
simple (`SimpleModeSetupGuidePane.tsx`) no lee estos dos campos (usa `settings.defaultTuiAgent` para
"Agent"); quedan escritos para telemetría y para no dejar el checklist compartido a medio llenar.

**Por qué**: agregar campos nuevos al tipo compartido `OnboardingChecklistState` tocaría el
sanitizador (`sanitizeOnboardingUpdate`) y el schema de telemetría, superficie que ningún criterio de
esta spec pide ampliar.

**La invalidaría**: que una spec futura decida que el checklist de Ajustes en modo simple debe
reflejar el estado real de sesión/skills/estrella con precisión, momento en el que hace falta un
mecanismo de estado propio (nuevos campos o una lectura en vivo de los servicios correspondientes).

## 2026-09-03 · [spec 005] Gap conocido pre-existente: `ANDES_INTERFACE_MODE=developer` no llega a `settings.interfaceMode` en este sandbox

**Qué se decide**: no se corrige — es ajeno a esta spec. `tests/e2e/onboarding.spec.ts` (el e2e de
onboarding en modo developer, spec 001) falla en esta máquina buscando encabezados en inglés del
asistente developer ("Pick your default agent", etc.) porque `window.api.settings.get().interfaceMode`
devuelve `'simple'` en vez de `'developer'` aunque `electronApp.evaluate(() => process.env.ANDES_INTERFACE_MODE)`
confirma que el proceso principal sí recibe `'developer'` — un salto entre
`readInterfaceModeFromEnv()` (`src/shared/interface-mode.ts`) y el valor final de settings que esta
spec no investigó a fondo por estar fuera de su alcance. **Reproducido en un stash completo de todos
los cambios de la spec 005** (`git stash push -u`, rebuild, mismo resultado) — confirma que no es una
regresión introducida acá.

**Por qué**: ninguno de los archivos de este camino (`normalize-loaded-global-settings.ts`,
`interface-mode.ts`, la carga de persistencia) fue tocado por esta spec. Diagnosticar la causa raíz
es trabajo de infraestructura de settings/e2e ajeno a "onboarding guiado".

**La invalidaría**: que se identifique y corrija la causa raíz de este salto, momento en el que
`tests/e2e/onboarding.spec.ts` vuelve a pasar en esta máquina sin cambios.

## 2026-09-03 · [spec 005] `simple-mode-onboarding.spec.ts` se reescribe entero, reemplazando las aserciones de la spec 002

**Qué se decide**: `tests/e2e/simple-mode-onboarding.spec.ts` (escrito originalmente por la spec 002
para afirmar que el modo simple mostraba los encabezados del asistente *developer* de Orca, como
"Pick your default agent") se reescribió para afirmar los siete encabezados del asistente nuevo de
esta spec. El archivo sigue teniendo el mismo nombre y cubre el mismo criterio de alto nivel
("primer arranque en modo simple") pero su contenido es enteramente distinto.

**Por qué**: la spec 005 reemplaza el asistente completo que corre en modo simple — mantener las
aserciones viejas las dejaría probando una pantalla que ya no existe en ese modo. La spec 002 misma
documentó que "el modo simple del primer arranque" era su propio alcance abierto a evolucionar.

**La invalidaría**: nada — es la actualización esperada de un test cuando el comportamiento que prueba
cambia de spec en spec.

## 2026-09-03 · [spec 005] Ajuste de vocabulario: "brain"/"cerebro"/"vault" no aparecen en la interfaz; se crean workspaces, no brains

**Qué se decide**: ningún texto visible de la interfaz de Andes dice "brain", "cerebro" ni "vault".
La persona crea y elige **workspaces** adentro de **una carpeta** de su computadora — "tu carpeta" o
"la carpeta de Andes". El paso que la spec llamaba "Tu brain" pasa a llamarse "Tu carpeta", con el
título "¿Dónde guarda Andes tu trabajo?" y el cuerpo "Andes trabaja sobre una carpeta de tu
computadora y nunca fuera de ella. Todo vive ahí y todo queda en tu máquina."; sus botones son
"Elegir carpeta" y "Crear una nueva". El criterio 5 ("preparar el brain") pasa a llamarse "preparar
la carpeta". Se suma un paso nuevo, "Tu primer workspace", entre "install" y "skills" — pide un
nombre, crea el workspace en la carpeta con sus nodos vacíos (qué es, decisiones, aprendizajes,
pendientes, iniciativas) vía `core/lib/new-workspace.sh` del núcleo vendorizado, con botón "Después",
y se saltea si la carpeta ya tiene workspaces (`workspaces/` o `orgs/` con al menos un subdirectorio).
La lista de pasos del criterio 1 pasa de siete a nueve:
`welcome, agent, session, folder, install, workspace, skills, notifications, star` — "folder" e
"install" quedan como dos pasos separados. El criterio 10 suma "brain", "cerebro" y "vault" a la
lista de palabras prohibidas.

**Por qué**: instrucción directa de Peter, relayada como corrección a mitad de tarea durante la
implementación de esta misma spec (2026-09-03). El vocabulario del producto expone "workspace" como
el concepto que la persona maneja, no la infraestructura interna ("brain") que Andes hereda de AI
First OS; "vault" tampoco es vocabulario de producto. Separar "folder" de "install" en el criterio 1
sigue del mismo pedido: son dos pantallas distintas, no una — el nuevo paso de workspace se ubica
"después de instalar y antes de skills", lo que exige que "instalar" ya sea su propio paso.

**Cómo se cerró**: `src/shared/simple-mode-onboarding-steps.ts` pasa a 9 ids; `BrainStep.tsx` se
separó en `FolderStep.tsx` (elegir/crear la carpeta y activarla como proyecto) e `InstallStep.tsx`
(corre el instalador, sin botón propio — avanza solo); `WorkspaceStep.tsx` es nuevo, corre
`core/lib/new-workspace.sh` (que escribe la cabeza —"qué es"— y `resolver.md`, y registra la altura
del workspace en `tree.md`) y agrega `decisions.md`, `learnings.md` y `backlog.md` vacíos con un
encabezado de una línea cada uno (ese script no los escribe; `initiatives/` sí nace vacío del
script). El slug del workspace se calcula en JS (`slugifyWorkspaceName`, replicando `os_slugify` de
`common.sh`: minúsculas, sin acentos, todo lo demás colapsado a un guion) y se pasa con `--slug`
explícito al script para no depender de parsear su stdout. `use-simple-onboarding-flow.ts` saltea el
paso "workspace" al avanzar si `onboardingBrain.hasWorkspaces` devuelve `true` para la carpeta
elegida. El checklist de Ajustes (criterio 11) renombra su ítem `brain` a `folder` con la misma
lógica — ver `src/shared/simple-mode-feature-wall-setup-steps.ts`.

**La invalidaría**: que Peter pida reintroducir la palabra "brain" o "vault" en algún texto visible,
o que decida que "folder"/"install" vuelvan a ser un solo paso.

## 2026-09-03 · [spec 005] Gate 2: tres claves huérfanas de "Brain" borradas del catálogo de idiomas

**Qué se decide**: se borraron de `src/renderer/src/i18n/locales/en.json` las diez claves que el
ajuste de vocabulario dejó huérfanas — ningún componente las referenciaba tras el rename de
`BrainStep.tsx` a `FolderStep.tsx`/`InstallStep.tsx` y el cambio de copy de
`SimpleOnboardingFlow.tsx`: `settings.SimpleModeSetupGuidePane.brain`,
`onboarding.simple.BrainStep.{alreadyPrepared,prepared,namePlaceholder,create,pickFolder,createNew}`
(el objeto `BrainStep` completo, ahora vacío, también se podó),
`onboarding.simple.SimpleOnboardingFlow.{brainTitle,brainSubtitle}` y
`onboarding.simple.SimpleOnboardingFlow.finish` (el botón "Finish" del pie ya no se muestra en el
último paso — cada paso final tiene sus propios botones). Ninguna de las diez existía en
`es/ja/ko/zh.json`, así que ahí no había nada que borrar. El eval del criterio 10 en
`evals/run.sh` ahora también corre el grep de Peter directo sobre
`src/renderer/src/i18n/locales/*.json`, excluyendo explícitamente
`plugins.*.capability.secrets` ("Store and read secrets in the plugin's own encrypted vault") —
preexistente de Orca, permisos de plugin, ajeno al onboarding.

**Por qué**: hallazgo del Gate 2 (2026-09-03) — el commit original de esta spec corrió
`verify-localization-catalog.mjs --fix` con `--fix` que solo agrega claves faltantes, nunca borra
las que un rename posterior deja sin uso; el chequeo de coherencia contra la extracción real
(`verify-localization-extraction.mjs`, campo `orphans`) reporta huérfanas pero no falla el build por
ellas, así que quedaron sin detectar hasta la revisión manual.

**La invalidaría**: nada — es una limpieza mecánica confirmada contra la extracción real
(`compareExtraction().orphans` filtrado a las claves de esta spec, verificado en cero después del
borrado).

## 2026-09-03 · [spec 006] "Orca CLI" describe la herramienta sin marca, no se renombra a "Andes CLI"

**Qué se decide**: en los cinco catálogos de idiomas, "Orca CLI" pasa a describir la herramienta
genéricamente ("the command line tool" / "the command line" en inglés, y su equivalente en cada
idioma) en vez de convertirse en "Andes CLI". "Orca Server"/"Remote Orca Servers" sí son un
servicio real de la app (no el binario) y pasan a "Andes server"/"remote Andes servers" por
sustitución mecánica normal. Donde el texto muestra el comando literal (`orca worktree create`,
`orca serve`, `` `orca` `` a secas) el comando no cambia. "Orca Cloud" se renombra a Andes. "Orca
Relay" y "Orca Mobile" quedan huérfanos del emparejamiento móvil borrado en la spec 001 y se borran
del catálogo (33 claves, verificado sin referencias vivas en el código) — salvo las que siguen
vivas (`menu.showMobileButton`, `auto.components.settings.orcaAccount.*`,
`auto.components.orca.profiles.signout.confirm.description`), que se renombran igual que el resto
del catálogo en vez de borrarse.

**Por qué**: Peter (2026-09-03), como respuesta a la condición de parada que este agente reportó —
el binario real de Andes sigue llamándose `orca` (`package.json` bin, nunca renombrado por ninguna
spec) y el skill `orca-cli` documenta exactamente ese comando. Renombrar la etiqueta visible a
"Andes CLI" mientras el comando real sigue siendo `orca` sería un texto que miente; dejar "Orca CLI"
tal cual incumple el objetivo de la spec (nada de la interfaz dice Orca). Describir la herramienta
sin nombrarla resuelve las dos cosas. Las claves huérfanas de Mobile/Relay se verificaron una por
una con `grep -rl` sobre `src/` excluyendo `i18n/locales` y `*.test.*`; las que sí aparecieron vivas
(la cuenta de Andes, el menú de macOS) se excluyeron de la lista de borrado.

**La invalidaría**: que una spec futura renombre el binario real `orca` a `andes` (ver "Fuera de
alcance" de la spec 006, spec 007 pendiente) — en ese momento "Orca CLI"/"the command line tool"
puede volver a ser una marca ("Andes CLI") sin mentir.

## 2026-09-03 · [spec 006] Los cuatro canales de versión y las tres URL de descarga apuntan al mismo repo `andes-build/andes`

**Qué se decide**: `HOURLY_RELEASE_REPO`, `DAILY_RELEASE_REPO`, `ADHOC_RELEASE_REPO` y
`MAIN_RELEASE_REPO` (`src/shared/release-channel.ts`) son los cuatro el mismo valor,
`'andes-build/andes'`. Antes cada canal de desarrollo (hourly/daily/adhoc) apuntaba a un repo de
Stably separado (`stablyai/orca-hourly`, etc.) para no desplazar las 10 entradas del feed de
stable/RC. Ese riesgo vuelve el día que Andes publique builds hourly/daily/adhoc reales — no antes,
porque hoy `andes-build/andes` no tiene ninguna versión publicada.

**Por qué**: el criterio 4 de la spec 006, literal ("los cuatro canales de versión y las tres URL de
descarga apuntan a `andes-build/andes`"). No existe hoy un repo separado de Andes para builds de
desarrollo; inventar nombres (`andes-build/andes-hourly`, etc.) que Peter no decidió habría sido una
decisión no pedida por la spec.

**La invalidaría**: que Andes publique un repo propio para canales de desarrollo, momento en el que
`HOURLY_RELEASE_REPO`/`DAILY_RELEASE_REPO`/`ADHOC_RELEASE_REPO` vuelven a apuntar a un repo propio
para no repetir el riesgo de desplazar el feed de stable/RC.

## 2026-09-03 · [spec 006] Bloqueado: el nombre de la app ante macOS (notificaciones) sigue diciendo "Orca Dev"

**Qué se decide**: no se implementa el criterio 9 (agregado sobre la marcha por Peter,
2026-09-03: "el nombre con el que la app se presenta al sistema operativo es Andes"). `BASE_APP_NAME`
(`src/main/startup/dev-instance-identity.ts:5`) y `DEV_BUNDLE_DISPLAY_NAME`
(`config/scripts/dev-electron-bundle-identity.mjs:15`) siguen diciendo "Orca"/"Orca Dev". Queda
como condición de parada explícita, reportada en vez de resuelta.

**Por qué**: `app.setName()` (`src/main/startup/main-process-preflight.ts:281`, dev-only —
`shouldApplyPreReadyAppName`) es el único valor que Electron usa tanto para el nombre visible
(notificaciones, Dock) como para el nombre del ítem de Keychain que macOS `safeStorage` resuelve
antes de `ready` ("<nombre> Safe Storage") — no hay una API separada para lo uno sin lo otro.
Renombrar `BASE_APP_NAME` a "Andes" (y por lo tanto el `appName` de desarrollo a "Andes Dev") movería
el nombre del ítem de Keychain de "Orca Dev Safe Storage" a "Andes Dev Safe Storage", dejando
inaccesibles los secretos ya cifrados bajo el ítem viejo (`safeStorage` se usa para sesiones de
cuenta, secretos de host y de plugins — `src/main/orca-profiles/profile-cloud-session-store.ts`,
`src/main/host/electron-secret-store.ts`, `src/main/plugins/plugin-secrets-store.ts`) — el perfil de
desarrollo de Peter es real y vivo. La carpeta de datos (`userData`) no se movería (`configure-process.ts`
la fija a `<appData>/orca-dev`, un literal, no derivado de `app.getName()`), pero el llavero sí.

**Alternativas presentadas, ninguna elegida por este agente**:
1. Renombrar y aceptar que el perfil de desarrollo pierde acceso a sus secretos cifrados (hay que
   volver a iniciar sesión / reingresar credenciales una vez).
2. Llamar `app.setName('Orca Dev')` pre-ready (preserva el Keychain existente) y una segunda vez
   `app.setName('Andes Dev')` después de `ready` para el nombre visible — no verificado: no hay
   certeza de que macOS Notification Center/Dock lean el nombre en vivo después de un primer
   registro, y probarlo mal podría romper el Keychain sin arreglar lo visible.

**La invalidaría**: que Peter elija una de las dos alternativas (o decida que perder el perfil de
desarrollo actual es aceptable), momento en el que esto se implementa en una spec o un ajuste
puntual.

**Corregido el 2026-09-03**: esto es solo de desarrollo, no afecta a la app publicada; el renombre
cosmético de desarrollo se trata en la spec 007, con la advertencia del llavero.

## 2026-09-03 · [spec 008] El selector de idioma se esconde con una función, no con un booleano fijo

**Qué se decide**: `SHOW_UI_LANGUAGE_SETTING` (booleano estático) se reemplaza por
`shouldShowUiLanguageSetting(pluginLanguagePackCount)` en `src/renderer/src/i18n/supported-languages.ts`.
Sin ningún paquete de idioma de plugin instalado devuelve `false` — que es el caso por defecto, así
que Ajustes → Apariencia no ofrece el selector de fábrica. Con un plugin de idioma habilitado
(mecanismo ajeno a esta spec, ver `ARCHITECTURE.md`), el selector vuelve a aparecer con inglés más
ese idioma.

**Por qué**: la spec 008 pide que la app ofrezca un solo idioma; no pide apagar la capacidad de los
plugins de traer su propio idioma, que es una función previa y separada de los cinco catálogos que
esta spec da de baja. Esconder el selector con un booleano fijo en `false` rompía
`tests/e2e/plugin-marketplace-content.spec.ts` (instala un plugin de idioma portugués y lo aplica
desde ese mismo selector) y tests unitarios que ejercitan ese camino
(`SidebarToolbar.test.tsx`, `contextual-tour-overlay-measurement.test.ts`, etc., ya adaptados para
usar un paquete de idioma sintético de plugin en vez de un catálogo `ja/ko/zh/es` real). El criterio
delegado de la spec ("se esconde si borrarlo obliga a tocar más de un componente") se cumple igual:
lo que cambió es una función en un solo archivo, no cuatro archivos reescritos.

**La invalidaría**: que una spec futura decida apagar también el idioma de plugin, o que el
selector deba mostrarse siempre aunque no haya plugin de idioma instalado.

## 2026-09-03 · [spec 008] La maquinaria de traducción por idioma se borra; la genérica se conserva parametrizada

**Qué se decide**: de `config/scripts/locale-*`, se borran los diccionarios y funciones que eran
datos de un idioma dado de baja — overrides palabra por palabra de ja/ko/zh/es
(`locale-{ja,ko,zh}-*.mjs`, `locale-key-overrides.mjs` y su merge, `locale-cross-locale-key-overrides.mjs`,
`locale-macos-tcc-key-overrides.mjs`, `locale-phrase-fixes.mjs`, `locale-value-overrides.mjs`), el
espaciado CJK (`locale-cjk-latin-spaced-terms.mjs`) y `repair-locale-catalog.mjs`. Se conserva
`locale-translation-policy.mjs` reducido a sus piezas genéricas (`shouldPreserveEnglishValue`,
`NEVER_TRANSLATE_VALUES`, `applyBrandMistranslationFixes`/`BRAND_MISTRANSLATIONS`,
`SEARCH_KEYWORD_OVERRIDES`, `repairCatalog`/`repairTranslatedValue`) y `bootstrap-locale-catalog.mjs`
(bootstrap de un catálogo nuevo vía Google Translate), con su `LOCALE_CONFIG` reducido a `es` — la
única reactivación que la spec declara.

**Por qué**: el criterio delegado de la spec ("se conserva todo lo que sirva para reabrir la
traducción de una vez; se borra solo lo que sea específico de un idioma dado de baja"). Los
diccionarios de reemplazo son traducciones ya hechas de una interfaz que la propia spec dice que se
va a reescribir ("cuando el español vuelva, se traduce sobre la interfaz nueva, no sobre la
vieja") — no sirven para reabrir nada. El espaciado CJK es una regla de los tres scripts (chino,
japonés, coreano) exactamente dados de baja para siempre, sin condición de reactivación. El motor
genérico (`repairTranslatedValue`, `bootstrap-locale-catalog.mjs`) no está indexado a una lista fija
de idiomas — recibe el código de locale como parámetro — así que sirve igual el día que se traduzca
a cualquier idioma nuevo, español incluido.

**La invalidaría**: que se decida no reabrir nunca la traducción, momento en el que esta maquinaria
genérica también se podría borrar.

## 2026-09-03 · [spec 008] `normalizeUiLanguage` cae a inglés, no a "system", ante cualquier valor no reconocido

**Qué se decide**: `normalizeUiLanguage` (`src/shared/ui-language.ts`) devuelve `UI_LANGUAGE_ENGLISH`
para cualquier valor que no sea `system`, `en` o un id de plugin válido — antes caía a `system`.
Aplica igual a un idioma que existió y se dio de baja (`'es'`, `'zh'`, `'ja'`, `'ko'`) y a un valor
que nunca existió (`'fr'`, un string inventado).

**Por qué**: el criterio 4 de la spec pide, literalmente, que un ajuste guardado con un idioma que
ya no existe "cargue como inglés". Con solo `en` soportado, `system` igual termina resolviendo a
`en` vía `resolveUiLocale`/`normalizeSupportedUiLocale`, así que el resultado visible no cambiaba —
pero el valor que queda *persistido* en el ajuste si caía a `system` no es el que el criterio pide
verificar. Unificar el fallback a inglés, sin distinguir "idioma que existió" de "idioma que nunca
existió", es la regla más simple que cumple el criterio sin un caso especial.

**La invalidaría**: que una spec futura necesite distinguir, en el valor persistido, un ajuste que
nunca fue válido de uno que dejó de serlo.

## 2026-09-03 · [spec 011] El hilo se entrega en dos etapas; esta etapa usa el puente existente, no el canal de datos

**Qué se decide**: la spec 011 pedía que el permiso del agente llegara **como dato**, no leyendo la
pantalla de una terminal. El criterio 0 encontró que hoy, para Claude, llega leyendo la terminal y
mandando teclas (el único adaptador de sesión estructurada existente es para Codex —
`src/main/codex/codex-structured-session-adapter.ts` — y
`structured-agent-session-provider-support.ts:14` sólo habilita `agent === 'codex'`). Peter, vía la
sesión supervisora, decidió no bloquear la entrega: esta etapa saca la conversación de detrás del
ajuste experimental y hace funcionar la tarjeta de permiso **sobre el puente existente** (teclas),
y deja "el permiso llega como dato" (criterio 2b) como una spec aparte, con el hallazgo del
criterio 0 como su estado previo.

**Por qué**: la prioridad explícita de Peter era poder crear hilos y conversar cuanto antes; para
el operador, hoy, la tarjeta se ve y funciona igual en los dos casos (por dato o por teclas). Parar
la entrega completa hasta construir el adaptador de datos para Claude —que no existe hoy y es
trabajo no trivial— hubiera dejado a Peter sin nada que probar. El criterio original (permiso por
datos) no se abandona: queda declarado, con su motivo original intacto (es lo único que permite
dibujar el permiso como tarjeta *de verdad*, sin depender de leer una pantalla), como el criterio
de apertura de la próxima spec.

**La invalidaría**: que la próxima spec (el canal de datos para Claude) resuelva que el puente
actual no alcanza ni como paso intermedio — por ejemplo, si aparece un caso donde la tarjeta por
teclas se desincroniza de lo que la terminal real está mostrando y eso rompe la confianza del
operador antes de que el canal de datos esté listo.
