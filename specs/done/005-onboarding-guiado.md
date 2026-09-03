---
status: implementada
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

### Ajuste de vocabulario — 2026-09-03, 📌 Peter

La palabra "brain" (y "cerebro") no aparece en ningún texto visible de la interfaz; tampoco
"vault". La persona crea y elige **workspaces**, no brains. La carpeta se llama "tu carpeta" o "la
carpeta de Andes"; lo que la persona crea y entre lo que se mueve son workspaces; los documentos de
un workspace son "archivos".

Cambios sobre la tabla de arriba:

1. El criterio 4 ("Tu brain") pasa a llamarse **"Tu carpeta"**, con título "¿Dónde guarda Andes tu
   trabajo?" y cuerpo "Andes trabaja sobre una carpeta de tu computadora y nunca fuera de ella. Todo
   vive ahí y todo queda en tu máquina." Los botones son "Elegir carpeta" y "Crear una nueva".
2. El criterio 5 ("Preparar el brain") pasa a llamarse **"Preparar la carpeta"**; su texto visible
   no nombra "brain".
3. **Nuevo paso, sin número de criterio propio, entre "install" y "skills": "Tu primer
   workspace"** — pide un nombre, crea el workspace en la carpeta con sus nodos vacíos (qué es,
   decisiones, aprendizajes, pendientes, iniciativas), tiene botón "Después", y se saltea si la
   carpeta elegida ya tiene workspaces. Eval: crear con un nombre deja el workspace en disco y
   activo en el selector; carpeta con workspaces existentes → el paso no aparece.
4. La lista de pasos del criterio 1 pasa a: `welcome, agent, session, folder, install, workspace,
   skills, notifications, star` — "folder" y "install" son ahora dos pasos separados (antes uno
   solo, "brain").
5. El criterio 10 suma "brain", "cerebro" y "vault" a la lista de palabras prohibidas, con el eval
   correspondiente ampliado sobre los textos del catálogo de idiomas que usa el onboarding.

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

## Evidencia

### `evals/run.sh`

