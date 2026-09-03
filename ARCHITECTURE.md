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

## Linear no se ofrece (spec 004)

- **Se borró** el cluster entero de settings/sidebar que ofrecía instalar el skill de Linear:
  `LinearAgentSkillPane`, `LinearAgentSkillGuide`, `LinearAgentSkillNotes`,
  `TaskSourceLinearSetup`, `linear-agent-skill-install-cta`, `use-linear-agent-skill-setup`,
  `linear-agent-skill-search`, `linear-agent-skill-guide-content`, `linear-usage-examples` (todo
  en `src/renderer/src/components/settings/`); `LinearAgentSkillSetupPrompt`,
  `LinearAgentSkillSetupDialog`, `linear-agent-skill-runtime`, `linear-agent-skill-setup-copy`,
  `linear-agent-skill-setup-reminders`, `linear-agent-skill-setup-reminder-toast` (en
  `src/renderer/src/components/sidebar/`); `linear-agent-skill-update-command` (en
  `src/renderer/src/lib/`). Las constantes `ORCA_LINEAR_SKILL_NAME`, `LINEAR_TICKETS_SKILL_NAME`,
  `LINEAR_AGENT_SKILL_NAMES` y sus comandos de instalación/actualización salieron de
  `src/shared/agent-feature-install-commands.ts`.
- **Se sacó, sin borrar el módulo que lo sostiene**: la sección `linear` de la navegación de
  Ajustes (`settings-navigation-capability-sections.ts`), la tarjeta de Linear en Integraciones
  (`LinearIntegrationCard` salió de `task-tracker-integration-cards.tsx`), el proveedor `linear`
  de Fuentes de tareas (`TasksPane.tsx` itera `OFFERED_TASK_PROVIDERS`, un subconjunto de
  `TASK_PROVIDERS` sin `'linear'`; el tipo compartido `TaskProvider` no cambia), la tarjeta de
  Linear en la lista de conexión del feature-wall (`ConnectIntegrationsList.tsx`) y el tile de
  Linear en el tour (`feature-wall-workflows.ts`, que ahora promociona Jira). El onboarding
  (`onboarding-feature-setup.ts`) mantiene `linearTickets` como miembro de
  `OnboardingFeatureSetupId` — lo exige el `Record<OnboardingFeatureSetupId, _>` que comparten la
  telemetría y el feature-wall — pero lo saca de `ONBOARDING_FEATURE_SETUP_IDS`, la única lista
  que decide qué se instala, selecciona o telemetra como elegido.
- **Se queda intacto, a propósito**: `src/main/linear/`, `src/shared/linear/`,
  `src/main/ssh/ssh-remote-linear-*.ts`, y todo lo que ya usaba Linear como fuente de trabajo
  vinculado antes de conectar nada nuevo — `linear-board-drag-payload.ts`, el board/lista/tabla de
  Linear en `src/renderer/src/components/task-page/linear/`, `linked-work-item-context.ts` y el
  resto de `use-task-page-linear-*`. Un usuario que ya tenía Linear conectado y visible en Tasks
  sigue viéndolo ahí; lo que desaparece es la manera de conectarlo o habilitarlo de nuevo.

## Modo simple y modo desarrollo (spec 002)

Andes tiene una sola preferencia de modo, `interfaceMode: 'simple' | 'developer'`
(`src/shared/interface-mode.ts`), default `simple`. Nada se borra: todo lo que el modo simple
esconde sigue compilado, probado y disponible en modo developer — el modo es un filtro de
visibilidad, nunca una segunda implementación.

- **Sin control visible.** El único selector de `Ajustes → General` no existe. La puerta oculta es
  doble: la variable de entorno `ANDES_INTERFACE_MODE=developer` al arrancar (leída una vez en
  `normalizeLoadedGlobalSettings`, gana siempre sobre el valor persistido), o Option-clic en el
  título de `Ajustes → Advanced` (`nextInterfaceModeOnAltClick`, en
  `settings-advanced-section-renderers.tsx`), que escribe la preferencia y aplica en caliente.
