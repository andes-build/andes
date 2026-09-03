---
status: pendiente
depends_on: [002]
---

# 005 · Onboarding guiado

La primera vez que alguien abre Andes, la app lo lleva paso a paso hasta dejar el sistema
funcionando: encuentra o instala el agente, abre la sesión con su suscripción, elige o crea la
carpeta de su brain y la prepara, instala los skills, y al final pide la estrella en GitHub. Se
reutiliza el asistente de Orca —su detección de agentes, su inicio de sesión por CLI, su instalación
de skills con skills.sh y su pedido de estrella— con los pasos del modo simple y sin jerga técnica.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `05aed73afc` (specs 001 a 004 mergeadas). El agente corre `git log 05aed73afc..main --stat` antes de
empezar.

- Asistente actual: `src/renderer/src/components/onboarding/OnboardingFlow.tsx:105-339`; pasos en
  orden fijo en `use-onboarding-flow-types.ts:1-14`: `agent → theme → integrations →
  windows_terminal → notifications`, un componente por paso. Todo paso salvo el último se puede
  saltar (`OnboardingFlow.tsx:113`). Persistencia en `use-onboarding-flow-persistence.ts:12-21,71-130`
  (`lastCompletedStep`, `closedAt`, `outcome`); "ya se hizo" = `closedAt !== null`
  (`should-show-onboarding.ts:5-7`). Al completar, dispara el pedido de estrella
  (`use-onboarding-flow-persistence.ts:117-122`).
- El asistente termina en el botón "Add your first project" y la carpeta se elige después, en el
  modal "Add Project", fuera de `onboarding/` (`OnboardingFlow.tsx:116`; heading verificado en
  `tests/e2e/onboarding.spec.ts:28`).
- Detección de agentes: `src/main/preflight/agent-detection.ts:143-184`
  (`detectInstalledAgentsWithShellPathHydration`, rehidrata el PATH del shell de login) y el botón
  Refresh (`:209-239`). Sin agente: banner ámbar en `AgentStep.tsx:114-120`, sin comando ni enlace
  de instalación.
- Inicio de sesión de Claude Code: `src/main/claude-accounts/claude-login-session.ts:33-88` corre
  `claude auth login --claudeai` y después `claude auth status --json`; Codex, mismo patrón en
  `src/main/codex-accounts/`. Lo dispara el servicio de cuentas (`claude-accounts/service.ts`),
  no el asistente.
- Dependencias: `agent-detection.ts:289-386` (`runPreflightCheck`) chequea `git`, `gh`, `glab`
  y clientes de Bitbucket, Azure DevOps y Gitea. No chequea Node ni `npx`.
- Skills con skills.sh: `src/shared/agent-feature-install-commands.ts:19-62` construye
  `npx skills add <repo> --skill <name> [--global] [--agent <id>] -y` (comentarios de `:26-38`:
  siempre con `--agent` explícito y `-y`, si no el CLI instala en ~75 agentes o abre un selector
  que cuelga). Actualización en `:64-88`. Instalados: `src/renderer/src/hooks/useInstalledAgentSkills.ts`.
  Se ofrece en `FeatureSetupInlineTerminal.tsx` y en el checklist de Ajustes (paso
  `agent-capabilities`, `FeatureWallSetupChecklist.tsx:159-166`). Depende de `npx`, y nadie
  verifica que Node exista.
- Pedido de estrella: `src/main/star-nag/service.ts`, umbral `STAR_NAG_INITIAL_THRESHOLD = 35`
  agentes lanzados (`src/shared/constants.ts:99`), enfriamiento de 3 días, tarjeta
  `StarNagCard.tsx:23-83` con URL `https://github.com/stablyai/orca` (`:9`; también en
  `agent-feature-install-commands.ts:3`).
- Checklist de Ajustes: `FeatureWallSetupChecklist.tsx:1-382` con ítems de
  `src/shared/feature-wall-setup-steps.ts` (`default-agent`, `add-two-repos`, `notifications`,
  `agent-capabilities`, `setup-script`, `task-sources`, `browser`; hito `two-worktrees`).
