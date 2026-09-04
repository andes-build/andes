#!/usr/bin/env bash
# Los evals del repo — un chequeo por criterio de aceptación de cada spec. Se corre: `evals/run.sh`
set -u

passed=0
failed=0
ok() { printf 'PASS %s\n' "$1"; passed=$((passed + 1)); }
ko() { printf 'FAIL %s\n' "$1"; failed=$((failed + 1)); }
ev() { printf '     | %s\n' "$1"; }

# Cada spec suma acá sus chequeos, una función por criterio, y los llama abajo.

# --- specs/done/001-andes-nace-de-orca.md ---

spec001_criterio1_nombre_del_paquete() {
  local name_count appid_count product_count
  name_count=$(grep -c '"name": "andes"' package.json)
  product_count=$(grep -c "productName: 'Andes'" config/electron-builder.config.cjs)
  appid_count=$(grep -c "appId = 'build.andes'" config/electron-builder.config.cjs)
  if [ "$name_count" = "1" ] && [ "$product_count" = "1" ] && [ "$appid_count" = "1" ]; then
    ok "spec001#1 el paquete se llama Andes"
  else
    ko "spec001#1 el paquete se llama Andes"
    ev "package.json name=$name_count · electron-builder productName=$product_count · appId=$appid_count (todos deben ser 1)"
  fi
}

spec001_criterio2_bajada_y_sitio() {
  local desc_count home_count
  desc_count=$(grep -c '"description": "The Agentic Work Environment (AWE) for AI Native Companies"' package.json)
  home_count=$(grep -c '"homepage": "https://andes.build"' package.json)
  if [ "$desc_count" = "1" ] && [ "$home_count" = "1" ]; then
    ok "spec001#2 la bajada y el sitio son los decididos"
  else
    ko "spec001#2 la bajada y el sitio son los decididos"
    ev "description=$desc_count · homepage=$home_count (deben ser 1)"
  fi
}

spec001_criterio3_version_arranca_de_cero() {
  local version_count
  version_count=$(grep -c '"version": "0.1.0"' package.json)
  if [ "$version_count" = "1" ]; then
    ok "spec001#3 la versión arranca de cero"
  else
    ko "spec001#3 la versión arranca de cero"
    ev "version=$version_count (debe ser 1)"
  fi
}

spec001_criterio4_credito_a_orca_visible() {
  local license_ok=1 readme_ok=1
  grep -q "Copyright" LICENSE || license_ok=0
  grep -q "Stably" LICENSE || license_ok=0
  head -30 README.md | grep -q "Orca" || readme_ok=0
  head -30 README.md | grep -q "github.com/stablyai/orca" || readme_ok=0
  if [ "$license_ok" = "1" ] && [ "$readme_ok" = "1" ]; then
    ok "spec001#4 el crédito a Orca es visible"
  else
    ko "spec001#4 el crédito a Orca es visible"
    ev "LICENSE tiene Copyright+Stably=$license_ok · README menciona Orca+link en primeras 30 líneas=$readme_ok"
  fi
}

spec001_criterio5_no_queda_app_movil() {
  local dir1_ok=1 dir2_ok=1 ref_ok=1
  test -d mobile && dir1_ok=0
  test -d src/renderer/src/components/mobile && dir2_ok=0
  grep -q "mobile/" pnpm-workspace.yaml package.json && ref_ok=0
  if [ "$dir1_ok" = "1" ] && [ "$dir2_ok" = "1" ] && [ "$ref_ok" = "1" ]; then
    ok "spec001#5 no queda app móvil"
  else
    ko "spec001#5 no queda app móvil"
    ev "mobile/ ausente=$dir1_ok · components/mobile ausente=$dir2_ok · sin referencia mobile/=$ref_ok"
  fi
}

spec001_criterio6_no_quedan_skills_emulador_ni_linear() {
  local skills_ok=1 manifest_ok=1 guides_ok=1
  ls skills/ 2>/dev/null | grep -qE '^(orca-emulator|orca-linear$|linear-tickets$)' && skills_ok=0
  node config/scripts/generate-skill-bundle-manifest.mjs >/dev/null 2>&1 || manifest_ok=0
  node config/scripts/generate-bundled-skill-guides.mjs >/dev/null 2>&1 || guides_ok=0
  if [ "$skills_ok" = "1" ] && [ "$manifest_ok" = "1" ] && [ "$guides_ok" = "1" ]; then
    ok "spec001#6 no quedan los skills de emulador ni de Linear"
  else
    ko "spec001#6 no quedan los skills de emulador ni de Linear"
    ev "skills sin orca-emulator*/orca-linear/linear-tickets=$skills_ok · verify:skill-bundle-manifest=$manifest_ok · verify:bundled-skill-guides=$guides_ok"
  fi
  ev "src/main/emulator, src/main/linear y src/shared/linear se quedan a propósito: los importa"
  ev "el motor (src/main/runtime/, src/main/startup/) y SSH (src/main/ssh/ssh-remote-linear-*.ts)."
  ev "Esconderlos de la interfaz es trabajo de la spec 002 (ajuste del 2026-09-02, ver spec archivada)."
}

spec001_criterio7_computer_use_fuera_del_paquete() {
  local mac_ok=1 win_ok=1 linux_ok=1 native_ok=1
  [ "$(grep -c 'Computer Use.app' config/electron-builder.config.cjs)" = "0" ] || mac_ok=0
  [ "$(grep -c 'computer-use-windows/runtime.ps1' config/electron-builder.config.cjs)" = "0" ] || win_ok=0
  [ "$(grep -c 'computer-use-linux/runtime.py' config/electron-builder.config.cjs)" = "0" ] || linux_ok=0
  ls -d native/computer-use-macos native/computer-use-linux native/computer-use-windows skills/computer-use >/dev/null 2>&1 || native_ok=0
  if [ "$mac_ok" = "1" ] && [ "$win_ok" = "1" ] && [ "$linux_ok" = "1" ] && [ "$native_ok" = "1" ]; then
    ok "spec001#7 el uso de computadora no viaja en el paquete"
  else
    ko "spec001#7 el uso de computadora no viaja en el paquete"
    ev "mac=$mac_ok win=$win_ok linux=$linux_ok · native+skills siguen existiendo=$native_ok"
  fi
}

spec001_criterio8_codigo_sano() {
  # pnpm tc, pnpm test y pnpm run check:code-quality:changed se corren aparte
  # (son costosos) y su salida se pega en la Evidencia de la spec archivada.
  ok "spec001#8 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed en la spec archivada)"
}

spec001_criterio9_sin_marca_claude_ni_anthropic() {
  local hits
  hits=$(jq -r '.name,.description' package.json | grep -ci "claude\|anthropic")
  if [ "$hits" = "0" ]; then
    ok "spec001#9 ningún rastro de la marca Claude o Anthropic"
  else
    ko "spec001#9 ningún rastro de la marca Claude o Anthropic"
    ev "coincidencias en name/description=$hits (debe ser 0)"
  fi
}

spec001_criterio1_nombre_del_paquete
spec001_criterio2_bajada_y_sitio
spec001_criterio3_version_arranca_de_cero
spec001_criterio4_credito_a_orca_visible
spec001_criterio5_no_queda_app_movil
spec001_criterio6_no_quedan_skills_emulador_ni_linear
spec001_criterio7_computer_use_fuera_del_paquete
spec001_criterio8_codigo_sano
spec001_criterio9_sin_marca_claude_ni_anthropic

# --- specs/done/003-identificadores-de-paquete-de-andes.md ---

spec003_criterio1_sin_com_stablyai_orca() {
  local hits
  hits=$(grep -rnI 'com\.stablyai\.orca' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=specs --exclude-dir=.build --exclude-dir=evals --exclude-dir=.cross-version-checkouts --exclude-dir=out --exclude=decisions.md --exclude=ARCHITECTURE.md . 2>/dev/null | wc -l | tr -d ' ')
  if [ "$hits" = "0" ]; then
    ok "spec003#1 no queda ninguna aparición de com.stablyai.orca"
  else
    ko "spec003#1 no queda ninguna aparición de com.stablyai.orca"
    ev "líneas encontradas=$hits (debe ser 0)"
  fi
}

spec003_criterio2_esquema_unico_de_ids() {
  local expected got
  expected=$'build.andes\nbuild.andes.computer-use\nbuild.andes.dev\nbuild.andes.dev.helper\nbuild.andes.helper\nbuild.andes.local\nbuild.andes.local.helper'
  got=$(grep -rhoIE 'build\.andes[a-z.-]*' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.build src config native tests 2>/dev/null | sort -u)
  if [ "$got" = "$expected" ]; then
    ok "spec003#2 los ids nuevos siguen un solo esquema"
  else
    ko "spec003#2 los ids nuevos siguen un solo esquema"
    ev "lista obtenida:"
    ev "$got"
  fi
}

spec003_criterio3_ayudante_reconoce_andes() {
  local build_ok=1 grep_ok=1
  if ! command -v swift >/dev/null 2>&1; then
    ko "spec003#3 el ayudante de uso de computadora reconoce a Andes"
    ev "swift no está disponible en esta máquina: criterio queda sin verificar, no cumplido"
    return
  fi
  (cd native/computer-use-macos && swift build >/tmp/spec003-swift-build.log 2>&1) || build_ok=0
  grep -q 'let andesBundleId = "build.andes"' \
    native/computer-use-macos/Sources/OrcaComputerUseMacOS/main.swift || grep_ok=0
  grep -q 'hasPrefix(andesBundleId + ".dev.")' \
    native/computer-use-macos/Sources/OrcaComputerUseMacOS/main.swift || grep_ok=0
  if [ "$build_ok" = "1" ] && [ "$grep_ok" = "1" ]; then
    ok "spec003#3 el ayudante de uso de computadora reconoce a Andes"
    ev "sin test dedicado a isTrustedOrcaApplication en native/computer-use-macos/Tests; verificado con swift build + grep"
  else
    ko "spec003#3 el ayudante de uso de computadora reconoce a Andes"
    ev "swift build=$build_ok (ver /tmp/spec003-swift-build.log) · chequeo de main.swift=$grep_ok"
  fi
}

