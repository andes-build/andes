---
status: pendiente
depends_on: []
---

# 004 · Sin oferta de Linear

Andes no trae Linear. La spec 001 borró sus skills pero la interfaz sigue ofreciendo instalarlos y
mostrando la guía, el aviso en la barra lateral y la configuración de Linear como fuente de tareas.
Todo eso deja de aparecer. El módulo `src/main/linear/` se queda porque el motor y SSH lo importan.

**Tipo**: residuals · **Flujo**: requirements-first

## Estado previo

`main` en `e76ce38ee6`. El agente corre `git log e76ce38ee6..main --stat` antes de empezar.

- Constantes del skill: `src/shared/agent-feature-install-commands.ts:9-11,126-134`
  (`ORCA_LINEAR_SKILL_NAME`, `LINEAR_AGENT_SKILL_NAMES`, `ORCA_LINEAR_SKILL_INSTALL_COMMAND`,
  `ORCA_LINEAR_SKILL_UPDATE_COMMAND`, `LINEAR_TICKETS_SKILL_UPDATE_COMMAND`). El comando de
  instalación apunta al repo remoto de Orca, por eso sigue "funcionando" aunque `skills/` no exista.
- Superficies que lo muestran: `src/renderer/src/components/settings/{LinearAgentSkillPane,LinearAgentSkillGuide,TaskSourceLinearSetup}.tsx`, `linear-agent-skill-install-cta.tsx`, `use-linear-agent-skill-setup.ts`, `linear-agent-skill-search.ts`, `linear-agent-skill-guide-content.ts`, `use-task-source-provider-readiness.ts`; en la barra lateral `LinearAgentSkillSetupPrompt.tsx`, `linear-agent-skill-setup-reminders.ts`, `linear-agent-skill-setup-reminder-toast.ts`; en `lib/` `agent-skill-nav-install-status.ts`, `linear-board-drag-payload.ts`.
- La sección `linear` de Ajustes solo aparece con `isLinearConnected` (`settings-navigation-capability-sections.ts:77-80`); la conexión se hace desde Integraciones y Fuentes de tareas.
- El estado "instalado" se lee del disco del usuario (`useInstalledAgentSkills.ts`), no del repo.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | No queda referencia a los skills de Linear en el código | `grep -rn 'orca-linear\|linear-tickets\|LINEAR_AGENT_SKILL\|ORCA_LINEAR_SKILL' src --include='*.ts' --include='*.tsx'` devuelve 0 líneas |
| 2 | Linear no se ofrece en ninguna superficie: no hay sección `linear` en la navegación de Ajustes aunque haya una cuenta conectada, no aparece en Integraciones ni en Fuentes de tareas, y la barra lateral no muestra el aviso ni el recordatorio | Test unitario de los constructores de navegación con `isLinearConnected: true`: la lista no contiene `linear`; test de componente de Integraciones y de Fuentes de tareas: sin fila Linear; e2e: `getByText(/linear/i)` en Ajustes → `toHaveCount(0)` |
| 3 | `src/main/linear/`, `src/shared/linear/` y `src/main/ssh/ssh-remote-linear-*.ts` no se tocan | `git diff --stat main..HEAD -- src/main/linear src/shared/linear src/main/ssh` vacío |
| 4 | Ninguna cadena de idioma huérfana: las claves de los textos borrados salen del catálogo | `pnpm run verify:localization-catalog` y `verify:localization-extraction` en verde |
| 5 | El código sigue sano | `pnpm tc` · `pnpm test` · `pnpm run check:code-quality:changed` en verde |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter y Maxi Delgado (2026-09-02): Linear no se trae.
- DECIDIDO por Peter (Gate 1, 2026-09-02): "por ahora no ofrecería Linear, saquemos las
  referencias de la interfaz" — Linear no se ofrece en ningún modo.

**Delegadas al agente, con criterio**

- Borrar los componentes de Linear del renderer o dejarlos sin punto de entrada. Criterio: se
  borran los que ningún otro componente importa; si algo compartido los importa (por ejemplo, el
  drag de tarjetas de tablero), se recorta la parte de Linear y se conserva el resto.
- Qué hacer con el tipo de fuente de tareas `linear` en el estado persistido de un usuario que la
  tenía configurada. Criterio: se ignora al cargar sin romper ni borrar el resto de sus ajustes.

**Condiciones de parada**

- Si quitar la fuente de tareas Linear exige cambiar `src/main/linear/` o el flujo de OAuth que
  vive ahí, para y pregunta: el módulo no se toca.
- Si un test de `src/main/ssh/` depende de la UI de Linear, para y pregunta.

## Efectos que escapan del sistema

Ninguno.

## Fuera de alcance, con condición de reactivación

- Borrar `src/main/linear/` y `src/shared/linear/`: se reactiva cuando el motor y SSH dejen de
  importarlos, o cuando exista el nivel Team con servidor y se decida qué integraciones viajan.
- GitHub y GitLab como fuentes de tareas: se quedan; son parte del modo developer (spec 002).
