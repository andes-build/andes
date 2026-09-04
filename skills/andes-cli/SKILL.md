---
name: andes-cli
description: >-
  Use the public `andes` CLI to operate Andes-managed worktrees, folder contexts,
  terminals, repos, automations, artifacts, skill sharing, worktree comments, and the browser
  embedded inside the Andes app. Use when the user says "$andes-cli", "use andes cli",
  "Andes worktree", "child worktree", "cardStatus", "spawn codex/claude in a worktree",
  "read/wait/send Andes terminal", "terminal send", "full handoff", "handover",
  "give this to another agent", "another worktree", "Andes browser", "andes artifacts",
  "share HTML/Markdown", "public artifact link", "share skills", or "control the browser inside
  Andes". Prefer this over raw `git worktree`, ad hoc
  PTYs, Playwright, or Computer Use when the task touches Andes-managed state.
  Use Computer Use for external browser windows, webviews, or desktop UI only
  when the task requires OS/window-level control such as focus, menus, dialogs,
  coordinates, or screenshots. Use `andes-cli` for Andes's embedded pages and a
  page-automation tool such as Playwright or CDP for external pages.
---

# Andes CLI

This file is a discovery stub, not the usage guide. The full, version-matched Andes CLI
reference is served by the `andes` binary itself — kept out of this file on purpose so it
can never drift from the binary that will actually run your commands.

Engage Andes whenever its running editor/runtime is the source of truth: Andes-managed
worktrees, folder contexts, terminals, repos, automations, worktree comments, and the
browser embedded inside the Andes app. Triggers include "$andes-cli", "Andes worktree",
"child worktree", "spawn codex/claude in a worktree", "read/wait/send Andes terminal",
"full handoff" / "handover" / "give this to another agent", and "control the browser
inside Andes". Use plain shell tools when Andes state does not matter.

## Resolve the CLI for this session

Choose the executable once and reuse it for every later command:

- If the `ORCA_CLI_COMMAND` environment variable is set, use its value. Andes exports this
  for managed WSL sessions.
- Otherwise, in a dev checkout whose session exposes `ORCA_DEV_REPO_ROOT`, use `andes-dev`.
- Otherwise, on Linux outside an Andes-managed terminal, use `orca-ide`. Never run bare
  `andes` there — outside Andes's terminals it normally resolves to the
  GNOME Orca screen reader (`/usr/bin/orca`) and starts speech on the user's machine.
- Otherwise, use `andes`.

Below, `ANDES` is a placeholder for the executable you resolved. Substitute it before
running anything; do not create a shell variable or run `ANDES` literally. This works the
same way in POSIX shells, PowerShell, and cmd.exe.

If the selected executable cannot run, report its exact error and stop. Do not fall through
to another executable, which could silently target a different Andes build.

## Load the full guide before running Andes commands

```text
ANDES skills get andes-cli
```

That prints the complete, version-matched guide for the exact binary that will handle your
next commands — worktrees, handoffs, terminals, automations, and the built-in browser.
Read it first, then run the specific command you need.

Don't guess subcommands or flags from memory or from a cached copy of this stub. They
change between Andes releases, and this file deliberately no longer lists them. Confirm the
app is up with `ANDES status --json` (start it with `ANDES open --json` if needed), and
prefer `--json` for agent-driven calls.

## If an older Andes does not recognize `skills get`

Use this fallback only when the selected binary explicitly reports that `skills get` is an
unknown command. Another failure is not proof of an older binary; report it rather than
guessing or changing executables. For a confirmed pre-guide binary, use only this bounded,
read-only bootstrap to orient. Do not dead-end and do not invent commands:

```text
ANDES status --json
ANDES worktree ps --json
ANDES terminal list --json
```

Then tell the user that updating Andes restores the full, version-matched guide via
`ANDES skills get andes-cli`. Beyond these commands, ask the user rather than guessing a
command surface this older binary may not support.