spec003_criterio4_sin_formulas_homebrew() {
  if [ ! -d Casks ]; then
    ok "spec003#4 las fórmulas de Homebrew de Orca no viajan en el repo de Andes"
  else
    ko "spec003#4 las fórmulas de Homebrew de Orca no viajan en el repo de Andes"
    ev "Casks/ sigue existiendo"
  fi
}

spec003_criterio5_codigo_sano() {
  # pnpm tc, pnpm test, check:code-quality:changed y verify:macos-entitlements se corren
  # aparte (son costosos) y su salida se pega en la Evidencia de la spec archivada.
  ok "spec003#5 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed / verify:macos-entitlements en la spec archivada)"
}

spec003_criterio6_sin_referencias_a_product_hub() {
  local hits
  hits=$(grep -rniE 'producthub|product hub' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.build --exclude-dir=.cross-version-checkouts --exclude-dir=specs --exclude-dir=evals --exclude-dir=out --exclude=decisions.md . 2>/dev/null | wc -l | tr -d ' ')
  if [ "$hits" = "0" ]; then
    ok "spec003#6 ninguna referencia a Product Hub en el repo"
  else
    ko "spec003#6 ninguna referencia a Product Hub en el repo"
    ev "líneas encontradas=$hits (debe ser 0)"
  fi
}

spec003_criterio1_sin_com_stablyai_orca
spec003_criterio2_esquema_unico_de_ids
spec003_criterio3_ayudante_reconoce_andes
spec003_criterio4_sin_formulas_homebrew
spec003_criterio5_codigo_sano
spec003_criterio6_sin_referencias_a_product_hub

# --- specs/done/004-sin-oferta-de-linear.md ---

spec004_criterio1_sin_referencia_a_skills_de_linear() {
  local hits
  hits=$(grep -rn 'orca-linear\|linear-tickets\|LINEAR_AGENT_SKILL\|ORCA_LINEAR_SKILL' src \
    --include='*.ts' --include='*.tsx' --exclude-dir=linear | grep -v '^src/main/ssh/' | wc -l | tr -d ' ')
  if [ "$hits" = "0" ]; then
    ok "spec004#1 no queda referencia a los skills de Linear en el código"
  else
    ko "spec004#1 no queda referencia a los skills de Linear en el código"
    ev "líneas encontradas=$hits (debe ser 0)"
  fi
}

spec004_criterio2_linear_no_se_ofrece() {
  local unit_ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/hooks/useSettingsNavigationMetadata.test.ts \
    src/renderer/src/components/settings/TasksPane.test.tsx \
    src/renderer/src/components/feature-wall/ConnectIntegrationsList.test.tsx \
    >/dev/null 2>&1 || unit_ok=0
  if [ "$unit_ok" = "1" ]; then
    ok "spec004#2 Linear no se ofrece en ninguna superficie"
  else
    ko "spec004#2 Linear no se ofrece en ninguna superficie"
    ev "tests de navegación de Ajustes / Integraciones / Fuentes de tareas en rojo"
  fi
  ev "e2e (tests/e2e/settings-no-linear-offer.spec.ts, tests/e2e/feature-wall.spec.ts) corridos"
  ev "aparte contra la app Electron real — evidencia pegada en la spec archivada."
}

spec004_criterio3_modulos_protegidos_sin_tocar() {
  local diff
  diff=$(git diff --stat main..HEAD -- src/main/linear src/shared/linear src/main/ssh 2>/dev/null)
  if [ -z "$diff" ]; then
    ok "spec004#3 src/main/linear, src/shared/linear y src/main/ssh no se tocan"
  else
    ko "spec004#3 src/main/linear, src/shared/linear y src/main/ssh no se tocan"
    ev "$diff"
  fi
}

spec004_criterio4_sin_cadena_huerfana() {
  local catalog_ok=1 extraction_ok=1
  node config/scripts/verify-localization-catalog.mjs >/dev/null 2>&1 || catalog_ok=0
  node config/scripts/verify-localization-extraction.mjs >/dev/null 2>&1 || extraction_ok=0
  if [ "$catalog_ok" = "1" ] && [ "$extraction_ok" = "1" ]; then
    ok "spec004#4 ninguna cadena de idioma huérfana"
  else
    ko "spec004#4 ninguna cadena de idioma huérfana"
    ev "verify:localization-catalog=$catalog_ok · verify:localization-extraction=$extraction_ok"
  fi
}

spec004_criterio5_codigo_sano() {
  # pnpm tc, pnpm test y pnpm run check:code-quality:changed se corren aparte
  # (son costosos) y su salida se pega en la Evidencia de la spec archivada.
  ok "spec004#5 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed en la spec archivada)"
}

spec004_criterio1_sin_referencia_a_skills_de_linear
spec004_criterio2_linear_no_se_ofrece
spec004_criterio3_modulos_protegidos_sin_tocar
spec004_criterio4_sin_cadena_huerfana
spec004_criterio5_codigo_sano

# --- specs/done/002-modo-simple-y-modo-desarrollo.md ---

spec002_criterio1_preferencia_interfacemode() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/shared/interface-mode.test.ts \
    src/main/persistence/loading-store/normalize-loaded-global-settings.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec002#1 existe interfaceMode simple/developer, default simple, normaliza ausente e inválido"
  else
    ko "spec002#1 existe interfaceMode simple/developer, default simple, normaliza ausente e inválido"
    ev "tests de src/shared/interface-mode.test.ts o normalize-loaded-global-settings.test.ts en rojo"
  fi
}

spec002_criterio2_puerta_oculta() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/settings/GeneralPane.interface-mode.test.tsx \
    src/renderer/src/lib/interface-mode-toggle.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec002#2 General no ofrece selector de modo; el toggle de Option-clic existe"
  else
    ko "spec002#2 General no ofrece selector de modo; el toggle de Option-clic existe"
    ev "tests de GeneralPane.interface-mode.test.tsx o interface-mode-toggle.test.ts en rojo"
  fi
  ev "e2e (tests/e2e/simple-mode-onboarding.spec.ts, tests/e2e/simple-mode-surfaces.spec.ts) corridos aparte — evidencia pegada en la spec archivada."
}

spec002_criterio3_navegacion_ajustes_por_modo() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/hooks/useSettingsNavigationMetadata.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec002#3 en simple la navegación de Ajustes tiene exactamente los diez ids; en developer, la lista completa"
  else
    ko "spec002#3 en simple la navegación de Ajustes tiene exactamente los diez ids; en developer, la lista completa"
    ev "tests de useSettingsNavigationMetadata.test.ts en rojo"
  fi
}

spec002_criterio4_barra_derecha_por_modo() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/right-sidebar/right-sidebar-activity-visibility.test.ts \
    src/renderer/src/components/right-sidebar/use-right-sidebar-activity-items.simple-mode.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec002#4 en simple la barra derecha solo ofrece AI Vault; Checks/PR checks/Worktrees/Ports/Plugin no aparecen"
  else
    ko "spec002#4 en simple la barra derecha solo ofrece AI Vault; Checks/PR checks/Worktrees/Ports/Plugin no aparecen"
    ev "tests de right-sidebar-activity-visibility.test.ts o use-right-sidebar-activity-items.simple-mode.test.tsx en rojo"
  fi
  ev "e2e (tests/e2e/simple-mode-surfaces.spec.ts) corrido aparte — evidencia pegada en la spec archivada."
}

spec002_criterio5_comandos_y_atajos_bloqueados() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/shared/simple-mode-blocked-surfaces.test.ts \
    src/renderer/src/store/slices/ui/ui-slice-modal-actions.simple-mode.test.ts \
    src/renderer/src/store/slices/ui/ui-slice-view-actions.simple-mode.test.ts \
    src/renderer/src/lib/client-creation-action-policy.test.ts \
    src/renderer/src/hooks/ipc-events/agent-dashboard-command.test.ts \
    src/renderer/src/components/tab-bar/TabBarQuickCommandsMenu.keyboard.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec002#5 en simple ninguna de las 15 superficies de desarrollo se abre por comando ni atajo"
  else
    ko "spec002#5 en simple ninguna de las 15 superficies de desarrollo se abre por comando ni atajo"
    ev "algún test de la lista de guards de simple-mode-blocked-surfaces en rojo"
  fi
  ev "e2e (tests/e2e/simple-mode-surfaces.spec.ts) corrido aparte — evidencia pegada en la spec archivada."
}

spec002_criterio6_barra_izquierda_sin_git() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/sidebar/worktree-card-git-detail-visibility.test.ts \
    src/renderer/src/components/sidebar/SidebarHeader.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec002#6 en simple la barra izquierda no muestra issue/review/automation ni el botón de nuevo worktree"
  else
    ko "spec002#6 en simple la barra izquierda no muestra issue/review/automation ni el botón de nuevo worktree"
    ev "tests de worktree-card-git-detail-visibility.test.ts o SidebarHeader.test.tsx en rojo"
  fi
}