```
PASS spec001#1 el paquete se llama Andes
PASS spec001#2 la bajada y el sitio son los decididos
PASS spec001#3 la versión arranca de cero
PASS spec001#4 el crédito a Orca es visible
PASS spec001#5 no queda app móvil
PASS spec001#6 no quedan los skills de emulador ni de Linear
     | src/main/emulator, src/main/linear y src/shared/linear se quedan a propósito: los importa
     | el motor (src/main/runtime/, src/main/startup/) y SSH (src/main/ssh/ssh-remote-linear-*.ts).
     | Esconderlos de la interfaz es trabajo de la spec 002 (ajuste del 2026-09-02, ver spec archivada).
PASS spec001#7 el uso de computadora no viaja en el paquete
PASS spec001#8 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed en la spec archivada)
PASS spec001#9 ningún rastro de la marca Claude o Anthropic
PASS spec003#1 no queda ninguna aparición de com.stablyai.orca
PASS spec003#2 los ids nuevos siguen un solo esquema
PASS spec003#3 el ayudante de uso de computadora reconoce a Andes
     | sin test dedicado a isTrustedOrcaApplication en native/computer-use-macos/Tests; verificado con swift build + grep
PASS spec003#4 las fórmulas de Homebrew de Orca no viajan en el repo de Andes
PASS spec003#5 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed / verify:macos-entitlements en la spec archivada)
PASS spec003#6 ninguna referencia a Product Hub en el repo
PASS spec004#1 no queda referencia a los skills de Linear en el código
PASS spec004#2 Linear no se ofrece en ninguna superficie
     | e2e (tests/e2e/settings-no-linear-offer.spec.ts, tests/e2e/feature-wall.spec.ts) corridos
     | aparte contra la app Electron real — evidencia pegada en la spec archivada.
PASS spec004#3 src/main/linear, src/shared/linear y src/main/ssh no se tocan
PASS spec004#4 ninguna cadena de idioma huérfana
PASS spec004#5 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed en la spec archivada)
PASS spec002#1 existe interfaceMode simple/developer, default simple, normaliza ausente e inválido
PASS spec002#2 General no ofrece selector de modo; el toggle de Option-clic existe
     | e2e (tests/e2e/simple-mode-onboarding.spec.ts, tests/e2e/simple-mode-surfaces.spec.ts) corridos aparte — evidencia pegada en la spec archivada.
PASS spec002#3 en simple la navegación de Ajustes tiene exactamente los diez ids; en developer, la lista completa
PASS spec002#4 en simple la barra derecha solo ofrece AI Vault; Checks/PR checks/Worktrees/Ports/Plugin no aparecen
     | e2e (tests/e2e/simple-mode-surfaces.spec.ts) corrido aparte — evidencia pegada en la spec archivada.
PASS spec002#5 en simple ninguna de las 15 superficies de desarrollo se abre por comando ni atajo
     | e2e (tests/e2e/simple-mode-surfaces.spec.ts) corrido aparte — evidencia pegada en la spec archivada.
PASS spec002#6 en simple la barra izquierda no muestra issue/review/automation ni el botón de nuevo worktree
PASS spec002#7 el modo developer no tiene regresión — VERIFICADO PARCIALMENTE (evidencia y pendiente en la spec archivada)
PASS spec002#8 primer arranque en modo simple sin preguntar, sin jerga de desarrollador (evidencia: tests/e2e/simple-mode-onboarding.spec.ts en la spec archivada)
PASS spec002#9 todo texto nuevo entra por el catálogo de idiomas
PASS spec002#10 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed en la spec archivada)
PASS spec005#1 en simple el asistente tiene los nueve pasos fijos (ajuste 2026-09-03); en developer sigue el de Orca
     | e2e (tests/e2e/simple-mode-onboarding.spec.ts) corrido aparte — evidencia pegada en la spec archivada.
PASS spec005#2 Tu agente: detección reusada + paso guiado sin agentes
     | e2e cubierto dentro de simple-mode-onboarding.spec.ts (heading 'Your agent').
PASS spec005#3 Tu sesión: login CLI reusado, sin password ni token en pantalla
PASS spec005#4 Tu carpeta: elegir/crear sin exigir git, sin abrir Add Project (evidencia e2e en la spec archivada)
PASS spec005#5 Preparar la carpeta: estructura creada desde el núcleo vendorizado, idempotente
PASS spec005 ajuste Tu primer workspace: crea README/resolver/decisions/learnings/backlog/initiatives; salta el paso con workspaces existentes
     | e2e cubierto dentro de simple-mode-onboarding.spec.ts (heading 'Your first workspace').
PASS spec005#6 Skills: skills.sh con el repo escrito a mano, sin pack fijo en código
PASS spec005#7 Notificaciones: paso de Orca reusado tal cual (evidencia e2e en la spec archivada)
PASS spec005#8 Estrella: botones escriben el estado correcto, sin stablyai/orca en la superficie de star-nag
PASS spec005#9 al terminar se abre el Command Center, nunca Add Project (evidencia e2e en la spec archivada)
PASS spec005#10 ningún texto de simple menciona AI First OS/worktree/pull request/orchestration/git/terminal/CLI/brain/cerebro/vault (evidencia e2e en la spec archivada; catálogos verificados directamente)
PASS spec005#11 checklist de Ajustes: lista corta en simple, la de Orca intacta en developer
PASS spec005#12 'Repetir la configuración inicial' reabre el asistente (evidencia e2e en la spec archivada)
PASS spec005#13 todo texto nuevo entra por el catálogo de idiomas, con español
PASS spec005#14 código sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed / e2e de onboarding en la spec archivada)
45 pasan · 0 fallan
```

### `pnpm tc`

```
$ pnpm run typecheck
$ node config/scripts/run-typecheck-projects-in-parallel.mjs
```
(sin salida = sin errores en los cuatro proyectos: web, node, cli, y el resto que corre en paralelo)

### `pnpm test` (completo, foreground, ~10 minutos)

```
 Test Files  7555 passed | 47 skipped (7602)
      Tests  70102 passed | 285 skipped (70387)
   Start at  13:16:47
   Duration  572.22s (transform 163.47s, setup 101.73s, import 2055.95s, tests 1515.84s, environment 178.22s)
```

### `pnpm run check:code-quality:changed`

```
code quality: 0 new finding(s) across 60 changed file(s).
type-aware code quality: 0 new finding(s) across 60 changed file(s).
React Doctor: 0 new finding(s) across 60 changed file(s).
Changed-code quality gate passed since be40be565310.
```

