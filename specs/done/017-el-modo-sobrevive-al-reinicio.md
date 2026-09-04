---
status: implementada
depends_on: [002, 010]
---

# 017 · El modo sobrevive al reinicio

El modo de interfaz elegido tiene que seguir puesto la próxima vez que se abre la aplicación. La
preferencia se guardaba bien, pero la variable de entorno que abre el modo desarrollo se escribía
en disco junto con ella: una sola arrancada con la puerta abierta convertía el perfil a `developer`
para siempre.

**Tipo**: fallo · **Flujo**: diagnóstico primero

## Estado previo

`main` en `f3fd4ffef5`. Reportado por Peter y por el agente de la spec 010, que dejó
`tests/e2e/simple-mode-survives-restart-with-project.spec.ts` en `test.fixme` con el diagnóstico sin
cerrar.

## Causa

Son dos, y ninguna de las dos es la que el `fixme` señalaba.

### Causa 1 — la variable de entorno se escribía en disco

📌 `src/main/persistence/loading-store/normalize-loaded-global-settings.ts:119-120` (en
`f3fd4ffef5`):

```
interfaceMode:
  readInterfaceModeFromEnv() ?? normalizeInterfaceMode(parsed.settings?.interfaceMode),
```

El valor de `ANDES_INTERFACE_MODE` entra a `state.settings.interfaceMode` como si fuera la
preferencia del operador. 📌 `src/main/persistence/loading-store/state-serialization-secret-handling.ts:90-91`
serializa el objeto entero de settings sin excluir nada, así que la primera vez que se guarda
cualquier ajuste —y se guarda solo, por la normalización de la carga— el valor superpuesto queda
escrito. **La puerta escondida deja de ser una superposición de arranque y pasa a ser una
conversión permanente del perfil**: la arrancada siguiente, ya sin la variable, lee `developer` de
disco.

Reproducido en `src/main/persistence-interface-mode-restart.test.ts`: con `simple` en disco y
`ANDES_INTERFACE_MODE=developer`, un `updateSettings({ theme: 'dark' })` seguido de `flushOrThrow()`
dejaba `"interfaceMode": "developer"` en el archivo.

### Causa 2 — la prueba en `fixme` no podía pasar nunca

📌 `tests/e2e/helpers/orca-restart.ts:183` (en `f3fd4ffef5`): `createRestartSession` fijaba
`ANDES_INTERFACE_MODE: 'developer'` en el `env` de las **dos** arrancadas. La prueba declaraba en su
comentario "acá no se pone la variable, ese es el punto", pero el fixture la ponía por ella: la
segunda arrancada leía `developer` de la variable, no del disco. La prueba medía el fixture.

El diagnóstico anterior también miró el archivo equivocado: leyó
`<userDataDir>/orca-data.json` cuando el estado de un perfil vive en
`<userDataDir>/profiles/<id>/orca-data.json`. De ahí la conclusión de que la preferencia "no se
escribía": sí se escribía, en otro archivo.

## Decisión

**La variable de entorno es una superposición de arranque y nunca llega al disco.**

`state.settings.interfaceMode` sigue teniendo el valor efectivo —ningún lector cambia—, y el
serializador escribe el valor persistido, que el `StoreRuntimeState` recuerda desde la carga
(`persistedInterfaceMode`). Una escritura explícita del operador —el Option-clic— actualiza ese
valor y sí llega al disco, aunque la variable esté puesta.

Alternativas descartadas, en `decisions.md`.

## Criterios

| # | Criterio | Chequeo |
|---|---|---|
| 1 | Abrir la app, cambiar el modo, cerrarla del todo y volver a abrirla deja el modo tal como estaba, en las dos direcciones | e2e `tests/e2e/interface-mode-survives-restart.spec.ts` (prueba 1) + chequeo funcional |
| 2 | Con un proyecto real adjunto el resultado es el mismo | misma prueba: adjunta el repo sembrado antes del primer cierre |
| 3 | La barra lateral del modo simple es la que aparece tras el reinicio, no la de Orca | misma prueba: `simple-mode-nav` visible, sin "Attached worktrees" ni "New worktree" |
| 4 | Una arrancada con `ANDES_INTERFACE_MODE=developer` no convierte la preferencia guardada | e2e (prueba 2) + `src/main/persistence-interface-mode-restart.test.ts` |
| 5 | Una elección explícita hecha con la variable puesta sí se guarda | `src/main/persistence-interface-mode-restart.test.ts` |
| 6 | El fixture de reinicio puede correr sin la puerta de entorno | `RestartSessionOptions.interfaceModeEnvDoor` en `tests/e2e/helpers/orca-restart.ts` |
| 7 | Código sano | `pnpm tc`, `check:code-quality:changed` |
| 8 | Chequeo funcional en la app real | seis capturas en `docs/research/2026-09-04-chequeo-funcional-spec-017/` |