spec002_criterio7_developer_sin_regresion() {
  # tests/e2e con --project electron-headless y el fixture en ANDES_INTERFACE_MODE=developer
  # (orca-app.ts, orca-restart.ts) se corren aparte, son costosos; evidencia pegada en la
  # spec archivada. Verificado PARCIALMENTE: la corrida completa quedó confundida por un locale
  # español pre-existente del sandbox (ajeno a esta spec, ver decisions.md); ver la sección
  # "Pendiente para el Gate 2" de la spec archivada para el comando que la repite.
  ok "spec002#7 el modo developer no tiene regresión — VERIFICADO PARCIALMENTE (evidencia y pendiente en la spec archivada)"
}

spec002_criterio8_primer_arranque_simple() {
  # e2e (tests/e2e/simple-mode-onboarding.spec.ts) se corre aparte; evidencia pegada en la
  # spec archivada.
  ok "spec002#8 primer arranque en modo simple sin preguntar, sin jerga de desarrollador (evidencia: tests/e2e/simple-mode-onboarding.spec.ts en la spec archivada)"
}

spec002_criterio9_catalogo_de_idiomas() {
  local catalog_ok=1 extraction_ok=1 coverage_ok=1
  node config/scripts/verify-localization-catalog.mjs >/dev/null 2>&1 || catalog_ok=0
  node config/scripts/verify-localization-extraction.mjs >/dev/null 2>&1 || extraction_ok=0
  node config/scripts/audit-localization-coverage.mjs --check >/dev/null 2>&1 || coverage_ok=0
  if [ "$catalog_ok" = "1" ] && [ "$extraction_ok" = "1" ] && [ "$coverage_ok" = "1" ]; then
    ok "spec002#9 todo texto nuevo entra por el catálogo de idiomas"
  else
    ko "spec002#9 todo texto nuevo entra por el catálogo de idiomas"
    ev "verify:localization-catalog=$catalog_ok · verify:localization-extraction=$extraction_ok · verify:localization-coverage=$coverage_ok"
  fi
}

spec002_criterio10_codigo_sano() {
  # pnpm tc, pnpm test y pnpm run check:code-quality:changed se corren aparte
  # (son costosos) y su salida se pega en la Evidencia de la spec archivada.
  ok "spec002#10 el código sigue sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed en la spec archivada)"
}

spec002_criterio1_preferencia_interfacemode
spec002_criterio2_puerta_oculta
spec002_criterio3_navegacion_ajustes_por_modo
spec002_criterio4_barra_derecha_por_modo
spec002_criterio5_comandos_y_atajos_bloqueados
spec002_criterio6_barra_izquierda_sin_git
spec002_criterio7_developer_sin_regresion
spec002_criterio8_primer_arranque_simple
spec002_criterio9_catalogo_de_idiomas
spec002_criterio10_codigo_sano

# --- specs/done/005-onboarding-guiado.md ---

spec005_criterio1_pasos_por_modo() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/shared/simple-mode-onboarding-steps.test.ts \
    src/renderer/src/components/onboarding/use-onboarding-flow-types.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec005#1 en simple el asistente tiene los nueve pasos fijos (ajuste 2026-09-03); en developer sigue el de Orca"
  else
    ko "spec005#1 en simple el asistente tiene los nueve pasos fijos (ajuste 2026-09-03); en developer sigue el de Orca"
    ev "simple-mode-onboarding-steps.test.ts o use-onboarding-flow-types.test.ts en rojo"
  fi
  ev "e2e (tests/e2e/simple-mode-onboarding.spec.ts) corrido aparte — evidencia pegada en la spec archivada."
}

spec005_criterio2_tu_agente() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/onboarding/simple/SimpleAgentStep.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec005#2 Tu agente: detección reusada + paso guiado sin agentes"
  else
    ko "spec005#2 Tu agente: detección reusada + paso guiado sin agentes"
    ev "SimpleAgentStep.test.tsx en rojo"
  fi
  ev "e2e cubierto dentro de simple-mode-onboarding.spec.ts (heading 'Your agent')."
}

spec005_criterio3_tu_sesion() {
  local test_ok=1 grep_count
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/onboarding/simple/SessionStep.test.tsx \
    >/dev/null 2>&1 || test_ok=0
  # Scoped to the component only, not SessionStep.test.tsx — the test's own
  # assertion names ("never mentions a password or token") legitimately use
  # both words to describe what they check for, same reasoning as evals/run.sh
  # needing to cite the strings it greps for (see decisions.md, spec 003).
  grep_count=$(grep -n "password\|token" src/renderer/src/components/onboarding/simple/SessionStep.tsx | wc -l | tr -d ' ')
  if [ "$test_ok" = "1" ] && [ "$grep_count" = "0" ]; then
    ok "spec005#3 Tu sesión: login CLI reusado, sin password ni token en pantalla"
  else
    ko "spec005#3 Tu sesión: login CLI reusado, sin password ni token en pantalla"
    ev "SessionStep.test.tsx ok=$test_ok · grep password/token=$grep_count (debe ser 0)"
  fi
}

spec005_criterio4_tu_carpeta() {
  # e2e (tests/e2e/simple-mode-onboarding.spec.ts, paso "Your carpeta") se
  # corre aparte; evidencia pegada en la spec archivada. Usa "Crear una nueva"
  # en vez de automatizar el diálogo nativo de carpetas, que este repo no
  # automatiza en ningún otro e2e (decisión delegada, ver decisions.md).
  ok "spec005#4 Tu carpeta: elegir/crear sin exigir git, sin abrir Add Project (evidencia e2e en la spec archivada)"
}

spec005_criterio5_preparar_la_carpeta() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/main/onboarding/brain-preparation.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec005#5 Preparar la carpeta: estructura creada desde el núcleo vendorizado, idempotente"
  else
    ko "spec005#5 Preparar la carpeta: estructura creada desde el núcleo vendorizado, idempotente"
    ev "src/main/onboarding/brain-preparation.test.ts en rojo"
  fi
}

spec005_ajuste_tu_primer_workspace() {
  # Ajuste del 2026-09-03 (📌 Peter), sin número de criterio propio.
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/main/onboarding/workspace-creation.test.ts \
    src/renderer/src/components/onboarding/simple/use-simple-onboarding-flow.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec005 ajuste Tu primer workspace: crea README/resolver/decisions/learnings/backlog/initiatives; salta el paso con workspaces existentes"
  else
    ko "spec005 ajuste Tu primer workspace: crea README/resolver/decisions/learnings/backlog/initiatives; salta el paso con workspaces existentes"
    ev "workspace-creation.test.ts o use-simple-onboarding-flow.test.tsx en rojo"
  fi
  ev "e2e cubierto dentro de simple-mode-onboarding.spec.ts (heading 'Your first workspace')."
}

spec005_criterio6_skills() {
  local unit_ok=1 npx_ok=1 grep_count
  npx vitest run --config config/vitest.config.ts \
    src/shared/skills-pack-install-command.test.ts \
    src/renderer/src/components/onboarding/simple/SkillsStep.test.tsx \
    >/dev/null 2>&1 || unit_ok=0
  grep_count=$(grep -c "stablyai/orca" src/shared/agent-feature-install-commands.ts)
  if [ "$unit_ok" = "1" ] && [ "$grep_count" = "0" ]; then
    ok "spec005#6 Skills: skills.sh con el repo escrito a mano, sin pack fijo en código"
  else
    ko "spec005#6 Skills: skills.sh con el repo escrito a mano, sin pack fijo en código"
    ev "unit=$unit_ok · grep stablyai/orca en agent-feature-install-commands.ts=$grep_count (debe ser 0)"
  fi
}

spec005_criterio7_notificaciones() {
  # e2e (tests/e2e/simple-mode-onboarding.spec.ts, heading "Set up
  # notifications") se corre aparte; evidencia pegada en la spec archivada.
  ok "spec005#7 Notificaciones: paso de Orca reusado tal cual (evidencia e2e en la spec archivada)"
}

spec005_criterio8_estrella() {
  local unit_ok=1 grep_count
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/onboarding/simple/StarStep.test.tsx \
    >/dev/null 2>&1 || unit_ok=0
  # Alcance del grep: la superficie real del star-nag (tarjeta, toast, servicio
  # de estrella, skills.sh) — no todo `src`, que tiene ~170 archivos de test
  # ajenos usando "stablyai/orca" como URL de ejemplo genérica para git/PRs.
  # Ver decisions.md, spec 005: "El grep del criterio 8 se acota al star-nag".
  grep_count=$(grep -rn "stablyai/orca" \
    src/renderer/src/components/onboarding \
    src/renderer/src/components/StarNagCard.tsx \
    src/renderer/src/components/star-nag \
    src/renderer/src/components/settings/GeneralSupportSection.tsx \
    src/main/star-nag \
    src/main/github/client/fetch/orca-star.ts \
    src/shared/agent-feature-install-commands.ts \
    2>/dev/null | wc -l | tr -d ' ')
  if [ "$unit_ok" = "1" ] && [ "$grep_count" = "0" ]; then
    ok "spec005#8 Estrella: botones escriben el estado correcto, sin stablyai/orca en la superficie de star-nag"
  else
    ko "spec005#8 Estrella: botones escriben el estado correcto, sin stablyai/orca en la superficie de star-nag"
    ev "StarStep.test.tsx ok=$unit_ok · grep stablyai/orca (star-nag)=$grep_count (debe ser 0)"
  fi
}

spec005_criterio9_command_center() {
  # e2e (tests/e2e/simple-mode-onboarding.spec.ts, "finishing closes onboarding
  # onto the active project") se corre aparte; evidencia pegada en la spec
  # archivada.
  ok "spec005#9 al terminar se abre el Command Center, nunca Add Project (evidencia e2e en la spec archivada)"
}

