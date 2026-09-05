# Chequeo funcional — spec 023 · 2026-09-05

Contra el binario real (`claude` 2.1.261), perfil propio: `ORCA_DEV_USER_DATA_PATH` aislado
(`/tmp/andes-spec023-dev-userdata`) para no chocar con otras instancias de Electron corriendo en
la misma máquina, y el entorno `CLAUDE*`/`ANTHROPIC*` desarmado antes de lanzar `pnpm dev` — la
sesión que lo lanzó es en sí misma una sesión de Claude Code, y heredar
`CLAUDE_CODE_CHILD_SESSION=1` apaga el guardado del transcripto (hallazgo del criterio 1,
`docs/research/2026-09-04-de-donde-sale-el-titulo-del-hilo/`). Carpeta de prueba descartable:
`/tmp/andes-spec023-check` (git init limpio).

## Pasos

1. **`01-proyecto-agregado.png`** — la carpeta descartable agregada como proyecto, alcance "My
   work" (root).
2. **`02-hilo-nuevo-sin-alcance-dibujado.png`** — "New thread" recién abierto, la pregunta
   ("What is the capital of France?") enviada. La conversación no dibuja el mensaje de alcance en
   ningún lado — antes de esta spec, esa era la primera línea del hilo.
3. **`03-terminal-comando-real-con-append-system-prompt.png`** — la misma sesión en vista terminal:
   el comando real que corrió es
   `claude '--permission-mode' 'manual' '--append-system-prompt' 'This thread'"'"'s scope is
   already chosen: my own work, the root — not a workspace. ...'` — el alcance viaja en el flag, no
   en el primer turno, y Claude ya contestó "París." a la pregunta real.
4. **`04-titulo-cabecera-capital-of-france.png`** — la cabecera del hilo pasó de "New thread" a
   **"Capital of France"**. Confirmado también contra el store:
   `tab.aiVaultTitle.explicitTitle === "Capital of France"`.

## Lo que no se repitió contra Claude real

El alcance de workspace (`--workspace <slug>`) corre el mismo código sin rama especial para root —
`buildThreadScopeStartupMessage` arma los dos casos con la misma función, y
`resolveSimpleModeThreadAgentArgs`/`open-new-thread.ts` no distinguen kind. Verificado con test
unitario (`open-new-thread.test.ts`, "a workspace scope rides the same way — no root-specific
branch") en vez de gastar otra corrida de cuota real: el mecanismo es idéntico, solo cambia el
texto interpolado.
