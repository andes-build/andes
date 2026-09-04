# Sacar el flag de omisión de permisos no hace aparecer la tarjeta

**Cuándo aplica**: cuando un criterio dice que el agente "pide permiso" o que aparece la tarjeta de
permitir/rechazar.

El pedido de permiso lo decide el modo de permisos del CLI, no la ausencia de un flag. Claude Code
2.1.260 lanzado sin ningún argumento corre en modo `auto` y escribe archivos sin preguntar; la
tarjeta aparece con `--permission-mode manual`. Los valores que acepta hoy son `acceptEdits`,
`auto`, `bypassPermissions`, `manual`, `dontAsk` y `plan`.

Consecuencia práctica: un chequeo de "no pasa `--dangerously-skip-permissions`" es necesario y no
suficiente. El chequeo que vale es pedirle al agente algo que requiera permiso y ver la tarjeta.

**Cómo se descubrió**: en el chequeo funcional de la spec 016, con el comando ya limpio
(`agentArgs: ""`), el agente escribió `/tmp/spec016-permiso.txt` sin preguntar. Ninguna prueba
automática lo veía: todas afirmaban sobre el comando, no sobre el permiso.

**Antes de copiar el argumento a otro agente**: verificarlo contra su propio `--help`. `codex`,
`grok` y `omp` tienen conversación en Andes y su modo por omisión no está verificado — por eso
`ASK_PERMISSION_TUI_AGENT_ARGS` (`src/shared/tui-agent-permissions.ts`) solo declara `claude` y
`openclaude`.