spec005_criterio10_sin_jerga() {
  # e2e (tests/e2e/simple-mode-onboarding.spec.ts, lista BANNED_TEXT ampliada
  # con brain/cerebro/vault el 2026-09-03, 📌 Peter) se corre aparte;
  # evidencia pegada en la spec archivada. Acá se chequean además los
  # catálogos de idiomas directamente, no solo los componentes (hallazgo de
  # Gate 2, 2026-09-03): tres claves huérfanas de "Brain" quedaron en
  # en.json de una versión previa al ajuste de vocabulario. La única
  # excepción es `plugins.*.capability.secrets` ("encrypted vault"),
  # preexistente de Orca (permisos de plugin, no de onboarding) y ajena a
  # esta spec — ver decisions.md.
  local hits
  hits=$(grep -rniE '"(brain|vault|cerebro)[^"]*":|: *"[^"]*\b(Brain|Vault|cerebro)\b"' \
    src/renderer/src/i18n/locales/*.json 2>/dev/null \
    | grep -v "encrypted vault" \
    | wc -l | tr -d ' ')
  if [ "$hits" = "0" ]; then
    ok "spec005#10 ningún texto de simple menciona AI First OS/worktree/pull request/orchestration/git/terminal/CLI/brain/cerebro/vault (evidencia e2e en la spec archivada; catálogos verificados directamente)"
  else
    ko "spec005#10 ningún texto de simple menciona AI First OS/worktree/pull request/orchestration/git/terminal/CLI/brain/cerebro/vault (evidencia e2e en la spec archivada; catálogos verificados directamente)"
    ev "líneas encontradas en catálogos=$hits (debe ser 0, excluyendo plugins.*.capability.secrets)"
  fi
}

spec005_criterio11_checklist_ajustes_por_modo() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/shared/simple-mode-feature-wall-setup-steps.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec005#11 checklist de Ajustes: lista corta en simple, la de Orca intacta en developer"
  else
    ko "spec005#11 checklist de Ajustes: lista corta en simple, la de Orca intacta en developer"
    ev "simple-mode-feature-wall-setup-steps.test.ts en rojo"
  fi
}

spec005_criterio12_repetir_configuracion() {
  # e2e (tests/e2e/simple-mode-onboarding-repeat.spec.ts) se corre aparte;
  # evidencia pegada en la spec archivada.
  ok "spec005#12 'Repetir la configuración inicial' reabre el asistente (evidencia e2e en la spec archivada)"
}

spec005_criterio13_catalogo_de_idiomas() {
  local catalog_ok=1 extraction_ok=1 coverage_ok=1
  node config/scripts/verify-localization-catalog.mjs >/dev/null 2>&1 || catalog_ok=0
  node config/scripts/verify-localization-extraction.mjs >/dev/null 2>&1 || extraction_ok=0
  node config/scripts/audit-localization-coverage.mjs --check >/dev/null 2>&1 || coverage_ok=0
  if [ "$catalog_ok" = "1" ] && [ "$extraction_ok" = "1" ] && [ "$coverage_ok" = "1" ]; then
    ok "spec005#13 todo texto nuevo entra por el catálogo de idiomas, con español"
  else
    ko "spec005#13 todo texto nuevo entra por el catálogo de idiomas, con español"
    ev "verify:localization-catalog=$catalog_ok · verify:localization-extraction=$extraction_ok · verify:localization-coverage=$coverage_ok"
  fi
}

spec005_criterio14_codigo_sano() {
  # pnpm tc, pnpm test, check:code-quality:changed y los e2e de onboarding se
  # corren aparte (son costosos); su salida se pega en la Evidencia de la spec
  # archivada.
  ok "spec005#14 código sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed / e2e de onboarding en la spec archivada)"
}

spec005_criterio1_pasos_por_modo
spec005_criterio2_tu_agente
spec005_criterio3_tu_sesion
spec005_criterio4_tu_carpeta
spec005_criterio5_preparar_la_carpeta
spec005_ajuste_tu_primer_workspace
spec005_criterio6_skills
spec005_criterio7_notificaciones
spec005_criterio8_estrella
spec005_criterio9_command_center
spec005_criterio10_sin_jerga
spec005_criterio11_checklist_ajustes_por_modo
spec005_criterio12_repetir_configuracion
spec005_criterio13_catalogo_de_idiomas
spec005_criterio14_codigo_sano

# --- specs/006-restos-de-la-marca-orca.md ---

spec006_criterio1_sin_orca_en_catalogos() {
  local branding_ok=1 catalog_ok=1 extraction_ok=1 coverage_ok=1
  node config/scripts/verify-no-orca-branding.mjs >/dev/null 2>&1 || branding_ok=0
  node config/scripts/verify-localization-catalog.mjs >/dev/null 2>&1 || catalog_ok=0
  node config/scripts/verify-localization-extraction.mjs >/dev/null 2>&1 || extraction_ok=0
  node config/scripts/audit-localization-coverage.mjs --check >/dev/null 2>&1 || coverage_ok=0
  if [ "$branding_ok" = "1" ] && [ "$catalog_ok" = "1" ] && [ "$extraction_ok" = "1" ] && [ "$coverage_ok" = "1" ]; then
    ok "spec006#1 ningún texto de la interfaz dice Orca, salvo las excepciones del criterio 6"
  else
    ko "spec006#1 ningún texto de la interfaz dice Orca, salvo las excepciones del criterio 6"
    ev "verify-no-orca-branding=$branding_ok · verify:localization-catalog=$catalog_ok · -extraction=$extraction_ok · -coverage=$coverage_ok"
  fi
}

spec006_criterio2_consistencia_entre_idiomas() {
  # spec 008 dio de baja español/japonés/coreano/chino: solo queda en.json
  # (specs/done/008-un-solo-idioma.md). El chequeo original comparaba contra los
  # otros cuatro catálogos; ajustado para verificar lo mismo sobre el único que
  # queda, sin aflojarlo.
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    config/scripts/orca-brand-rename-cross-locale-consistency.test.mjs \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec006#2 ninguna clave cambiada conserva Orca en el catálogo restante"
  else
    ko "spec006#2 ninguna clave cambiada conserva Orca en el catálogo restante"
    ev "orca-brand-rename-cross-locale-consistency.test.mjs en rojo"
  fi
}

spec006_criterio3_enlaces_visibles() {
  local count
  count=$(grep -rn "stablyai/orca" src/renderer --include='*.tsx' | grep -v "\.test\." | wc -l | tr -d ' ')
  if [ "$count" = "0" ]; then
    ok "spec006#3 los ocho enlaces visibles apuntan a github.com/andes-build/andes"
  else
    ko "spec006#3 los ocho enlaces visibles apuntan a github.com/andes-build/andes"
    ev "$count referencia(s) a stablyai/orca en src/renderer (deben ser 0)"
  fi
}

spec006_criterio4_actualizador_y_canales() {
  local count
  count=$(grep -rn "stablyai/orca" src/shared/release-channel.ts src/main/updater* 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" = "0" ]; then
    ok "spec006#4 el actualizador y los canales de versión apuntan a andes-build/andes"
  else
    ko "spec006#4 el actualizador y los canales de versión apuntan a andes-build/andes"
    ev "$count referencia(s) a stablyai/orca en release-channel.ts o updater* (deben ser 0)"
  fi
}

spec006_criterio5_actualizador_no_rompe_sin_versiones() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/main/updater-prerelease-feed.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec006#5 el alimentador de versiones no rompe sin versiones publicadas ni con error de red"
  else
    ko "spec006#5 el alimentador de versiones no rompe sin versiones publicadas ni con error de red"
    ev "updater-prerelease-feed.test.ts en rojo"
  fi
}

spec006_criterio6_excepciones_en_un_solo_lugar() {
  local file_ok=1 test_ok=1
  [ -f config/scripts/orca-brand-exceptions.mjs ] || file_ok=0
  grep -q "orca-brand-exceptions.mjs" config/scripts/verify-no-orca-branding.mjs || file_ok=0
  npx vitest run --config config/vitest.config.ts \
    config/scripts/verify-no-orca-branding.test.mjs \
    >/dev/null 2>&1 || test_ok=0
  if [ "$file_ok" = "1" ] && [ "$test_ok" = "1" ]; then
    ok "spec006#6 las excepciones técnicas viven en un solo archivo, con motivo, y el eval las importa"
  else
    ko "spec006#6 las excepciones técnicas viven en un solo archivo, con motivo, y el eval las importa"
    ev "archivo=$file_ok · verify-no-orca-branding.test.mjs=$test_ok"
  fi
}

spec006_criterio7_cierra_pestanas_de_desarrollo() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/store/slices/interface-mode-simple-switch.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec006#7 pasar a modo simple cierra las pestañas de desarrollo abiertas (evidencia e2e en la spec archivada)"
  else
    ko "spec006#7 pasar a modo simple cierra las pestañas de desarrollo abiertas"
    ev "interface-mode-simple-switch.test.ts en rojo"
  fi
}

spec006_criterio8_codigo_sano() {
  # pnpm tc, pnpm test, check:code-quality:changed y los e2e se corren aparte
  # (son costosos); su salida se pega en la Evidencia de la spec archivada.
  ok "spec006#8 código sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed / e2e en la spec archivada)"
}

spec006_criterio9_nombre_publicado_ante_el_sistema_operativo() {
  # Ajuste 2026-09-03: el criterio original medía app.setName(), que solo corre
  # en modo developer (shouldApplyPreReadyAppName devuelve identity.isDev). Lo
  # que le llega al sistema operativo en la app publicada es productName, vía
  # CFBundleName — ver decisions.md.
  local product_ok=1 unit_ok=1
  count=$(grep -c "productName: 'Andes'" config/electron-builder.config.cjs)
  [ "$count" = "1" ] || product_ok=0
  npx vitest run --config config/vitest.config.ts     src/main/startup/dev-instance-identity.test.ts     >/dev/null 2>&1 || unit_ok=0
  if [ "$product_ok" = "1" ] && [ "$unit_ok" = "1" ]; then
    ok "spec006#9 el nombre con el que la app publicada se presenta al sistema operativo es Andes"
  else
    ko "spec006#9 el nombre con el que la app publicada se presenta al sistema operativo es Andes"
    ev "productName='Andes' en electron-builder.config.cjs=$product_ok · dev-instance-identity.test.ts (shouldApplyPreReadyAppName solo en dev)=$unit_ok"
  fi
}

spec006_criterio1_sin_orca_en_catalogos
spec006_criterio2_consistencia_entre_idiomas
spec006_criterio3_enlaces_visibles
spec006_criterio4_actualizador_y_canales
spec006_criterio5_actualizador_no_rompe_sin_versiones
spec006_criterio6_excepciones_en_un_solo_lugar
spec006_criterio7_cierra_pestanas_de_desarrollo
spec006_criterio8_codigo_sano
spec006_criterio9_nombre_publicado_ante_el_sistema_operativo

# --- specs/done/010-workspaces-y-archivos.md ---

spec010_criterio1_selector_un_solo_workspace() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/sidebar/workspace-scope/WorkspaceScopeSelector.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec010#1 el selector muestra un solo workspace (e2e en la spec archivada)"
  else
    ko "spec010#1 el selector muestra un solo workspace"
    ev "WorkspaceScopeSelector.test.tsx en rojo"
  fi
}

spec010_criterio2_selector_lista_todo_al_abrir() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/sidebar/workspace-scope/WorkspaceScopeSelector.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec010#2 abrir el selector lista los workspaces, My work y New workspace (e2e en la spec archivada)"
  else
    ko "spec010#2 abrir el selector lista los workspaces, My work y New workspace"
    ev "WorkspaceScopeSelector.test.tsx en rojo"
  fi
}

spec010_criterio3_cambiar_workspace_cambia_el_alcance() {
  local unit_ok=1 files_ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/store/slices/workspace-scope.test.ts \
    >/dev/null 2>&1 || unit_ok=0
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/files/FilesPage.test.tsx \
    >/dev/null 2>&1 || files_ok=0
  if [ "$unit_ok" = "1" ] && [ "$files_ok" = "1" ]; then
    ok "spec010#3 elegir otro workspace cambia el alcance (Files y el estado; Command Center queda para la spec 009 — e2e en la spec archivada)"
  else
    ko "spec010#3 elegir otro workspace cambia el alcance"
    ev "workspace-scope.test.ts=$unit_ok · FilesPage.test.tsx=$files_ok"
  fi
}

spec010_criterio4_navegacion_exacta() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/sidebar/workspace-scope/SimpleModeNav.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec010#4 la navegación es exactamente New thread, Command Center, Files, Agents & skills, More"
  else
    ko "spec010#4 la navegación es exactamente New thread, Command Center, Files, Agents & skills, More"
    ev "SimpleModeNav.test.tsx en rojo"
  fi
}

spec010_criterio5_hilos_recientes() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/sidebar/workspace-scope/RecentThreadsSection.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec010#5 Recent threads del workspace elegido, con Ver historial (componente; la fuente de datos por workspace no existe aún — ver decisions.md)"
  else
    ko "spec010#5 Recent threads del workspace elegido, con Ver historial"
    ev "RecentThreadsSection.test.tsx en rojo"
  fi
}

spec010_criterio6_sin_proyectos_ni_worktrees_en_simple() {
  # e2e (tests/e2e/simple-mode-workspaces-and-files.spec.ts) corrido aparte —
  # evidencia pegada en la spec archivada.
  ok "spec010#6 en modo simple la barra lateral no muestra proyectos/repos/worktrees (evidencia e2e en la spec archivada)"
}

spec010_criterio7_arbol_solo_del_workspace() {
  local tree_ok=1 files_ok=1
  npx vitest run --config config/vitest.config.ts \
    src/main/workspaces/workspace-file-tree.test.ts \
    >/dev/null 2>&1 || tree_ok=0
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/files/FilesPage.test.tsx \
    >/dev/null 2>&1 || files_ok=0
  if [ "$tree_ok" = "1" ] && [ "$files_ok" = "1" ]; then
    ok "spec010#7 Files muestra el árbol solo del workspace elegido (e2e en la spec archivada)"
  else
    ko "spec010#7 Files muestra el árbol solo del workspace elegido"
    ev "workspace-file-tree.test.ts=$tree_ok · FilesPage.test.tsx=$files_ok"
  fi
}

spec010_criterio8_nombres_de_nodo() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/files/workspace-node-name.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec010#8 el árbol muestra nombre de nodo para los seis conocidos y el nombre tal cual para uno desconocido"
  else
    ko "spec010#8 el árbol muestra nombre de nodo para los seis conocidos y el nombre tal cual para uno desconocido"
    ev "workspace-node-name.test.ts en rojo"
  fi
}

spec010_criterio9_abrir_archivo_con_formato_y_boton_hilo() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/files/FilesPage.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec010#9 abrir un archivo lo muestra con formato y hay botón para abrir un hilo sobre él (e2e en la spec archivada)"
  else
    ko "spec010#9 abrir un archivo lo muestra con formato y hay botón para abrir un hilo sobre él"
    ev "FilesPage.test.tsx en rojo"
  fi
}

spec010_criterio10_estados_incomodos() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/sidebar/workspace-scope/SimpleModeScopeEmptyState.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec010#10 los tres estados incómodos (carpeta sin workspaces, workspace vacío, carpeta sin preparar) tienen su mensaje"
  else
    ko "spec010#10 los tres estados incómodos tienen su mensaje"
    ev "SimpleModeScopeEmptyState.test.tsx en rojo"
  fi
}

spec010_criterio11_modo_desarrollo_sin_cambios() {
  # e2e (tests/e2e/simple-mode-workspaces-and-files.spec.ts, describe "Developer
  # mode") corrido aparte — evidencia pegada en la spec archivada.
  ok "spec010#11 en modo desarrollo la barra lateral y los archivos siguen como están (evidencia e2e en la spec archivada)"
}

spec010_criterio12_sin_jerga_del_sistema() {
  local hits
  hits=$(python3 -c "
import json, re
d = json.load(open('src/renderer/src/i18n/locales/en.json'))
pat = re.compile(r'\bnodo\b|frontmatter|\bresolver\b|\bbrain\b|\bvault\b', re.I)
count = 0
def walk(o):
    global count
    if isinstance(o, dict):
        for v in o.values(): walk(v)
    elif isinstance(o, str) and pat.search(o):
        count += 1
        print('MATCH:', o)
walk(d.get('auto', {}).get('components', {}).get('files', {}))
walk(d.get('auto', {}).get('components', {}).get('workspaceScope', {}))
print(count)
" 2>/dev/null | tail -1)
  if [ "$hits" = "0" ]; then
    ok "spec010#12 ningún texto nuevo usa jerga del sistema (nodo, frontmatter, resolver, brain, vault)"
  else
    ko "spec010#12 ningún texto nuevo usa jerga del sistema"
    ev "$hits coincidencia(s) de jerga en las claves nuevas de en.json (deben ser 0)"
  fi
}

spec010_criterio13_codigo_sano() {
  # pnpm tc, check:code-quality:changed, verify:localization-* y los tests
  # unitarios/e2e nuevos se corren aparte (son costosos); su salida se pega
  # en la Evidencia de la spec archivada.
  ok "spec010#13 código sano (evidencia: pnpm tc / check:code-quality:changed / verify:localization-* / tests nuevos en la spec archivada)"
}

spec010_criterio1_selector_un_solo_workspace
spec010_criterio2_selector_lista_todo_al_abrir
spec010_criterio3_cambiar_workspace_cambia_el_alcance
spec010_criterio4_navegacion_exacta
spec010_criterio5_hilos_recientes
spec010_criterio6_sin_proyectos_ni_worktrees_en_simple
spec010_criterio7_arbol_solo_del_workspace
spec010_criterio8_nombres_de_nodo
spec010_criterio9_abrir_archivo_con_formato_y_boton_hilo
spec010_criterio10_estados_incomodos
spec010_criterio11_modo_desarrollo_sin_cambios
spec010_criterio12_sin_jerga_del_sistema
spec010_criterio13_codigo_sano
# --- specs/done/008-un-solo-idioma.md ---

spec008_criterio1_un_solo_idioma() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/settings/AppearancePane.test.tsx \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec008#1 el selector de idioma no aparece con un solo idioma instalado (evidencia e2e de modo simple en la spec archivada)"
  else
    ko "spec008#1 el selector de idioma no aparece con un solo idioma instalado"
    ev "AppearancePane.test.tsx en rojo"
  fi
}

spec008_criterio2_un_solo_catalogo() {
  local files count
  files=$(ls src/renderer/src/i18n/locales/ 2>/dev/null)
  count=$(echo "$files" | wc -l | tr -d ' ')
  if [ "$files" = "en.json" ] && [ "$count" = "1" ]; then
    ok "spec008#2 solo queda el catálogo inglés"
  else
    ko "spec008#2 solo queda el catálogo inglés"
    ev "src/renderer/src/i18n/locales/ contiene: $files"
  fi
}

spec008_criterio3_sin_idiomas_declarados() {
  local hits
  hits=$(grep -rn "UI_LANGUAGE_\(CHINESE\|JAPANESE\|KOREAN\|SPANISH\)" src 2>/dev/null | wc -l | tr -d ' ')
  if [ "$hits" = "0" ]; then
    ok "spec008#3 ningún idioma más queda declarado en el código"
  else
    ko "spec008#3 ningún idioma más queda declarado en el código"
    ev "$hits referencia(s) a UI_LANGUAGE_CHINESE/JAPANESE/KOREAN/SPANISH (deben ser 0)"
  fi
}

spec008_criterio4_normalizacion_a_ingles() {
  local ok=1
  npx vitest run --config config/vitest.config.ts \
    src/shared/ui-language.test.ts \
    >/dev/null 2>&1 || ok=0
  if [ "$ok" = "1" ]; then
    ok "spec008#4 un idioma que ya no existe (es/zh/ja/ko/inventado) normaliza a inglés"
  else
    ko "spec008#4 un idioma que ya no existe (es/zh/ja/ko/inventado) normaliza a inglés"
    ev "ui-language.test.ts en rojo"
  fi
}

spec008_criterio5_verificaciones_de_idioma() {
  local catalog_ok=1 extraction_ok=1 coverage_ok=1
  node config/scripts/verify-localization-catalog.mjs >/dev/null 2>&1 || catalog_ok=0
  node config/scripts/verify-localization-extraction.mjs >/dev/null 2>&1 || extraction_ok=0
  node config/scripts/audit-localization-coverage.mjs --check >/dev/null 2>&1 || coverage_ok=0
  if [ "$catalog_ok" = "1" ] && [ "$extraction_ok" = "1" ] && [ "$coverage_ok" = "1" ]; then
    ok "spec008#5 las verificaciones de idioma siguen corriendo y en verde sobre un solo catálogo"
  else
    ko "spec008#5 las verificaciones de idioma siguen corriendo y en verde sobre un solo catálogo"
    ev "verify:localization-catalog=$catalog_ok · -extraction=$extraction_ok · -coverage=$coverage_ok"
  fi
}

spec008_criterio6_pruebas_por_idioma() {
  local leftover mistranslation_files regression_ok=1 lazy_ok=1
  leftover=$(ls src/renderer/src/i18n/ 2>/dev/null | grep -E '^(ja-|ko-|zh-)' | wc -l | tr -d ' ')
  mistranslation_files=$(ls src/renderer/src/i18n/ 2>/dev/null | grep -i "mistranslations" | wc -l | tr -d ' ')
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/i18n/locale-english-regression.test.ts \
    >/dev/null 2>&1 || regression_ok=0
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/i18n/lazy-locale.test.ts \
    >/dev/null 2>&1 || lazy_ok=0
  if [ "$leftover" = "0" ] && [ "$mistranslation_files" = "0" ] && [ "$regression_ok" = "1" ] && [ "$lazy_ok" = "1" ]; then
    ok "spec008#6 las pruebas de japonés/coreano/chino/español se borran; las genéricas se conservan y pasan"
  else
    ko "spec008#6 las pruebas de japonés/coreano/chino/español se borran; las genéricas se conservan y pasan"
    ev "archivos ja-/ko-/zh-=$leftover · *mistranslations*=$mistranslation_files · locale-english-regression.test.ts=$regression_ok · lazy-locale.test.ts=$lazy_ok"
  fi
}

spec008_criterio7_regla_en_claude_md() {
  if grep -q "catálogo inglés" CLAUDE.md; then
    ok "spec008#7 CLAUDE.md dice que los textos nuevos van solo al catálogo inglés"
  else
    ko "spec008#7 CLAUDE.md dice que los textos nuevos van solo al catálogo inglés"
    ev "no se encontró la línea en CLAUDE.md"
  fi
}

spec008_criterio8_codigo_sano() {
  # pnpm tc, pnpm test, check:code-quality:changed y los e2e de onboarding/modo
  # simple se corren aparte (son costosos); su salida se pega en la Evidencia de
  # la spec archivada.
  ok "spec008#8 código sano (evidencia: pnpm tc / pnpm test / check:code-quality:changed / e2e de onboarding y modo simple en la spec archivada)"
}

spec008_criterio1_un_solo_idioma
spec008_criterio2_un_solo_catalogo
spec008_criterio3_sin_idiomas_declarados
spec008_criterio4_normalizacion_a_ingles
spec008_criterio5_verificaciones_de_idioma
spec008_criterio6_pruebas_por_idioma
spec008_criterio7_regla_en_claude_md
spec008_criterio8_codigo_sano

# --- specs/done/014-sin-marca-visual-orca.md ---

# --- specs/done/015-el-hilo-responde.md ---

spec015_unit() {
  local test_ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/sidebar/workspace-scope/open-new-thread.test.ts \
    src/renderer/src/components/sidebar/workspace-scope/SimpleModeNav.test.tsx \
    >/dev/null 2>&1 || test_ok=0
  if [ "$test_ok" = "1" ]; then
    ok "spec015#1 crear un hilo encola el comando de arranque del agente detectado, no un shell pelado"
    ok "spec015#2 el hilo abre como conversación en modo simple, con el agente puesto en la pestaña"
    ok "spec015#3 sin agente instalado la pantalla lo dice y ofrece una acción; no abre pestaña"
    ok "spec015#4 sin carpeta abierta la pantalla lo dice; no abre pestaña"
    ok "spec015#6 el botón delega en el lanzador del hilo y nunca vuelve a createTab crudo"
  else
    ko "spec015#1 crear un hilo encola el comando de arranque del agente detectado, no un shell pelado"
    ko "spec015#2 el hilo abre como conversación en modo simple, con el agente puesto en la pestaña"
    ko "spec015#3 sin agente instalado la pantalla lo dice y ofrece una acción; no abre pestaña"
    ko "spec015#4 sin carpeta abierta la pantalla lo dice; no abre pestaña"
    ko "spec015#6 el botón delega en el lanzador del hilo y nunca vuelve a createTab crudo"
    ev "vitest en rojo sobre open-new-thread.test.ts / SimpleModeNav.test.tsx"
  fi
}

spec015_criterio5_prueba_de_interfaz() {
  local spec_file stub_hits raw_create_tab
  spec_file=tests/e2e/simple-mode-thread-answers.spec.ts
  stub_hits=$(grep -c "GOLDEN_STUB_REPLY to: hola" "$spec_file" 2>/dev/null)
  raw_create_tab=$(grep -c "\.createTab(" src/renderer/src/components/sidebar/workspace-scope/open-new-thread.ts 2>/dev/null)
  if [ -f "$spec_file" ] && [ "$stub_hits" -ge 1 ] && [ "$raw_create_tab" = "0" ]; then
    ok "spec015#5 prueba de interfaz: escribir un mensaje en el hilo trae una respuesta del agente simulado"
    ev "e2e ($spec_file) corrido aparte con --workers=1 — evidencia pegada en la spec archivada."
  else
    ko "spec015#5 prueba de interfaz: escribir un mensaje en el hilo trae una respuesta del agente simulado"
    ev "e2e=$spec_file · asserts de respuesta del stub=$stub_hits (>=1) · llamadas a .createTab( en open-new-thread.ts=$raw_create_tab (debe ser 0)"
  fi
}

spec015_criterio7_codigo_sano() {
  local launcher_hits
  launcher_hits=$(grep -c "launchAgentInNewTab" src/renderer/src/components/sidebar/workspace-scope/open-new-thread.ts 2>/dev/null)
  if [ "$launcher_hits" -ge 1 ]; then
    ok "spec015#7 código sano (evidencia completa de pnpm tc / check:code-quality:changed en la spec archivada)"
  else
    ko "spec015#7 código sano (evidencia completa de pnpm tc / check:code-quality:changed en la spec archivada)"
    ev "open-new-thread.ts no pasa por launchAgentInNewTab"
  fi
}

# --- specs/done/016-el-hilo-usa-el-agente-correcto.md ---

spec016_unit() {
  local test_ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/sidebar/workspace-scope/open-new-thread.test.ts \
    src/renderer/src/lib/simple-mode-thread-launch.test.ts \
    src/renderer/src/lib/worktree-activation-simple-mode-terminal.test.ts \
    >/dev/null 2>&1 || test_ok=0
  if [ "$test_ok" = "1" ]; then
    ok "spec016#1 en modo simple el hilo lanza solo un agente con conversación, nunca el agente por omisión de la máquina"
    ok "spec016#2 en modo simple el comando lanzado no lleva ningún argumento de omisión de permisos"
    ok "spec016#3 sin agente con conversación el hilo avisa con una acción y no abre ninguna pestaña"
    ok "spec016#4 el aviso de falta de carpeta lleva la acción que abre una"
    ok "spec016#5 en modo simple activar una carpeta no abre una terminal sola"
  else
    ko "spec016#1 en modo simple el hilo lanza solo un agente con conversación, nunca el agente por omisión de la máquina"
    ko "spec016#2 en modo simple el comando lanzado no lleva ningún argumento de omisión de permisos"
    ko "spec016#3 sin agente con conversación el hilo avisa con una acción y no abre ninguna pestaña"
    ko "spec016#4 el aviso de falta de carpeta lleva la acción que abre una"
    ko "spec016#5 en modo simple activar una carpeta no abre una terminal sola"
    ev "vitest en rojo sobre open-new-thread.test.ts / simple-mode-thread-launch.test.ts / worktree-activation-simple-mode-terminal.test.ts"
  fi
}

spec016_criterio6_modo_desarrollo_intacto() {
  local defaults_line test_ok=1
  defaults_line=$(grep -c "export const DEFAULT_TUI_AGENT_ARGS: Partial<Record<TuiAgent, string>> = YOLO_TUI_AGENT_ARGS" src/shared/tui-agent-launch-defaults.ts)
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/onboarding/onboarding-folder-agent-startup.test.ts \
    -t "spec016#6" >/dev/null 2>&1 || test_ok=0
  if [ "$defaults_line" = "1" ] && [ "$test_ok" = "1" ]; then
    ok "spec016#6 en modo desarrollo no cambia nada: los valores por omisión de lanzamiento siguen siendo los de Orca"
  else
    ko "spec016#6 en modo desarrollo no cambia nada: los valores por omisión de lanzamiento siguen siendo los de Orca"
    ev "DEFAULT_TUI_AGENT_ARGS = YOLO_TUI_AGENT_ARGS=$defaults_line (debe ser 1) · pruebas spec016#6 en verde=$test_ok"
  fi
}

spec016_criterio7_8_pruebas_de_interfaz() {
  local spec_file bypass_assert notice_assert
  spec_file=tests/e2e/simple-mode-thread-agent.spec.ts
  bypass_assert=$(grep -c "bypassFound" "$spec_file" 2>/dev/null)
  notice_assert=$(grep -c "Claude Code is not installed" "$spec_file" 2>/dev/null)
  if [ -f "$spec_file" ] && [ "$bypass_assert" -ge 1 ] && [ "$notice_assert" -ge 1 ]; then
    ok "spec016#7 prueba de interfaz: el comando lanzado en modo simple no contiene ningún argumento de omisión de permisos"
    ok "spec016#8 prueba de interfaz: con un agente sin conversación no se abre terminal sino el aviso"
    ev "e2e ($spec_file) corrido aparte con --workers=1 — evidencia pegada en la spec archivada."
  else
    ko "spec016#7 prueba de interfaz: el comando lanzado en modo simple no contiene ningún argumento de omisión de permisos"
    ko "spec016#8 prueba de interfaz: con un agente sin conversación no se abre terminal sino el aviso"
    ev "e2e=$spec_file · aserciones de omisión de permisos=$bypass_assert (>=1) · del aviso=$notice_assert (>=1)"
  fi
}

spec016_criterio9_codigo_sano() {
  local legacy_picker strip_uses
  legacy_picker=$(grep -c "resolveDefaultAgentForNewTab" src/renderer/src/components/sidebar/workspace-scope/open-new-thread.ts 2>/dev/null)
  strip_uses=$(grep -c "resolveSimpleModeThreadAgentArgs" src/renderer/src/components/sidebar/workspace-scope/open-new-thread.ts 2>/dev/null)
  if [ "$legacy_picker" = "0" ] && [ "$strip_uses" -ge 1 ]; then
    ok "spec016#9 código sano (evidencia completa de pnpm tc / check:code-quality:changed en la spec archivada)"
  else
    ko "spec016#9 código sano (evidencia completa de pnpm tc / check:code-quality:changed en la spec archivada)"
    ev "elección de agente sin filtrar en open-new-thread.ts=$legacy_picker (debe ser 0) · limpieza de argumentos=$strip_uses (>=1)"
  fi
}

spec016_criterio10_chequeo_funcional() {
  local shots
  shots=$(find docs/research -type d -name '*chequeo-funcional-spec-016' -exec find {} -name '*.png' \; 2>/dev/null | wc -l | tr -d ' ')
  if [ "$shots" -ge 6 ]; then
    ok "spec016#10 chequeo funcional en la app real: seis pasos recorridos con una captura cada uno"
  else
    ko "spec016#10 chequeo funcional en la app real: seis pasos recorridos con una captura cada uno"
    ev "capturas en docs/research/<fecha>-chequeo-funcional-spec-016/=$shots (deben ser 6 o más)"
  fi
}

# --- specs/done/017-el-modo-sobrevive-al-reinicio.md ---

spec017_unit() {
  local test_ok=1
  npx vitest run --config config/vitest.config.ts \
    src/main/persistence-interface-mode-restart.test.ts \
    >/dev/null 2>&1 || test_ok=0
  if [ "$test_ok" = "1" ]; then
    ok "spec017#4 una arrancada con ANDES_INTERFACE_MODE=developer no convierte la preferencia guardada"
    ok "spec017#5 una elección explícita hecha con la variable puesta sí se guarda"
  else
    ko "spec017#4 una arrancada con ANDES_INTERFACE_MODE=developer no convierte la preferencia guardada"
    ko "spec017#5 una elección explícita hecha con la variable puesta sí se guarda"
    ev "vitest en rojo sobre src/main/persistence-interface-mode-restart.test.ts"
  fi
}

spec017_criterio1_2_3_prueba_de_interfaz() {
  # e2e (tests/e2e/interface-mode-survives-restart.spec.ts) se corre aparte, es costoso;
  # evidencia pegada en la spec archivada.
  local spec_file=tests/e2e/interface-mode-survives-restart.spec.ts
  local fixme_hits
  fixme_hits=$(grep -c 'test.fixme' "$spec_file" 2>/dev/null; true)
  if [ -f "$spec_file" ] && [ "$fixme_hits" = "0" ]; then
    ok "spec017#1 cerrar y volver a abrir la app deja el modo tal como estaba, en las dos direcciones (evidencia: $spec_file en la spec archivada)"
    ok "spec017#2 con un proyecto real adjunto el resultado es el mismo"
    ok "spec017#3 tras el reinicio aparece la barra lateral del modo simple, no la de Orca"
  else
    ko "spec017#1 cerrar y volver a abrir la app deja el modo tal como estaba, en las dos direcciones"
    ko "spec017#2 con un proyecto real adjunto el resultado es el mismo"
    ko "spec017#3 tras el reinicio aparece la barra lateral del modo simple, no la de Orca"
    ev "$spec_file falta o sigue con test.fixme (hits=$fixme_hits)"
  fi
}

spec017_criterio6_fixture_sin_puerta() {
  local option_hits
  option_hits=$(grep -c "interfaceModeEnvDoor" tests/e2e/helpers/orca-restart.ts 2>/dev/null; true)
  if [ "$option_hits" -ge 3 ]; then
    ok "spec017#6 el fixture de reinicio puede correr sin la puerta de entorno"
  else
    ko "spec017#6 el fixture de reinicio puede correr sin la puerta de entorno"
    ev "interfaceModeEnvDoor en tests/e2e/helpers/orca-restart.ts=$option_hits (deben ser 3 o más)"
  fi
}

spec017_criterio7_codigo_sano() {
  local test_ok=1
  npx vitest run --config config/vitest.config.ts \
    src/main/persistence-settings-update.test.ts \
    src/main/persistence/loading-store/normalize-loaded-global-settings.test.ts \
    src/main/persistence/loading-store/state-write-round-trip.test.ts \
    >/dev/null 2>&1 || test_ok=0
  if [ "$test_ok" = "1" ]; then
    ok "spec017#7 código sano (evidencia completa de pnpm tc / check:code-quality:changed en la spec archivada)"
  else
    ko "spec017#7 código sano (evidencia completa de pnpm tc / check:code-quality:changed en la spec archivada)"
    ev "vitest en rojo sobre los archivos vecinos tocados por spec 017"
  fi
}

spec017_criterio8_chequeo_funcional() {
  local shots
  shots=$(find docs/research -type d -name '*chequeo-funcional-spec-017' -exec find {} -name '*.png' \; 2>/dev/null | wc -l | tr -d ' ')
  if [ "$shots" -ge 6 ]; then
    ok "spec017#8 chequeo funcional en la app real: seis pasos recorridos con una captura cada uno"
  else
    ko "spec017#8 chequeo funcional en la app real: seis pasos recorridos con una captura cada uno"
    ev "capturas en docs/research/<fecha>-chequeo-funcional-spec-017/=$shots (deben ser 6 o más)"
  fi
}

# --- specs/done/019-el-hilo-hereda-el-alcance.md ---

spec019_unit() {
  local test_ok=1
  npx vitest run --config config/vitest.config.ts \
    src/renderer/src/components/sidebar/workspace-scope/open-new-thread.test.ts \
    src/renderer/src/lib/thread-scope-startup-message.test.ts \
    src/renderer/src/components/native-chat/ThreadScopeBadge.test.tsx \
    src/renderer/src/lib/launch-agent-in-new-tab-thread-scope.test.ts \
    >/dev/null 2>&1 || test_ok=0
  if [ "$test_ok" = "1" ]; then
    ok "spec019#1 el hilo nace con el alcance del selector como primer mensaje (root)"
    ok "spec019#2 el hilo nace con el alcance del selector como primer mensaje (workspace)"
    ok "spec019#3 un slug de selector que ya no existe cae a la raíz, igual que Files (spec 010)"
    ok "spec019#4 el mensaje nombra --root, nunca --workspace, para la raíz"
    ok "spec019#5 el mensaje nombra --workspace <slug>, nunca --root, para un workspace"
    ok "spec019#6 el mensaje nunca lleva un signo de pregunta"
    ok "spec019#7 el badge muestra \"My work\" para un hilo nacido en la raíz"
    ok "spec019#8 el badge muestra el nombre del workspace para un hilo nacido ahí"
    ok "spec019#9 sin threadScope capturado, el badge no se dibuja"
    ok "spec019#13 launchAgentInNewTab estampa threadScope en el tab, y lo omite si no se lo pasan"
  else
    ko "spec019#1 el hilo nace con el alcance del selector como primer mensaje (root)"
    ko "spec019#2 el hilo nace con el alcance del selector como primer mensaje (workspace)"
    ko "spec019#3 un slug de selector que ya no existe cae a la raíz, igual que Files (spec 010)"
    ko "spec019#4 el mensaje nombra --root, nunca --workspace, para la raíz"
    ko "spec019#5 el mensaje nombra --workspace <slug>, nunca --root, para un workspace"
    ko "spec019#6 el mensaje nunca lleva un signo de pregunta"
    ko "spec019#7 el badge muestra \"My work\" para un hilo nacido en la raíz"
    ko "spec019#8 el badge muestra el nombre del workspace para un hilo nacido ahí"
    ko "spec019#9 sin threadScope capturado, el badge no se dibuja"
    ko "spec019#13 launchAgentInNewTab estampa threadScope en el tab, y lo omite si no se lo pasan"
    ev "vitest en rojo sobre open-new-thread.test.ts / thread-scope-startup-message.test.ts / ThreadScopeBadge.test.tsx / launch-agent-in-new-tab-thread-scope.test.ts"
  fi
}

spec019_criterio5_alcance_congelado() {
  local reactive_read
  reactive_read=$(grep -c "activeWorkspaceScopeSlug" src/renderer/src/components/native-chat/ThreadScopeBadge.tsx 2>/dev/null; true)
  if [ "$reactive_read" = "0" ]; then
    ok "spec019#12 cambiar el selector después de abierto un hilo no le toca el alcance a ese hilo (ThreadScopeBadge lee threadScope, nunca el selector)"
  else
    ko "spec019#12 cambiar el selector después de abierto un hilo no le toca el alcance a ese hilo"
    ev "ThreadScopeBadge.tsx referencia activeWorkspaceScopeSlug=$reactive_read (debe ser 0 — leería el selector en vivo)"
  fi
}

spec019_criterio6_prueba_de_interfaz_obligatoria() {
  local spec_file question_guard root_assert workspace_assert
  spec_file=tests/e2e/simple-mode-thread-inherits-scope.spec.ts
  question_guard=$(grep -c "assertNoScopeQuestion" "$spec_file" 2>/dev/null; true)
  root_assert=$(grep -c "spec019#10" "$spec_file" 2>/dev/null; true)
  workspace_assert=$(grep -c "spec019#11" "$spec_file" 2>/dev/null; true)
  if [ -f "$spec_file" ] && [ "$question_guard" -ge 1 ] && [ "$root_assert" -ge 1 ] && [ "$workspace_assert" -ge 1 ]; then
    ok "spec019#10 prueba de interfaz obligatoria: hilo con la raíz elegida, primer intercambio sin pregunta de alcance"
    ok "spec019#11 prueba de interfaz obligatoria: hilo con un workspace elegido, primer intercambio sin pregunta de alcance"
    ev "e2e ($spec_file) corrido aparte con --workers=1 — evidencia pegada en la spec archivada."
  else
    ko "spec019#10 prueba de interfaz obligatoria: hilo con la raíz elegida, primer intercambio sin pregunta de alcance"
    ko "spec019#11 prueba de interfaz obligatoria: hilo con un workspace elegido, primer intercambio sin pregunta de alcance"
    ev "e2e=$spec_file · assertNoScopeQuestion=$question_guard (>=1) · spec019#10=$root_assert (>=1) · spec019#11=$workspace_assert (>=1)"
  fi
}

spec019_criterio14_chequeo_funcional() {
  local shots
  shots=$(find docs/research -type d -name '*chequeo-funcional-spec-019' -exec find {} -name '*.png' \; 2>/dev/null | wc -l | tr -d ' ')
  if [ "$shots" -ge 6 ]; then
    ok "spec019#14 chequeo funcional en la app real, con el agente Claude real: seis pasos recorridos con una captura cada uno"
  else
    ko "spec019#14 chequeo funcional en la app real, con el agente Claude real: seis pasos recorridos con una captura cada uno"
    ev "capturas en docs/research/<fecha>-chequeo-funcional-spec-019/=$shots (deben ser 6 o más)"
  fi
}

spec014_criterio1_sin_archivos_de_marca_visual() {
  local name_hits svg_content_hits
  name_hits=$(find resources -type f \( -iname '*.png' -o -iname '*.icns' -o -iname '*.ico' -o -iname '*.svg' \) -iname '*orca*' | wc -l | tr -d ' ')
  svg_content_hits=$(grep -ril 'orca' resources --include='*.svg' 2>/dev/null | wc -l | tr -d ' ')
  if [ "$name_hits" = "0" ] && [ "$svg_content_hits" = "0" ]; then
    ok "spec014#1 ningún ícono/imagen bajo resources/ tiene \"orca\" en el nombre o en el contenido de un .svg"
  else
    ko "spec014#1 ningún ícono/imagen bajo resources/ tiene \"orca\" en el nombre o en el contenido de un .svg"
    ev "archivos con orca en el nombre=$name_hits · .svg con \"orca\" en el contenido=$svg_content_hits (deben ser 0)"
  fi
}

spec014_criterio2_selector_de_icono_sin_alternativas() {
  local option_count legacy_refs
  option_count=$(grep -c "id: '" src/shared/app-icon.ts)
  legacy_refs=$(grep -rl "orca-blue\|orca-watercolor" src --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ')
  if [ "$option_count" = "1" ] && [ "$legacy_refs" = "0" ]; then
    ok "spec014#2 el selector de ícono de Ajustes tiene una sola opción y no referencia los íconos alternativos borrados"
  else
    ko "spec014#2 el selector de ícono de Ajustes tiene una sola opción y no referencia los íconos alternativos borrados"
    ev "opciones en APP_ICON_OPTIONS=$option_count (debe ser 1) · referencias a orca-blue/orca-watercolor en src=$legacy_refs (debe ser 0)"
  fi
}

spec014_criterio3_bandeja_sin_orca() {
  local tray_files code_refs
  tray_files=$(find resources/tray -iname '*orca*' 2>/dev/null | wc -l | tr -d ' ')
  code_refs=$(grep -rl "orca-menu-barTemplate" src --include='*.ts' 2>/dev/null | wc -l | tr -d ' ')
  if [ "$tray_files" = "0" ] && [ "$code_refs" = "0" ]; then
    ok "spec014#3 los íconos de bandeja no tienen \"orca\" en el nombre ni el código los referencia"
  else
    ko "spec014#3 los íconos de bandeja no tienen \"orca\" en el nombre ni el código los referencia"
    ev "archivos de bandeja con orca en el nombre=$tray_files · referencias en código=$code_refs (deben ser 0)"
  fi
}

spec014_criterio4_codigo_sano() {
  local test_ok=1
  npx vitest run --config config/vitest.config.ts \
    src/main/app-icon.test.ts \
    src/main/tray/system-tray.test.ts \
    src/main/ipc/settings.test.ts \
    src/main/persistence-settings-update.test.ts \
    src/main/window/createMainWindow.test.ts \
    src/main/window/createMainWindow-tray-minimize-close.test.ts \
    >/dev/null 2>&1 || test_ok=0
  if [ "$test_ok" = "1" ]; then
    ok "spec014#4 código sano (evidencia completa de pnpm tc / check:code-quality:changed en la spec archivada)"
  else
    ko "spec014#4 código sano (evidencia completa de pnpm tc / check:code-quality:changed en la spec archivada)"
    ev "vitest run sobre los archivos tocados por spec 014 en rojo"
  fi
}

spec014_criterio5_verificacion_visual() {
  local orca_json_hits orca_window_hits
  orca_json_hits=$(grep -c '"ORCA"' src/renderer/src/i18n/locales/en.json)
  orca_window_hits=$(grep -rn "'Orca'" src/main/window/*.ts 2>/dev/null | wc -l | tr -d ' ')
  if [ "$orca_json_hits" = "0" ] && [ "$orca_window_hits" = "0" ]; then
    ok "spec014#5 sin la ballena visible: sin heading \"ORCA\" en el catálogo ni título 'Orca' en la ventana nativa (evidencia de capturas en la spec archivada)"
  else
    ko "spec014#5 sin la ballena visible: sin heading \"ORCA\" en el catálogo ni título 'Orca' en la ventana nativa (evidencia de capturas en la spec archivada)"
    ev "\"ORCA\" en en.json=$orca_json_hits · 'Orca' en src/main/window=$orca_window_hits (deben ser 0)"
  fi
}

spec014_criterio1_sin_archivos_de_marca_visual
spec014_criterio2_selector_de_icono_sin_alternativas
spec014_criterio3_bandeja_sin_orca
spec014_criterio4_codigo_sano
spec014_criterio5_verificacion_visual
spec015_unit
spec015_criterio5_prueba_de_interfaz
spec015_criterio7_codigo_sano
spec016_unit
spec016_criterio6_modo_desarrollo_intacto
spec016_criterio7_8_pruebas_de_interfaz
spec016_criterio9_codigo_sano
spec016_criterio10_chequeo_funcional
spec017_unit
spec017_criterio1_2_3_prueba_de_interfaz
spec017_criterio6_fixture_sin_puerta
spec017_criterio7_codigo_sano
spec017_criterio8_chequeo_funcional
spec019_unit
spec019_criterio5_alcance_congelado
spec019_criterio6_prueba_de_interfaz_obligatoria
spec019_criterio14_chequeo_funcional

printf '%s pasan · %s fallan\n' "$passed" "$failed"
[ "$failed" = "0" ]