- **Navegación de Ajustes**: los cuatro constructores (`settings-navigation-*-sections.ts`) generan
  la misma lista completa en los dos modos; `buildSettingsNavigationMetadata` filtra el resultado a
  `SIMPLE_MODE_SETTINGS_NAV_IDS` (`src/shared/simple-mode-settings-nav.ts`, los diez ids del
  criterio 3) solo cuando el modo es simple.
- **Barra derecha**: `ActivityBarItem.hiddenInSimpleMode` marca Checks, PR checks (Attached
  worktrees, Parent PR checks) y Ports; el sistema de plugins (`Plugin`) se apaga en la misma
  condición dentro de `useRightSidebarActivityItems`. El filtro vive en
  `getVisibleRightSidebarActivityItems` (`right-sidebar-activity-visibility.ts`).
- **Barra izquierda**: `computeWorktreeCardGitDetailVisibility`
  (`worktree-card-git-detail-visibility.ts`) apaga issue/linear-issue/jira-issue/review/automation
  sin tocar la preferencia `cardProps` del usuario; `SidebarHeaderActions` esconde el botón de
  nuevo worktree y el filtro por repositorio (`SidebarWorkspaceOptionsMenu` /
  `CompactWorkspaceOverflow`) en la misma condición.
- **Comandos y atajos**: no hay un registro único de comandos en el repo, así que cada una de las
  15 superficies del criterio 5 se bloquea en su propio punto de entrada real —
  `src/shared/simple-mode-blocked-surfaces.ts` documenta la lista completa y cada gate:
  `openModal` (cmd-j, workspace-cleanup, new-workspace), `openTaskPage` / `openAutomationsPage` /
  `openArtifactsPage`, `resolveClientCreationActionPolicy` (browser-pane, emulator-pane, y de paso
  el atajo de Shortcuts que los anuncia), `toggleAgentDashboardFromShortcut` (dashboard,
  dashboard-popout), el `enabled` de `useFloatingWorkspacePanel` (floating-terminal) y el listener
  de `useTabBarQuickCommandsShortcut` (terminal-quick-commands). `pull-request-page`, `stats` y
  `pet` no tienen un comando o atajo propio hoy — solo se abren desde botones ya escondidos por los
  dos puntos anteriores; no hay un tercer gate que agregarles.
- **Fixture e2e**: la suite existente asume modo developer por default —
  `tests/e2e/helpers/orca-app.ts` y `orca-restart.ts` fijan `ANDES_INTERFACE_MODE=developer` en el
  `env` de `electron.launch`, y un spec que necesite modo simple lo pisa con
  `test.use({ launchEnv: { ANDES_INTERFACE_MODE: 'simple' } })`
  (`tests/e2e/simple-mode-onboarding.spec.ts`, `tests/e2e/simple-mode-surfaces.spec.ts`). La corrida completa de la suite existente con este fixture quedó **verificada parcialmente** — pendiente para el Gate 2, con el hallazgo de un locale español pre-existente del sandbox que confunde el resultado (ver `decisions.md` y la sección Evidencia de `specs/done/002-modo-simple-y-modo-desarrollo.md`).
- **Onboarding**: el paso de Integraciones (`IntegrationsStep.tsx`) ya no menciona "pull request" ni
  "worktree" en su copy — son superficies que no existen en modo simple, el modo del primer
  arranque.

Fuera de alcance, con condición de reactivación documentada en la spec archivada
(`specs/done/002-modo-simple-y-modo-desarrollo.md`): la pantalla del modo simple en sí, ocultar el
explorador de archivos o el editor, un control visible para cambiar de modo, y la activación
automática del modo developer al montar un repositorio.

## Documentación histórica ajustada

- `config/reliability-gates.jsonc`: los gates cuyo test surface era 100% de la app móvil borrada
  (`mobile-ui.drawer-close-continuity`, `mobile-relay.endpoint-recovery`,
  `mobile-transport.lifecycle-liveness`) se eliminaron del manifiesto. Los gates mixtos
  (`terminal-query.mobile-view-authority`, `terminal-runtime.mobile-stream-budget`) conservan sus
  archivos de `src/` (motor/renderer) y perdieron solo las referencias a `mobile/`.