- Preferencia `interfaceMode` (spec 002) con default `simple`; e2e existentes
  `tests/e2e/onboarding.spec.ts` y `tests/e2e/simple-mode-onboarding.spec.ts` (este último prohíbe
  los textos worktree, pull request y orchestration en modo simple).
- Diseño de referencia: la visual spec del brain (pasos a-h) y la maqueta (pantallas "Onboarding"
  y "Estrella").

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | En modo simple el asistente tiene exactamente estos pasos, en este orden: `welcome, agent, session, brain, skills, notifications, star`. En modo developer conserva los pasos de Orca sin cambios | Test unitario de la lista de pasos por `interfaceMode`; e2e en modo simple recorriendo los siete encabezados |
| 2 | **Tu agente**: reutiliza la detección de Orca y muestra los agentes encontrados. Si no hay ninguno, muestra un paso guiado con el comando oficial de instalación de Claude Code y de Codex tomado de la documentación del proveedor, un botón que lo copia, un enlace a esa documentación y un botón "Volver a buscar" que rehidrata el PATH y detecta de nuevo | Test de componente con detección vacía: aparecen el comando, el enlace y el botón; e2e con PATH sin agentes: "Volver a buscar" vuelve a llamar a la detección |
| 3 | **Tu sesión**: un botón "Iniciar sesión con {proveedor}" corre el inicio de sesión por CLI que Orca ya tiene (`runClaudeLoginSession` y su par de Codex); el paso muestra "esperando al navegador", después "sesión lista" con la cuenta, o el error legible si falla o vence el tiempo. Andes nunca pide ni muestra una contraseña ni un token | Test unitario del estado del paso con el servicio de cuentas simulado (tres estados); e2e con el servicio simulado: aparece "sesión lista"; `grep -rn "password\|token" src/renderer/src/components/onboarding/SessionStep*` = 0 en textos visibles |
| 4 | **Tu brain**: dos acciones, "Elegir carpeta" y "Crear uno nuevo". Ninguna exige que la carpeta sea un repositorio git. Al elegir, la carpeta queda como proyecto activo y el asistente sigue sin abrir el modal "Add Project" | e2e: elegir una carpeta temporal vacía sin `.git` y verificar que aparece como proyecto y el asistente sigue |
| 5 | **Preparar el brain**: si la carpeta elegida no tiene la estructura del sistema, el paso la crea desde la copia del núcleo que viaja en el paquete y muestra qué agregó; si ya la tiene, lo dice y sigue | Test unitario: carpeta vacía → estructura creada (lista de rutas esperadas); carpeta ya preparada → sin cambios (`git status` limpio si es repo) |
| 6 | **Skills**: reutiliza skills.sh: construye `npx skills add <repo del pack que la persona escribe> --agent <agentes detectados> -y` con el constructor existente y lo corre en la terminal embebida como hoy. Antes verifica que `npx` exista; si no, muestra cómo instalar Node con el enlace oficial y ofrece "Después". El paso es opcional | Test unitario del comando construido para uno y dos agentes; test unitario del estado "sin npx"; `grep -c "stablyai/orca" src/shared/agent-feature-install-commands.ts` = 0 |
| 7 | **Notificaciones**: reutiliza el paso de Orca tal cual | e2e: el paso existe y su heading es el actual |
| 8 | **Estrella**: último paso, dentro del asistente, con el texto del diseño y dos botones: "Dar una estrella" abre `https://github.com/andes-build/andes` en el navegador y "Ahora no" sigue. Marca el pedido como hecho o postergado en el mismo servicio que Orca usa, para que la tarjeta flotante no lo repita a los 35 agentes si ya se dio | Test unitario: cada botón escribe el estado correcto en el servicio de estrella; `grep -rn "stablyai/orca" src --include='*.ts' --include='*.tsx'` = 0 |
| 9 | Al terminar, el asistente abre el Command Center del brain elegido, no el modal "Add Project" | e2e: tras el último paso, la vista activa es el Command Center |
| 10 | Ningún texto del asistente ni del checklist menciona "AI First OS", "worktree", "pull request", "orchestration", "git", "terminal" ni "CLI" en modo simple | e2e con la lista prohibida ampliada, recorriendo los siete pasos y el checklist |
| 11 | El checklist de Ajustes en modo simple lista solo: agente, sesión, brain, skills, notificaciones, estrella, con su estado; en developer conserva el de Orca | Test unitario de la lista de ítems por `interfaceMode` |
| 12 | Se puede volver a abrir el asistente desde Ajustes → General ("Repetir la configuración inicial") | e2e: el botón pone `closedAt` en null y el asistente aparece |
| 13 | Textos por el catálogo de idiomas, con español | `verify:localization-catalog`, `-extraction`, `-coverage` en verde |
| 14 | Código sano | `pnpm tc` · `pnpm test` · `check:code-quality:changed` en verde; e2e de onboarding (`onboarding.spec.ts`, `simple-mode-onboarding.spec.ts` y los nuevos) en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (2026-09-02): el onboarding conserva los pasos de instalación de Orca que
  dejan el sistema operativo al 100 %, guiado para personas no técnicas, y el pedido de estrella.
