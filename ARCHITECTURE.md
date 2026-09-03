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
- **Emulador y Linear**: `src/main/emulator/`, `src/main/linear/` y `src/shared/linear/`
  se quedan tal cual — sacarlos rompe el motor (`src/main/runtime/`, `src/main/startup/`) y SSH
  (`src/main/ssh/ssh-remote-linear-*.ts`). Lo que sí se borró son sus skills dedicadas
  (`skills/orca-emulator`, `skills/orca-emulator-android`, `skills/orca-linear`,
  `skills/linear-tickets`, con sus fuentes en `skill-guides/` y `skill-stubs/`), regenerando
  `src/cli/bundled-skill-guides.ts` y `resources/skills/current-manifest.json`. Esconder estos
  módulos de la interfaz queda para la spec 002 (ajuste al criterio 6 del 2026-09-02, ver
  `specs/done/001-andes-nace-de-orca.md`).

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

## Documentación histórica ajustada

- `config/reliability-gates.jsonc`: los gates cuyo test surface era 100% de la app móvil borrada
  (`mobile-ui.drawer-close-continuity`, `mobile-relay.endpoint-recovery`,
  `mobile-transport.lifecycle-liveness`) se eliminaron del manifiesto. Los gates mixtos
  (`terminal-query.mobile-view-authority`, `terminal-runtime.mobile-stream-budget`) conservan sus
  archivos de `src/` (motor/renderer) y perdieron solo las referencias a `mobile/`.