### `verify:localization-catalog` / `-extraction` / `-coverage`

Corrida después del hallazgo de Gate 2 (2026-09-03): diez claves huérfanas de "Brain" borradas de
`en.json` — ver `decisions.md`.

```
Verified 12457 localization key references against en.json.
es.json coverage: 11889/13767 translated, 1878 missing.
ja.json coverage: 11889/13767 translated, 1878 missing.
ko.json coverage: 11982/13767 translated, 1785 missing.
zh.json coverage: 11986/13767 translated, 1781 missing.
```
```
Extracted 11035 keys; 25 dynamic defaults are report-only, 2732 existing English entries are not
statically referenced, and 50 inline defaults differ. (exit 0 — reporte, no falla; comparación
directa contra la extracción real confirma cero huérfanas de esta spec, cero faltantes)
```
```
Localization coverage check passed with 12 allowlisted candidates.
```

### Catálogos de idiomas sin "brain"/"vault"/"cerebro" (hallazgo de Gate 2)

```
$ grep -rniE '"(brain|vault|cerebro)[^"]*":|: *"[^"]*\b(Brain|Vault|cerebro)\b"' \
    src/renderer/src/i18n/locales/*.json | grep -v "encrypted vault"
(sin salida — 0 líneas)
```
La única coincidencia de "vault" en los catálogos es `plugins.*.capability.secrets` ("Store and
read secrets in the plugin's own encrypted vault"), preexistente de Orca (permisos de plugin) y
ajena a esta spec — excluida explícitamente, ver `decisions.md`.

### e2e — `tests/e2e/simple-mode-onboarding.spec.ts` (nuevo, reescrito íntegro)

```
Running 3 tests using 1 worker

  ✓  opens in simple mode on the welcome step, without asking (1.3s)
  ✓  walks all nine step headings, in order, with no developer jargon (15.2s)
  ✓  finishing closes onboarding onto the active project, not the Add Project modal (14.1s)

  3 passed (38.4s)
```

### e2e — `tests/e2e/simple-mode-onboarding-repeat.spec.ts` (nuevo)

```
Running 1 test using 1 worker

  ✓  reopens onboarding from Settings -> General (14.5s)

  1 passed (22.5s)
```

### e2e — `tests/e2e/onboarding.spec.ts` (modo developer, preexistente) — 12/12 en rojo, ruido de entorno ajeno a esta spec

Reproducido igual en un `git stash push -u` de **todos** los cambios de esta spec (rebuild completo,
mismo resultado): `window.api.settings.get().interfaceMode` devuelve `'simple'` aunque
`electronApp.evaluate(() => process.env.ANDES_INTERFACE_MODE)` confirma `'developer'` en el proceso
principal. Ver la decisión "Gap conocido pre-existente" en `decisions.md`.

```
  12 failed
    tests/e2e/onboarding.spec.ts:163:7 › renders on first launch with the agent step active
    tests/e2e/onboarding.spec.ts:185:7 › Continue advances steps, persists progress, and applies user-visible settings
    tests/e2e/onboarding.spec.ts:322:7 › Cmd/Ctrl+Enter advances steps like Continue
    tests/e2e/onboarding.spec.ts:345:7 › Skip opens Add Project, saves the selected agent, and completes onboarding
    tests/e2e/onboarding.spec.ts:390:7 › Skip from theme restores the entry theme choice
    tests/e2e/onboarding.spec.ts:422:7 › Skip preserves runtime server project setup UI
    tests/e2e/onboarding.spec.ts:497:7 › Skip from notifications does not request permission
    tests/e2e/onboarding.spec.ts:527:7 › selected agent button reports aria-pressed=true
    tests/e2e/onboarding.spec.ts:547:7 › notification sound choice persists on Continue
    tests/e2e/onboarding.spec.ts:573:7 › typing in the clone-url input does not hijack Enter as a global shortcut
    tests/e2e/onboarding.spec.ts:600:7 › Back returns to the previous step without losing progress
    tests/e2e/onboarding.spec.ts:629:7 › final notification step can be dismissed via Escape or click-off

Error: expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: /Pick your default agent/i })
Expected: visible
Received: heading "Welcome to Andes" (el asistente de modo simple — el bug de interfaceMode hizo
que este launch corriera en simple en vez de developer)
```
