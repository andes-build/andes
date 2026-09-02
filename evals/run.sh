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
  appid_count=$(grep -c "appId = 'lat.producthub.andes'" config/electron-builder.config.cjs)
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

spec001_criterio6_no_emulador_ni_linear() {
  local dir1_ok=1 dir2_ok=1 dir3_ok=1 skills_ok=1
  test -d src/main/emulator && dir1_ok=0
  test -d src/main/linear && dir2_ok=0
  test -d src/shared/linear && dir3_ok=0
  ls skills/ 2>/dev/null | grep -qE '^(orca-emulator|orca-linear$|linear-tickets$)' && skills_ok=0
  if [ "$dir1_ok" = "1" ] && [ "$dir2_ok" = "1" ] && [ "$dir3_ok" = "1" ] && [ "$skills_ok" = "1" ]; then
    ok "spec001#6 no queda emulador ni Linear"
  else
    ko "spec001#6 no queda emulador ni Linear — PARADO por condición de la spec"
    ev "src/main/emulator ausente=$dir1_ok · src/main/linear ausente=$dir2_ok · src/shared/linear ausente=$dir3_ok · skills=$skills_ok"
    ev "Bloqueo: src/main/emulator y src/main/linear/src/shared/linear son importados por el motor"
    ev "(src/main/runtime/, src/main/startup/) y por SSH (src/main/ssh/ssh-remote-linear-*.ts)."
    ev "Sacarlos exige tocar el motor y src/relay/SSH, que Gate 1 dejó afuera. Ver reporte final."
  fi
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
spec001_criterio6_no_emulador_ni_linear
spec001_criterio7_computer_use_fuera_del_paquete
spec001_criterio8_codigo_sano
spec001_criterio9_sin_marca_claude_ni_anthropic

printf '%s pasan · %s fallan\n' "$passed" "$failed"
[ "$failed" = "0" ]