## Onboarding guiado — modo simple (spec 005)

El modo simple no reusa el asistente de Orca: `OnboardingFlowRouter.tsx` (montado en
`AppRootSurfaces.tsx` en lugar de `OnboardingFlow` directo) elige entre el asistente developer de
Orca (`OnboardingFlow.tsx`, sin cambios) y `SimpleOnboardingFlow.tsx` según `useInterfaceMode()`.

- **Pasos** (`src/shared/simple-mode-onboarding-steps.ts`): `welcome, agent, session, folder,
  install, workspace, skills, notifications, star` — nueve, fijos, sin skip salvo "workspace" (ver
  abajo). La lista original de Gate 1 tenía siete y fusionaba "folder"/"install" en un solo paso
  "brain"; el ajuste del 2026-09-03 (📌 Peter) los separó y agregó "workspace", y sacó la palabra
  "brain" de todo texto visible (ver `decisions.md`).
- **Tu agente** (`SimpleAgentStep.tsx`): reusa `AgentStep.tsx` de Orca sin tocarlo; si no hay
  agentes detectados, agrega un bloque con los comandos oficiales de instalación de Claude Code y
  Codex, un botón de copiar (`window.api.ui.writeClipboardText`), un link a la documentación de cada
  uno, y "Search again" (reusa `refreshDetectedAgents` del store).
- **Tu sesión** (`SessionStep.tsx`): un solo proveedor a la vez — Claude por default, Codex si el
  agente elegido es `codex` — vía `window.api.claudeAccounts.add` / `codexAccounts.add`, que ya
  envuelven `runClaudeLoginSession` y su par de Codex. Nunca muestra una contraseña o token.
- **Tu carpeta** (`FolderStep.tsx`): "Elegir carpeta" (`window.api.repos.pickFolder`) o "Crear una
  nueva" (IPC `onboardingBrain:createFolder`, crea `<Documents>/Andes/<slug>`); cualquiera de las
  dos activa la carpeta como proyecto (`createProjectGroup` + `createFolderWorkspace` +
  `setActiveFolderWorkspace` + `setActiveView('terminal')`) sin abrir el modal "Add Project". No
  exige que la carpeta sea un repositorio git.
- **Preparar la carpeta** (`InstallStep.tsx`): corre sin botón propio — al entrar, llama
  `onboardingBrain:prepare` y avanza sola al terminar. El núcleo que instala es una copia
  vendorizada versionada del proyecto público AI First OS, en `vendor/ai-first-os-core/`
  (`vendor/ai-first-os-core/VENDORED.md` documenta el commit y la versión exactos) — copiada con
  `rsync`, sin symlinks, empaquetada vía `extraResources` a `resources/vendor/ai-first-os-core` en
  el build (excluida de `app.asar`, mismo patrón que `resources/skills`). `src/main/onboarding/
  brain-preparation.ts` corre `<núcleo>/install.sh` como subproceso (`runProcess`, nunca
  `child_process` directo) contra la carpeta elegida y detecta "ya preparada" chequeando
  `.os/core`, `CLAUDE.md`, `.claude/agents` antes de correrlo. Ningún texto de la interfaz dice "AI
  First OS".
- **Tu primer workspace** (`WorkspaceStep.tsx`, ajuste del 2026-09-03, sin criterio propio): pide un
  nombre y corre `<núcleo>/lib/new-workspace.sh` (`src/main/onboarding/workspace-creation.ts`), que
  escribe la cabeza del workspace ("qué es") y `resolver.md`, y registra su altura en `tree.md`;
  después de correrlo se agregan `decisions.md`, `learnings.md` y `backlog.md` vacíos (con un
  encabezado de una línea cada uno — el script no los escribe) junto al `initiatives/` que el script
  sí crea. El slug se calcula en JS (`slugifyWorkspaceName`, replica `os_slugify` de `common.sh`) y
  se pasa explícito con `--slug` al script. El paso se saltea (`hasExistingWorkspaces`, IPC
  `onboardingBrain:hasWorkspaces`) si la carpeta ya tiene `workspaces/` u `orgs/` con al menos un
  subdirectorio — chequeado en `use-simple-onboarding-flow.ts` al avanzar hacia este paso.