- DECIDIDO por Peter (2026-09-03): la instalación de skills reutiliza skills.sh tal como Orca lo
  hace; era parte de su onboarding.
- DECIDIDO por Peter (2026-09-02): sin menciones a AI First OS en la interfaz.
- DECIDIDO por Peter (2026-09-02): la estrella apunta al repo de Andes, `andes-build/andes`.
- DECIDIDO por Peter (Gate 1, 2026-09-03): **Andes trae una copia del núcleo del sistema adentro
  del paquete** y la instala al preparar el brain (criterio 5). El onboarding no depende de la red
  ni de git. El núcleo entra al repo como dependencia versionada (carpeta `vendor/` o paquete) y
  actualizarlo es una spec aparte.
- DECIDIDO por Peter (Gate 1, 2026-09-03): en el paso de skills **no hay ningún pack grabado en el
  código**: un campo con el repo del pack, con un valor sugerido configurable y vacío por defecto.

**Delegadas al agente, con criterio**

- Cómo se dispara el inicio de sesión desde el asistente. Criterio: a través del servicio de
  cuentas existente, sin duplicar la lógica de `claude-login-session.ts`.
- Qué agentes recibe `--agent` en el comando de skills. Criterio: exactamente los detectados en el
  paso 2, nunca la lista completa.
- Cómo se detecta `npx`. Criterio: el mismo mecanismo de PATH rehidratado que la detección de
  agentes, sin un ejecutable nuevo.
- Copy de cada paso. Criterio: el de la visual spec del brain, en inglés en el catálogo, con su
  traducción al español; una sola cosa que hacer por pantalla.

**Condiciones de parada**

- Si el inicio de sesión por CLI exige tocar `claude-login-session.ts` o la capa que lanza el
  binario, para y pregunta (conformidad heredada).
- Si el paso 5 no puede crear la estructura sin ejecutar un script del núcleo que requiera
  `python3` o `git` y la máquina no los tiene, para y pregunta en vez de instalar dependencias.
- Si la lista prohibida del criterio 10 choca con un texto que el modo simple necesita, para y
  pregunta.

## Efectos que escapan del sistema

Abrir el navegador en GitHub (paso estrella) y en la documentación del proveedor (paso agente): solo
por clic de la persona, nunca solos. Nada se publica ni se envía.

## Fuera de alcance, con condición de reactivación

- Instalar el agente desde Andes (correr el instalador del proveedor): se reactiva cuando exista un
  instalador oficial sin terminal; hoy se muestra el comando y el enlace.
- Onboarding para varios proveedores a la vez: la primera versión guía uno; se reactiva con
  `tsk-176`.
- El recorrido guiado de la interfaz después del onboarding (tours): spec propia cuando exista la
  pantalla del hilo sobre el SDK.
- La actualización del núcleo del sistema una vez instalado: spec propia, condicionada a la
  decisión (a)/(b).
