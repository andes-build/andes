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
  `normalizeLoadedGlobalSettings`, gana siempre sobre el valor persistido y **nunca se escribe en
  disco** — `StoreRuntimeState.persistedInterfaceMode` guarda el valor que va al archivo, ver
  `specs/done/017-el-modo-sobrevive-al-reinicio.md`), o Option-clic en el
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
  `env` de `electron.launch` —`createRestartSession` lo apaga con
  `{ interfaceModeEnvDoor: 'off' }` cuando la prueba mide la preferencia guardada—, y un spec que
  necesite modo simple lo pisa con
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
  (`\bOrca\b` sobre valores, tras aplicar las excepciones). En `en.json`, la spec 007 volvió a
  nombrar el comando ahora que el binario real se llama `andes` en macOS: "the command line tool" /
  "the command line" pasó a "the Andes CLI", y los comandos literales entre comillas invertidas que
  decían `` `orca worktree create` `` ahora dicen `` `andes worktree create` `` — ver la sección
  "El comando se llama andes" más abajo. Los otros cuatro catálogos (`es/ja/ko/zh.json`) quedaron sin
  tocar, territorio de la spec 008 en paralelo (ver `decisions.md`). "Orca Server" y "Orca Cloud" sí se
  renombraron a Andes (son un servicio real de la app, no el binario). Las 33 claves huérfanas de
  "Orca Mobile"/"Orca Relay" (emparejamiento móvil borrado
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
  build empaquetado. La instancia de *desarrollo* también se presenta como Andes desde la spec 007
  (`BASE_APP_NAME`, `src/main/startup/dev-instance-identity.ts`) — ver esa sección más abajo.

## El comando se llama andes (spec 007)

- **macOS y modo desarrollo**: el comando instalado en el PATH pasa de `orca` a `andes` en macOS
  (`DEFAULT_MAC_COMMAND_PATH = '/usr/local/bin/andes'`, con el mismo fallback a
  `~/.local/bin/andes` en Apple Silicon que ya existía) y en modo desarrollo, en cualquier
  plataforma (`DEV_COMMAND_NAME = 'andes-dev'`, script `config/scripts/andes-dev.mjs`, todo en
  `src/main/cli/cli-install-constants.ts`). `getBundledLauncherPath('darwin', …)`
  (`bundled-cli-launcher-path.ts`) devuelve `bin/andes`; el alias local que un dev PTY expone sin
  el sufijo `-dev` (`cli-dev-launcher.ts`) pasa de `orca` a `andes`.
- **El launcher nativo de Windows y el paquete de Linux no se tocan** — ver `decisions.md`: siguen
  siendo `orca.exe`/`orca.cmd` (Windows) y `orca-ide` (Linux, ya distinto de `orca` desde antes por
  el lector de pantalla GNOME). `cli-install-location.ts`'s `commandName` getter refleja las tres
  ramas: `linux` → `orca-ide`, `win32` → `orca`, cualquier otra (macOS) → `andes`.
- **Migración de una instalación previa**: `LEGACY_MAC_COMMAND_NAME = 'orca'` (nuevo, junto al
  `LEGACY_LINUX_COMMAND_NAME` que ya existía) y `removeLegacyMacCommandIfManaged`
  (`cli-command-installation.ts`) limpian un `orca` viejo en la misma carpeta que el nuevo
  `andes`, reclamándolo solo si es un symlink administrado (`.app/Contents/Resources/bin/orca`),
  nunca un binario de terceros. `isManagedSymlinkTarget` (`cli-command-inspection.ts`) ahora acepta
  un `expectedName` explícito para poder preguntar por un nombre distinto del launcher actual.
- **El skill del comando se llama `andes-cli`** (`skill-guides/andes-cli.md`,
  `skill-stubs/andes-cli.md`, `skills/andes-cli/`), con su guía completamente reescrita a `andes`
  — placeholder `ANDES` en vez de `ORCA`, comandos literales `andes ...`, salvo `orca-ide` (Linux) y
  la mención real al lector de pantalla GNOME Orca, que siguen intactas. Las referencias cruzadas a
  este skill desde `computer-use.md` y `orchestration.md` (otros skills, sin renombrar en esta spec)
  se actualizaron a `andes-cli` porque nombran el id real del skill, no la marca del binario que esas
  otras guías siguen enseñando.
- **`OrchestrationCliCommand`, el wire RPC `compatibilityCliCommand` y todo el relay SSH quedan sin
  renombrar** — viajan a un proceso ya lanzado (un participante remoto, o el shim que el relay
  despliega en un host SSH), ver `decisions.md`. `getTuiAgentLaunchCommand`
  (`src/shared/tui-agent-config.ts`) reflejó esto agregando `launchCmdByPlatform.darwin: 'andes
  claude-teams'` como única rama renombrada; el `launchCmd`/`detectCmd` de nivel superior siguen en
  `orca` porque ese es el valor que un host SSH-remoto usa (`isRemote && platform === 'linux'`
  bypasea el override de plataforma a propósito).
- **La instancia de desarrollo se presenta como "Andes Dev" ante macOS** (notificaciones, Dock,
  menú): `BASE_APP_NAME` (`src/main/startup/dev-instance-identity.ts`) y
  `DEV_BUNDLE_DISPLAY_NAME` (`config/scripts/dev-electron-bundle-identity.mjs`) pasan de
  `'Orca'`/`'Orca Dev'` a `'Andes'`/`'Andes Dev'`. El ítem del llavero de macOS pasa de "Orca Dev
  Safe Storage" a "Andes Dev Safe Storage" — quien tenga un perfil de desarrollo vivo pierde acceso
  a sus secretos cifrados y tiene que volver a iniciar sesión una vez (decidido en Gate 1, ver
  `decisions.md`). La carpeta de datos (`userData`, `<appData>/orca-dev`) no se mueve.
- **Lo que no se tocó, a propósito**: `orca.yaml` (formato de configuración de proyecto);
  `src/main/runtime/orca-runtime-tests/` (nombre de carpeta de tests); los valores `'orca'` guardados
  en disco por sesiones ya existentes — ámbito de uso en `claude-usage-types.ts`,
  `codex-usage-types.ts`, `opencode-usage-types.ts`, y proveedor en `agent-session-journal-types.ts`;
  y las descripciones/ejemplos de "Orca" como marca fuera de `andes-cli` (por ejemplo, el resto de
  `src/cli/specs/*.ts` sigue mencionando "Orca" en su prosa descriptiva — solo los comandos
  literales `usage`/`examples` se corrigieron a `andes`, no la prosa).
- **Cierre del criterio 5 (retomado el 2026-09-04, tras integrar `main` hasta `d97c8cc07c`)**: los
  dos commits de avance ya dejaban `en.json` sin "Orca CLI" literal ni comando entre backticks
  (eval en verde), pero quedaban comandos literales sin backticks apuntando al binario viejo:
  `RuntimeHostAccessForm.tsx` ("orca serve --pairing-address"), `runtime-rpc-startup-failure.ts`
  ("orca status, orca terminal"), `NativeChatOrchestrationPausedNotice.tsx` ("orca orchestration
  check", que además no calzaba con el uso real ya renombrado en `src/cli/specs/orchestration.ts`),
  `MobileEmulatorAgentSetupGuideSteps.tsx` (dos textos y el fallback "Orca CLI skill", nunca
  renderizado porque la clave ya tenía una traducción — se corrigió igual) y las palabras clave de
  búsqueda de Ajustes (`shortcuts-search.ts`, `mobile-emulator-search.ts`; `browser-use-search.ts`
  quedó con `'orca'` como alias de búsqueda, a propósito, para quien todavía escriba el nombre
  viejo). Se corrigieron el `.tsx`/`.ts` fuente y, donde `en.json` tenía una traducción propia para
  esa clave (no el fallback en código), también el catálogo — `translate(key, fallback)` devuelve
  el catálogo si existe, así que tocar solo el fallback no alcanza. `verify:localization-extraction`
  bajó de 77 a 71 "inline defaults differ" con este cierre (ninguno de los 71 restantes menciona
  Orca).

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

## Selector de workspace y archivos por alcance (spec 010)

En modo simple, la barra lateral (`src/renderer/src/components/sidebar/index.tsx`) reemplaza por
completo su contenido (nav de proyectos, `WorktreeList`, toolbar) por
`SimpleModeSidebar` (`src/renderer/src/components/sidebar/workspace-scope/`) cuando
`useInterfaceMode() === 'simple'`; en modo developer sigue exactamente como estaba. Nada de esto
toca `src/main/runtime/` ni la capa que lanza el binario del agente.

- **Descubrimiento de workspaces** (`src/main/workspaces/workspace-scope-discovery.ts`, IPC
  `workspaceScope:list`): lee las subcarpetas de `workspaces/` de la carpeta activa (la carpeta
  abierta es el brain del sistema, palabra que nunca aparece en la interfaz), nombrando cada una
  por la primera línea `#` de su `README.md` o `context.md` (el brain puede tener cualquiera de las
  dos formas de cabeza), con fallback al slug humanizado. Devuelve `[]` sin `workspaces/`.
- **Árbol de archivos por alcance** (`src/main/workspaces/workspace-file-tree.ts`, IPC
  `workspaceScope:fileTree`): árbol anidado de una carpeta (el workspace elegido, o la raíz para
  "My work"), excluyendo `.git`, `node_modules`, `.os`, `.claude` y ocultos — mismo patrón de
  `readdir` que `listMarkdownDocuments` (`src/main/ipc/markdown-documents.ts`), nunca la carpeta
  entera.
- **Lectura de archivo** (`src/main/workspaces/workspace-file-read.ts`, IPC
  `workspaceScope:readFile`): de solo lectura, rechaza cualquier ruta fuera del alcance pedido.
- **Estado de alcance** (`src/renderer/src/store/slices/workspace-scope.ts`): `WorkspaceScopeSlice`
  con `activeWorkspaceScopeSlug` (`null` = raíz, "My work") y `workspaceScopeOptions`;
  `resolveActiveWorkspaceScope` cae a raíz si el slug elegido ya no existe. Todo lo que necesite
  saber el alcance activo (hoy: Files; a futuro: Command Center, Recent threads) lee este único
  campo.
- **Barra lateral simple** (`sidebar/workspace-scope/`): `WorkspaceScopeSelector` (el selector
  arriba, con "My work" y "New workspace" fijos — crear un workspace de verdad queda fuera de
  alcance, ver la spec archivada), `SimpleModeNav` (exactamente New thread, Command Center, Files,
  Agents & skills, More), `RecentThreadsSection` (componente real, sin fuente de datos por
  workspace todavía) y `SimpleModeScopeEmptyState` (los tres estados incómodos).
- **Files** (`src/renderer/src/components/files/FilesPage.tsx`, `activeView: 'files'`, nuevo
  miembro de `TopLevelView`): árbol del alcance elegido con nombres de nodo traducidos
  (`workspace-node-name.ts`: README.md/context.md → "What this is", decisions.md → "Decisions",
  learnings.md → "Learnings", backlog.md → "Backlog", initiatives → "Initiatives", research →
  "Research"; un nombre no reconocido se muestra tal cual) y un visor de markdown con formato
  (reusa `MarkdownPreviewBody` del editor) con el botón "Open a thread about this file".
- **New thread**: `open-new-thread.ts` espera la detección de agentes (`ensureDetectedAgents`),
  elige el agente y los argumentos con `@/lib/simple-mode-thread-launch` y lanza con
  `launchAgentInNewTab` sobre la carpeta activa — nunca toca `native-chat/`. Es
  `launchAgentInNewTab` el que crea la pestaña **y** encola el comando de arranque: `createTab` con
  `launchAgent` solo etiqueta, y una pestaña etiquetada sin comando encolado levanta un shell de
  login (spec 015). El modo chat lo decide `decideInitialAgentTabViewMode`, que en modo simple
  devuelve `'chat'` para todo agente soportado. Sin carpeta abierta o sin agente con conversación no
  se abre pestaña: se avisa en pantalla, el primer caso con la acción que abre el selector de
  carpetas (`addRepo`) y el segundo con la que abre "Agents & skills" (spec 016).

### Qué puede lanzar un hilo, y con qué argumentos (spec 016)

`src/renderer/src/lib/simple-mode-thread-launch.ts` tiene las dos reglas del modo simple, y es el
único lugar donde se enuncian:

- **Agente**: `resolveSimpleModeThreadAgent` filtra los detectados por `isNativeChatSupportedAgent`
  más `nativeChatRequiresLocalTranscript` —los mismos predicados de
  `decideInitialAgentTabViewMode`— y recién sobre ese conjunto aplica el agente por omisión del
  operador y el orden de auto-elección. El agente por omisión de la máquina no alcanza para lanzar:
  con `defaultTuiAgent: 'antigravity'` el hilo lanza Claude Code, y sin ningún agente con
  conversación no lanza nada.
- **Argumentos**: `resolveSimpleModeThreadAgentArgs` saca todo valor de `PERMISSION_BYPASS_ARGS`
  (`src/shared/tui-agent-permissions.ts`, derivado de `YOLO_TUI_AGENT_ARGS`) y agrega el argumento
  de "preguntar siempre" del agente si está declarado en `ASK_PERMISSION_TUI_AGENT_ARGS`
  (`claude`/`openclaude`: `--permission-mode manual`). Los valores por omisión del lanzamiento
  (`DEFAULT_TUI_AGENT_ARGS = YOLO_TUI_AGENT_ARGS`) **no** se tocan: en modo desarrollo Orca lanza
  como siempre.

Las mismas dos reglas las aplica `buildOnboardingFolderAgentStartup` cuando el arranque de carpeta
del onboarding corre en modo simple. Y `ensureWorktreeHasInitialTerminal` no siembra su terminal
automática en modo simple: activar una carpeta ahí no abre ninguna pestaña, solo el trabajo de
arranque explícito crea su superficie.
- **Command Center**: no tiene pantalla propia en esta spec. El botón del nav navega a
  `activeView: 'terminal'` — la spec 009 (pausada) resuelve su contenido enganchando su propio gate
  sobre esa misma vista, no sobre una vista separada.

Bug encontrado durante el cierre, ajeno a esta spec: `interfaceMode: 'simple'` persistido no
sobrevive un reinicio de Electron (se relanza como `'developer'` literal, sin ninguna carpeta ni
workspace involucrado) — ver "Diferido a la spec de restos" en `specs/done/010-workspaces-y-archivos.md`
y `decisions.md`.
## El hilo — el ajuste experimental deja de mandar en modo simple (spec 011, etapa 1)

En modo simple, la conversación nativa (Native Chat) es la superficie por omisión al lanzar un
agente soportado (`claude`, `openclaude`, `codex`, `grok`, `omp`) — sin prender
`experimentalNativeChat` ni `openAgentTabsInChatByDefault`. En modo developer, los dos ajustes
siguen mandando exactamente igual que antes; nada de esto se tocó para esa rama.

Dos gates distintos decidían esto y a los dos había que enseñarles `interfaceMode`:

- **Qué pestaña nace siendo chat**: `decideInitialAgentTabViewMode`
  (`src/renderer/src/lib/native-chat-initial-view-mode.ts`) ahora abre en `'chat'` cuando
  `interfaceMode === 'simple'`, sin exigir los dos ajustes. Los ocho puntos de llamada que
  construyen sus argumentos (`worktree-default-terminal-tabs.ts`,
  `worktree-initial-terminal-seeding.ts`, `launch-agent-in-new-tab.ts`,
  `terminal-{request,presentation}-ipc-bridge.ts`, `worktree-draft-startup-view-mode.ts`,
  `worktree-creation-agent-seeds.ts`, `native-chat-launch-session-options.ts`, y los hooks de
  `composer-state/`) pasan `interfaceMode` desde `store.settings`.
- **Si esa pestaña se renderiza como chat**: `nativeChatEnabled`
  (`src/renderer/src/components/terminal-pane/use-terminal-pane-chat-state.ts`) —el flag real detrás
  de `effectiveChatViewMode` y de `canToggleNativeChat`— es
  `experimentalNativeChat === true || interfaceMode === 'simple'`. Sin este segundo gate, una
  pestaña podía nacer con `viewMode: 'chat'` y renderizarse igual como terminal cruda.

**El hilo de Claude corre por datos, de punta a punta** (spec 012).

- **Los dos carriles**: `src/main/codex/` (Codex, sobre su app-server JSON-RPC) y `src/main/claude/`
  (Claude, sobre `stream-json` y el canal de control del propio binario). Los dos cumplen
  `StructuredAgentSessionAdapter`.
- **El argumento que abre el canal de Claude** es `--permission-prompt-tool stdio`, con el saludo
  `control_request` de subtipo `initialize`; el permiso llega como `can_use_tool` y se contesta con
  un `control_response`. Solo cambian los argumentos del binario de la persona.
- **Un solo host, dos carriles**:
  `src/main/native-chat/agent-session-wire/structured-agent-session-adapter-router.ts` enruta por el
  carril que adquirió cada sesión.
- **La tarjeta de permiso ya no escribe teclas**:
  `NativeChatApprovalCard.tsx` contesta con el id de la opción. El camino viejo
  (`NativeChatInteractiveCard.tsx`, modo desarrollo) mapea ese id a su tecla en su propio llamador,
  así que la terminal cruda no cambió.
- **El primer mensaje viaja en la creación**: `agentSession.create` acepta `firstMessage` y el host
  lo convierte en el primer turno. El modo simple manda siempre uno —el del alcance, spec 019— y así
  la creación es el único emisor sobre una sesión en la que nadie escribió todavía. En la interfaz
  solo lo toma un mensaje que quien llama declara como el de nacimiento del hilo
  (`promptIsThreadFirstMessage`): el de un comando rápido sigue yendo a la terminal.
- **Andes nombra la sesión**: `--session-id <uuid>`, porque el binario anuncia el suyo en
  `system/init` recién con el primer turno. La prueba de adquisición es la respuesta a `initialize`,
  y un id distinto termina la sesión en vez de renombrarla.
- **Qué pestañas ve un cliente**: las de un proveedor con carril en el host
  (`STRUCTURED_AGENT_SESSION_LANE_PROVIDERS`, `src/shared/agent-session-record.ts`). Escrito como un
  solo proveedor, un hilo de Claude vivo no llegaba nunca a la pantalla.
- **Qué cuenta como hilo abierto**: una pestaña de terminal con agente *o* una sesión estructurada
  (`use-command-center-gate.ts`). Sin la segunda, el Command Center se quedaba con la pantalla sobre
  una conversación abierta.
- **La evidencia en la app real**: `docs/research/2026-09-04-chequeo-funcional-spec-012/`, con el
  permiso permitido en un hilo y rechazado en otro.
- **Lo que el carril de Claude declara en vez de simular**: subagentes, preguntas, opciones de
  sesión y diffs — cabecera de `src/main/claude/claude-structured-session-adapter.ts`.

Diferido de esta spec, sin implementar: la tarjeta de subagente, los estados incómodos (sin
sesión, caída a mitad, respuesta vacía), la revisión de jerga, que el hilo nazca con el alcance del
Command Center (spec 009, todavía sin mergear), y la paridad de modo developer contra la suite
completa. Detalle en "Diferido a la spec de restos" de `specs/done/011-el-hilo.md`.
## Marca visual: ícono, logo y bandeja (spec 014)

La spec 006 cubrió textos, enlaces y actualizador; dejó explícitamente afuera "el ícono y el
logotipo" a la espera del archivo de diseño de Peter (ver "Fuera de alcance" de
`specs/done/006-restos-de-la-marca-orca.md`). Esta spec cierra ese hueco: ningún ícono, imagen o
selector de la interfaz muestra la ballena.

- **`resources/logo.svg`** (usado por `Landing.tsx`, `SidebarSettingsHelpMenu.tsx`,
  `OnboardingFlow.tsx`, `WelcomeStep.tsx`, `SimpleOnboardingFlow.tsx`, `TitlebarLeftControls.tsx` y
  `andes-logo-settings-icon.tsx`) y `resources/icon-source/icon.icon/Assets/logo.svg` (fuente del
  pipeline de Icon Composer, no usada en runtime) pasan a envolver el isologo real de Andes como
  raster embebido en el `.svg` — no hay vector propio todavía, spec futura si se necesita uno. Se
  reemplazó solo el contenido de estos dos archivos, sin tocar ningún componente que los importa,
  para no chocar con las specs 010/011 en curso sobre `Landing.tsx`/sidebar/native-chat.
- **Ícono de la app, del Dock y del instalador**: `resources/build/icon.icns`, `icon.ico`,
  `icon.png` (1024, fallback) y `resources/icon.png`/`icon-dev.png` (256, éste último con la
  insignia naranja "D" que ya distinguía al build de desarrollo) se regeneraron desde el archivo de
  200×200 que entregó Peter, escalado a 1024 con `sips` (el original queda corto para el
  instalador; ver `decisions.md`). `resources/build/icon.icns` se arma directo con `iconutil` desde
  un iconset generado con `sips` en vez de pasar por `xcrun actool`/Icon Composer
  (`resources/icon-source/generate.sh`), que exige un proyecto `.icon` completo; ese script queda
  sin correr hasta que exista un logo vectorial real para su fuente.
  `config/scripts/trim-windows-icon-source.mjs` (ya existía) generó `icon.ico` desde el `icon.png`
  nuevo sin cambios de código.
- **Selector de ícono de Ajustes**: `src/shared/app-icon.ts` (`APP_ICON_OPTIONS`) pasa de tres
  opciones (classic/watercolor/blue, las tres con la ballena) a una sola (`classic` = Andes).
  `resources/app-icons/orca-blue.png` y `orca-watercolor.png` se borraron.
  `AppIconSelector.tsx` ya no tiene flechas de ciclado (no hay entre qué elegir), solo muestra el
  ícono. `src/main/app-icon.ts` se simplificó: la persistencia del ícono del Dock ya no tiene una
  rama de "ícono personalizado" (código muerto con una sola opción posible) — solo limpia la
  metadata de Finder que pudo haber quedado de un build viejo con un ícono alternativo pineado.
- **Bandeja del sistema**: `resources/tray/orca-menu-barTemplate*.png` se renombran a
  `andes-menu-barTemplate*.png`, regenerados como plantilla monocromo (alpha = luminancia del
  isologo) en 22×14/44×28. `src/main/tray/system-tray.ts` actualizado a los nombres nuevos.
- **Hallazgos de texto encontrados al verificar visualmente** (fuera del inventario de imágenes,
  pero directamente visibles): el heading de la pantalla vacía (`Landing.tsx`) decía "ORCA" en
  mayúsculas — la spec 006 reemplazó "Orca" con una regla sensible a mayúsculas y esta variante no
  calzaba; se corrigió solo el catálogo (`en.json`, clave `auto.components.Landing.6ca6ff404e`) sin
  tocar `Landing.tsx`. El título nativo de la ventana (`createMainWindow.ts`, distinto del título
  propio de la interfaz) y el título de la notificación de "minimizar a bandeja" en Windows
  (`main-window-close-lifecycle.ts`) decían literalmente `'Orca'`; los dos pasan a `'Andes'`.
- **Fuera de alcance, sin tocar**: `BASE_APP_NAME`/`DEV_BUNDLE_DISPLAY_NAME` y el nombre visible de
  la instancia de desarrollo (texto, no imagen — spec 007, ver `decisions.md`); el marketplace de
  plugins (`stablyai`, decidido en Gate 1 de la spec 006); `orca.yaml` como nombre de archivo de
  configuración; el binario `orca` (spec 007); los `orca-plugin.json` de ejemplo y los tests que
  fijan `resources/darwin/bin/orca` / `linux/bin/orca-ide` / `win32/bin/orca.cmd` (nombres del
  binario, no marca visual).

## El hilo hereda el alcance del selector (spec 019)

Cierra el criterio 6 diferido de la spec 011: el contrato de sesión del núcleo
(`vendor/ai-first-os-core/core/CLAUDE.md`, "When the session starts") exige que el primer mensaje de
una sesión nombre su alcance —un workspace o la raíz— o el agente pregunta cuál usar. El hilo hoy ya
sabe ese alcance (lo eligió el selector de la spec 010); esta spec se lo dice al agente.

- **Captura, no lectura reactiva**: `openNewThread` (`sidebar/workspace-scope/open-new-thread.ts`)
  resuelve `resolveActiveWorkspaceScope(activeWorkspaceScopeSlug, workspaceScopeOptions)` una sola
  vez, en el momento del lanzamiento — nunca se vuelve a leer para ese hilo. El valor viaja como
  `threadScope` hasta `launchAgentInNewTab` (`src/renderer/src/lib/launch-agent-in-new-tab.ts`,
  parámetro nuevo), que lo estampa en las opciones de `store.createTab` solo si vino. `createTab`
  (`store/terminals/terminal-actions.ts` + `terminal-tab-creation.ts`) lo copia al `TerminalTab`
  (`shared/terminal-tab-types.ts`, campo `threadScope?: ThreadScope`, tipo compartido en
  `shared/workspace-scope-types.ts`). Cambiar el selector después no reconcilia nada: es la ausencia
  de ese mecanismo la que cumple la decisión de `decisions.md` (2026-09-04) — un hilo viejo conserva
  su alcance, el próximo hereda el nuevo.
- **El mensaje** (`src/renderer/src/lib/thread-scope-startup-message.ts`,
  `buildThreadScopeStartupMessage`): texto en inglés con el vocabulario exacto del contrato
  (`--root` / `--workspace <slug>`) y la instrucción explícita de no preguntar. Va como `prompt` de
  `launchAgentInNewTab` con `promptDelivery: 'auto-submit'` — el mismo mecanismo de argv que ya usan
  `resolveSimpleModeThreadAgentArgs` y el resto del lanzamiento (Claude tiene `promptInjectionMode:
  'argv'`, spec 016), así que llega al agente antes de que la persona escriba nada.
- **En pantalla** (spec 013 renombró este componente a `ThreadHeader.tsx`, mismo mecanismo — ver su
  propia sección más abajo): lee `tab.threadScope` —nunca el selector en vivo— y muestra "My work"
  o el nombre del workspace.

Diferido, sin implementar: que un hilo ya abierto pueda cambiar de alcance en caliente (ver
`decisions.md`); el canal de datos del permiso (criterio 2b de la spec 011, sin tocar).

## El hilo se ve como un hilo — barra lateral, título y lenguaje de persona (spec 013)

Tres cambios de superficie en modo simple, ninguno toca modo desarrollo (spec 002 lo exige, cada
punto abajo dice cómo se lo respetó).

- **La barra de pestañas real no es `TerminalTitlebarTabs`** (ese portal ya vuelve `null` en
  cuanto existe cualquier layout — `effectiveActiveLayout`, spec 021 — así que en la práctica nunca
  pintaba). El renglón que la persona ve es el que arma cada `TabGroupPanel`
  (`src/renderer/src/components/tab-group/TabGroupPanel.tsx`), un strip de 32px por grupo que
  existía sin condición de modo. Spec 013 gatea su contenido (la lista de pestañas, el botón de
  comandos rápidos y el menú de panel) con `useInterfaceMode() === 'simple'`; el strip de 32px en sí
  queda —es el único área `-webkit-app-region: drag` bajo la barra de título oculta de macOS.
  `TerminalTitlebarTabs.tsx` también gatea por las dudas (no cambia nada visible, pero deja el
  camino honesto). **Encontrado por chequeo funcional en la app real, no por la suite**: la app
  compila igual y los tests unitarios con un store mockeado pasaban antes de este arreglo porque el
  mock nunca ejecuta el layout de grupos real — el gap solo se ve con `pnpm dev` de verdad.
- **Los hilos en la barra lateral** (`src/renderer/src/components/sidebar/workspace-scope/`):
  `RecentThreadsSection` (spec 010) pasó de recibir `threads={[]}` a `useSimpleModeThreadRows()`, que
  filtra las pestañas del worktree activo por alcance (`simple-mode-thread-scope-filter.ts` — una
  pestaña sin `threadScope` cuenta como raíz) y las ordena reusando
  `orderRecentWorkspaceTabs`/`RecentWorkspaceTabRow` de `src/renderer/src/lib/recent-workspace-tab-rows.ts`
  (la misma proyección de Cmd+J — decisión delegada de la spec: reusar en vez de escribir una
  segunda), en `simple-mode-thread-rows.ts`. Clic en una fila (`select-thread.ts`) llama
  `setActiveTab`/`setActiveTabType('terminal')`, el mismo camino que la barra de pestañas de modo
  desarrollo.
- **El título y el alcance del hilo** (`src/renderer/src/components/native-chat/ThreadHeader.tsx`,
  reemplaza `ThreadScopeBadge.tsx` de la spec 019 — misma lectura de `tab.threadScope`, nunca el
  selector en vivo): dos líneas arriba de la conversación, el título y debajo "My work" o
  "Workspace · Focus: {{nombre}}" (catálogo `components.native-chat.threadScope.workspace`).
  El título se resuelve con `src/shared/thread-header-title.ts`
  (`resolveThreadHeaderTitle`): el renombrado a mano de Andes (`tab.customTitle`) gana sobre
  `tab.aiVaultTitle.explicitTitle`, que gana sobre el *fallback* "New thread" — nunca lee
  `tab.aiVaultTitle.title` (que sí cae al primer prompt o a un nombre inventado con el id de
  sesión) ni `tab.generatedTitle`.
  - **Quién llenaba `aiVaultTitle` hasta hoy** (el ❓ de la spec): `startAiVaultTabTitleSync`
    (`src/renderer/src/lib/ai-vault-tab-title-sync.ts`) ya lo hacía, leyendo
    `session-title-file-reader.ts` → `parseAgentSessionFileCached` → el escáner de sesiones
    (`session-scanner-primary-parsers.ts`, Claude). Pero `AiVaultSession.title` ya traía su propio
    *fallback chain* (custom-title → ai-title → primer prompt de usuario → `"Claude <id>"` inventado)
    — nunca aislaba el título que el CLI mismo escribió. Spec 013 agrega
    `AiVaultSession.explicitTitle` / `AiVaultSessionTitle.explicitTitle` (`string | null`,
    campo nuevo en `src/shared/ai-vault-types.ts` y `src/shared/ai-vault-session-title.ts`): en el
    parser de Claude, `accumulator.explicitTitle = accumulator.title || generatedTitle || null`
    (custom-title gana, ai-title si no hay, `null` si el CLI no escribió ninguno de los dos) —
    calculado en `finalizeClaudeSessionParseState`, nunca desde el primer prompt. Otros agentes
    (codex incluido) quedan con `explicitTitle: null` hasta que alguien verifique su propio formato
    de título — degradan a "New thread", el comportamiento correcto por el criterio 6, no un hueco.
    El caché persistido de sesiones (`session-parse-cache-persistence.ts`) subió a
    `SCHEMA_VERSION = 3` porque el campo es nuevo semánticamente, no solo de forma.
- **La línea de actividad en lenguaje de persona** (criterio 7,
  `src/renderer/src/components/native-chat/native-chat-activity-phrase.ts`,
  `describeToolActivity`): en modo simple, `NativeChatToolRun` reemplaza su renglón crudo
  (`2× Bash …`, con nombre de herramienta y expansión a diffs/JSON) por una sola línea fija,
  sin interacción, gateada por `usePlainLanguageActivity()`
  (`use-plain-language-activity.ts`, wrapper de `useInterfaceMode()`). El redactor clasifica por
  familia de herramienta (leer/escribir/buscar/comando/delegar) y, para lectura/escritura, arma un
  sustantivo humanizado del *basename* del archivo —nunca la ruta, nunca el comando ni el patrón de
  búsqueda, que podrían traer una ruta adentro— con `humanizeFileSubject`. Una herramienta no
  reconocida cae a "Working…"; sobre-filtrar es la decisión (`decisions.md`).
- **El panel de archivos de la derecha** (criterio 8): `use-app-chrome-layout.ts`,
  `showRightSidebarControls` ahora también exige `interfaceMode !== 'simple'` — apaga a la vez el
  botón que lo abre y el montaje de `<RightSidebar />`
  (`src/renderer/src/components/right-sidebar/index.tsx`, que ganó `data-testid="right-sidebar"`
  para el chequeo). Los archivos siguen viéndose en Files (spec 010), donde ya vivían.

Diferido, sin implementar: historial de hilos cerrados ("View history"), archivos de un hilo, la
tarjeta de subagente (spec 012 la desbloquea).