- **Skills** (`SkillsStep.tsx`, opcional): sin pack fijo en código — un campo de texto para el repo,
  sugerido vacío por defecto. Construye el comando con `buildSkillsPackInstallCommand`
  (`src/shared/agent-feature-install-commands.ts`, nueva función junto a la existente
  `buildAgentFeatureSkillInstallArgs` — comparten la validación de agentes objetivo) dirigido
  exactamente a los agentes detectados en el paso "Tu agente", y lo corre en el mismo
  `OnboardingInlineCommandTerminal` que ya usa Orca. Antes chequea `npx` reusando el mismo mecanismo
  de PATH rehidratado que la detección de agentes (`detectNpxAvailabilityWithShellPathHydration`,
  IPC `preflight:detectNpx`); sin `npx`, ofrece el link oficial de Node y sigue.
- **Notificaciones**: reusa `NotificationStep.tsx` de Orca sin cambios.
- **Estrella** (`StarStep.tsx`): último paso — "Give it a star" abre `https://github.com/andes-build/
  andes` y marca `window.api.starNag.complete()`; "Not now" marca `starNag.later()`. Ambos botones
  terminan el asistente de inmediato (no hay un botón "Finish" separado en el último paso). El mismo
  repo reemplaza a `stablyai/orca` en toda la superficie real de star-nag —
  `src/main/github/client/fetch/orca-star.ts`, `StarNagCard.tsx`, `StarNagToastHost.tsx`,
  `GeneralSupportSection.tsx` y `agent-feature-install-commands.ts` (esta última también usada por
  comandos preexistentes de Orca ajenos al onboarding — ver `decisions.md`).
- **Checklist de Ajustes en modo simple** (`SimpleModeSetupGuidePane.tsx`, criterio 11): lista aparte
  de la de Orca — `agent, session, folder, skills, notifications, star`
  (`src/shared/simple-mode-feature-wall-setup-steps.ts`) — enrutada desde
  `settings-setup-workflow-section-renderers.tsx` por `interfaceMode`, igual patrón que
  `OnboardingFlowRouter`.
- **Repetir la configuración inicial** (criterio 12): botón en Ajustes → General
  (`RepeatOnboardingSetting.tsx`), reusa `showOnboardingFromRenderer()` que Orca ya tenía.

No hay una pantalla nueva llamada "Command Center" (criterio 9): terminar el asistente deja la
carpeta elegida como proyecto activo y `activeView: 'terminal'`, la vista principal que ya existe
detrás del overlay.

## Restos de la marca Orca (spec 006)

- **Catálogos de idiomas**: los cinco (`en, es, ja, ko, zh` en `src/renderer/src/i18n/locales/`) no
  dicen "Orca" salvo las excepciones técnicas de `config/scripts/orca-brand-exceptions.mjs` (único
  archivo, con motivo por entrada), verificado por `config/scripts/verify-no-orca-branding.mjs`
  (`\bOrca\b` sobre valores, tras aplicar las excepciones). "Orca CLI" describe la herramienta sin
  marca ("the command line tool" / "the command line" en inglés, equivalente en cada idioma) porque
  el binario real sigue llamándose `orca` — ver `decisions.md`. "Orca Server" y "Orca Cloud" sí se
  renombraron a Andes (son un servicio real de la app, no el binario). Los comandos literales entre
  comillas invertidas (`` `orca worktree create` ``, `` `orca serve` ``) no cambiaron: son el
  binario real. Las 33 claves huérfanas de "Orca Mobile"/"Orca Relay" (emparejamiento móvil borrado
  en la spec 001, sin referencia viva en el código) se borraron del catálogo en vez de traducirse;
  las pocas que sí siguen vivas (`menu.showMobileButton`, `orcaAccount.*`,
  `orca.profiles.signout.confirm.description`) se renombraron igual que el resto.