## Evidencia

### La prueba muerde

Con la línea del serializador vuelta al valor de `main`
(`interfaceMode: this.runtime.state.settings.interfaceMode`) y el resto del arreglo en su lugar:

```
  1 failed
    tests/e2e/interface-mode-survives-restart.spec.ts:87 › a launch with
    ANDES_INTERFACE_MODE=developer does not convert the stored preference (criterion 4)
  1 passed (33.8s)
```

Con el arreglo completo: `2 passed (26.9s)`.

### Unidad

`npx vitest run src/main/persistence-interface-mode-restart.test.ts`: 5 pasan.

`npx vitest run src/main/persistence src/main/persistence-settings-update.test.ts
src/main/persistence-settings-ui-defaults.test.ts src/shared/interface-mode.test.ts
src/main/quit-path-durable-write-blocking.test.ts`: 884 pasan · 1 salteada · 0 fallan.

### Código sano

`pnpm tc`: en verde.

`pnpm run check:code-quality:changed`: `Changed-code quality gate passed since f3fd4ffef5ac` — 0
hallazgos nuevos en los 3 chequeos, sobre 8 archivos.

`bash evals/run.sh`: **105 pasan · 0 fallan**.

### Chequeo funcional en la app real

App levantada desde el worktree con `pnpm dev`, perfil propio (`ORCA_DEV_USER_DATA_PATH=/tmp/s017`)
y puerto de depuración propio (`127.0.0.1:9444`), para no tocar la ventana que Peter tiene abierta
desde `andes-mirar` — los dos builds de desarrollo comparten identificador de paquete. Los scripts
auxiliares no quedaron en el repo.

| Paso | Captura | Resultado |
|---|---|---|
| 1 | `01-primer-arranque-modo-simple.png` | perfil nuevo: modo simple |
| 2 | `02-cambio-a-modo-desarrollo.png` | modo desarrollo, barra de Orca (Search, Tasks, Automations, Projects) |
| 3 | `03-segundo-arranque-sigue-en-modo-desarrollo.png` | app cerrada del todo y reabierta: sigue en desarrollo |
| 4 | `04-option-clic-en-advanced-vuelve-a-modo-simple.png` | Option-clic en el título de Ajustes → Advanced |
| 5 | `05-modo-simple-aplicado-en-caliente.png` | barra del modo simple sin recargar |
| 6 | `06-tercer-arranque-sigue-en-modo-simple.png` | app cerrada del todo y reabierta: sigue en simple |

Entre el paso 3 y el 6 el archivo `/tmp/s017/profiles/local-default/orca-data.json` pasó de
`"interfaceMode": "developer"` a `"simple"`, leído con la app cerrada las dos veces.

## Pendientes que esta spec no cierra

- **`ANDES_INTERFACE_MODE=developer` no abre el modo desarrollo en la app de desarrollo de esta
  máquina.** El proceso principal recibe la variable (verificado con `ps eww` sobre el proceso de
  Electron), pero `settings.interfaceMode` sale `simple`. Es el gap pre-existente que la spec 005
  ya había registrado (`decisions.md`, 2026-09-03, "Gap conocido pre-existente"), reproducido acá
  otra vez y todavía sin causa. **Consecuencia para esta spec**: el criterio 4 se prueba con el e2e
  —donde la puerta sí funciona— y no con el chequeo funcional. Es un defecto de la puerta, no de la
  persistencia.
- **El síntoma exacto que Peter describió no se reprodujo en la app real de esta máquina.** Lo que
  se reprodujo, y se arregló, es el defecto de fondo: la variable escribiéndose en disco. Si el
  modo vuelve a saltar a desarrollo sin que nadie lo toque, el sospechoso siguiente es el pendiente
  de arriba.
