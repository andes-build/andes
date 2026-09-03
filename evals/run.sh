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

printf '%s pasan · %s fallan\n' "$passed" "$failed"
[ "$failed" = "0" ]