- **Enlaces visibles**: los ocho del inventario de la spec apuntan a `github.com/andes-build/andes`
  (`Landing.tsx`, `SidebarFeedbackDialog.tsx`, `SidebarSettingsHelpMenu.tsx`,
  `TerminalErrorToast.tsx`, `ShareUsageButton.tsx`, `share-card-utils.tsx`,
  `ProjectViewStates.tsx`, `link-routing-preference-dialog.tsx`).
- **Actualizador**: `HOURLY_RELEASE_REPO`, `DAILY_RELEASE_REPO`, `ADHOC_RELEASE_REPO` y
  `MAIN_RELEASE_REPO` (`src/shared/release-channel.ts`) son los cuatro `'andes-build/andes'` — sin
  repo propio de Andes para canales de desarrollo, los cuatro comparten el único repo público (ver
  `decisions.md`: el riesgo de desplazar el feed de stable/RC que motivaba repos separados en Orca
  vuelve el día que existan builds hourly/daily/adhoc reales, no antes). Las tres URL de descarga
  (`updater-prerelease-feed.ts`, `updater/updater-release-feed.ts`, `updater/updater-setup.ts`)
  apuntan al mismo repo. Ningún cambio tocó la firma del paquete ni el flujo de
  `electron-updater` más allá de las URL. El alimentador de versiones
  (`fetchNewerReleaseTagsWithReadiness`) ya degradaba sin versiones publicadas o con error de red a
  `{ tags: [], state: 'no-newer' | 'unavailable' }` sin lanzar — cubierto con test dedicado.
- **Marketplace de plugins**: sigue siendo el de Orca (`stablyai`), decidido en Gate 1 — fuera de
  alcance, ver "Fuera de alcance" de `specs/done/006-restos-de-la-marca-orca.md`.
- **Cierra el hueco de la spec 002**: pasar de developer a simple ahora cierra las pestañas de
  desarrollo ya abiertas — `src/renderer/src/store/slices/interface-mode-simple-switch.ts`
  (`closeDeveloperOnlySurfacesForSimpleMode`, llamada desde `updateSettings`/`updateSettingsOrThrow`
  cuando `interfaceMode` pasa de `developer` a `simple`): cierra toda pestaña `browser`/`simulator`
  de `unifiedTabsByWorktree` (con `closeBrowserTab` primero para las de tipo `browser`, que también
  limpia `browserTabsByWorktree`), manda `activeView` de vuelta a `terminal` si estaba en
  `tasks`/`automations`/`artifacts`, y cierra el drawer del dashboard de agentes. Nunca toca
  `terminal` ni `agent-session`: la conversación sigue.
- **La app publicada ya se llama Andes ante el sistema operativo**: `productName: 'Andes'`
  (`config/electron-builder.config.cjs`) fija el `CFBundleName`/AppUserModelId real de cualquier
  build empaquetado. Lo que queda diciendo "Orca"/"Orca Dev" es solo la instancia de *desarrollo*
  (`BASE_APP_NAME`, `src/main/startup/dev-instance-identity.ts`), aplicado por `app.setName()` —
  gateado a `isDev` (`shouldApplyPreReadyAppName`) y sin efecto en un paquete publicado. Ese
  renombre cosmético de desarrollo pasa a la spec 007: `app.setName()` alimenta también el nombre
  del ítem de Keychain que `safeStorage` resuelve antes de `ready`, así que cambiarlo sin cuidado
  arriesga los secretos ya cifrados del perfil de desarrollo — ver "Decisiones".

## Un solo idioma mientras la interfaz cambia (spec 008)

Andes queda en inglés. `src/renderer/src/i18n/locales/` tiene un solo catálogo, `en.json`; los
otros cuatro (`es`, `ja`, `ko`, `zh`) se borraron junto con toda su maquinaria de traducción
específica. Español vuelve en una sola pasada cuando el Command Center, el hilo y los archivos
dejen de moverse (fuera de alcance de esta spec); japonés, coreano y chino no vuelven — venían de
Orca y nadie los pidió.

- **Los idiomas soportados son código, no una lista de valores.** `src/shared/ui-language.ts`
  declara `UI_LANGUAGE_SYSTEM` y `UI_LANGUAGE_ENGLISH` únicamente (más el patrón
  `plugin:<pluginKey>/<locale>` de un idioma que trae un plugin, ajeno a esta spec).
  `normalizeUiLanguage` — usado por la carga de ajustes guardados
  (`src/main/persistence/loading-store/normalize-loaded-global-settings.ts`) y por el saneo de
  actualizaciones (`src/main/persistence/applying-settings/settings-update.ts`,
  `src/main/ipc/settings.ts`) — normaliza cualquier valor que no sea `system`, `en` o un id de
  plugin válido a `en`: un ajuste guardado con `'es'`/`'zh'`/un valor inventado carga como inglés,
  nunca rompe. `src/shared/ui-locale.ts` (`SUPPORTED_UI_LOCALES = ['en']`) resuelve lo mismo del
  lado de la resolución de locale real (i18next).
- **El selector de Ajustes → Apariencia se esconde, no se borra.**
  `shouldShowUiLanguageSetting(pluginLanguagePackCount)` (`src/renderer/src/i18n/supported-languages.ts`)
  devuelve `false` sin ningún plugin de idioma instalado — que es el caso por defecto, así que la
  app ofrece un solo idioma de fábrica. Se conservó como función (no como booleano estático) porque
  el marketplace de plugins puede seguir agregando un idioma propio (por ejemplo el paquete de
  portugués de ejemplo) independiente de los cinco catálogos que tenía Orca; ese camino sigue
  vivo y probado (`AppearanceInterfaceSection.tsx`, `AppearancePane.tsx`,
  `appearance-interface-summary.ts`) — es la razón por la que esta spec no volvió el flag a un
  `true`/`false` fijo.
- **La maquinaria de traducción que sirve para reabrir la traducción se conservó** en
  `config/scripts/`: `bootstrap-locale-catalog.mjs` (bootstrap de un catálogo nuevo vía Google
  Translate, `LOCALE_CONFIG` ahora solo con `es` — la única reactivación declarada), y en
  `locale-translation-policy.mjs` las piezas genéricas (`shouldPreserveEnglishValue`,
  `NEVER_TRANSLATE_VALUES`, `applyBrandMistranslationFixes`/`BRAND_MISTRANSLATIONS`,
  `SEARCH_KEYWORD_OVERRIDES`, `repairCatalog`/`repairTranslatedValue`, parametrizadas por `locale`,
  nunca por una lista fija). Se borró todo lo que era dato de un idioma dado de baja: los
  diccionarios de reemplazo palabra por palabra de ja/ko/zh/es
  (`locale-{ja,ko,zh}-*`, `locale-key-overrides.mjs` y su merge, `locale-cross-locale-key-overrides.mjs`,
  `locale-macos-tcc-key-overrides.mjs`, `locale-phrase-fixes.mjs`, `locale-value-overrides.mjs`), el
  espaciado CJK (`locale-cjk-latin-spaced-terms.mjs`, específico de los tres idiomas dados de baja
  para siempre) y `repair-locale-catalog.mjs` (reparaba catálogos que ya no existen).
- **`verify:localization-catalog`, `-extraction` y `-coverage` no cambiaron**: los tres ya recorrían
  `src/renderer/src/i18n/locales/*.json` con `fs.readdir`, así que con un solo archivo en el
  directorio siguen verificando lo mismo sin ningún ajuste de código.
- **Las pruebas que dependían de un catálogo ja/ko/zh/es real** se resolvieron de dos formas: las
  que solo pedían ver *alguna* traducción real (no una palabra en particular) pasaron a un catálogo
  sintético registrado en el propio test vía `i18n.addResourceBundle('<código o id de plugin>', ...)`
  — el mismo mecanismo que ya usan los idiomas de plugin — en vez de importar un `.json` borrado;
  las que eran enteramente datos de un idioma dado de baja (mistranslations de ja/ko/zh, overrides
  de valor específicos) se borraron. `src/renderer/src/i18n/locale-english-regression.test.ts`
  quedó reducido a lo que puede seguir verificando con un solo catálogo: que un incidente histórico
  de reversión no vuelva a pisar `en.json`.
