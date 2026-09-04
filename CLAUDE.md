# Andes

El cuerpo de una iniciativa: las specs, las decisiones y el as-built de lo que se construye acá.
La cabeza —para qué es y en qué estado está— vive en el brain que montó este repo. Este repo se
lee solo: nada de acá asume que el brain esté al alcance.

## Dónde está cada cosa

| Pregunta | Dónde | Ciclo de vida |
|---|---|---|
| Cómo está construido | `ARCHITECTURE.md` (el as-built) | Vivo, se pisa |
| Qué falta | `specs/` (+ `done/`) | Transitorio |
| Qué se decidió y por qué | `decisions.md` | **Append-only**, nunca se corrige |
| Qué aprendimos | `learnings/` | Vivo: se actualiza o se borra |
| Qué se rompió, y por qué | `docs/postmortems/` | Fechado, no se pisa |
| Evidencia de investigación | `docs/research/` | Fechada, no se pisa |
| El chequeo de cada criterio | `evals/run.sh` | Vivo: un chequeo por criterio |

## Gates

- **Gate 1**: ninguna implementación arranca sin spec aprobada.
- **Gate 2**: el merge lo hace una persona. Los agentes trabajan en ramas, nunca pushean a `main`
  ni mergean: `.claude/settings.json` les niega los dos comandos.
- El PR lleva la evidencia de los evals. El que lo revisa no reporta nada que no pueda citar
  textualmente con `archivo:línea`, ni nada sin nombrar qué se rompe.

## Paralelizar el trabajo

📌 Peter, 2026-09-04. El trabajo se reparte entre **varios agentes al mismo tiempo**, no de a uno.

- **Se paraleliza por superficie, no por defecto.** Dos specs van en paralelo cuando tocan archivos
  distintos. Tres defectos de la misma pantalla son **una** spec: partirlos crea tres ramas peleando
  por los mismos archivos, y resolver esos conflictos cuesta más que el trabajo.
- **Un agente por worktree, siempre.** El worktree lo crea quien delega, con su rama, antes de
  largar al agente.
- **Cada agente corre solo las pruebas de lo suyo.** La suite completa tarda catorce minutos y la
  corre una sola vez quien mergea, en el Gate 2. Un agente que corre la suite entera para verificar
  un cambio de una pantalla desperdicia el paralelismo que lo trajo.
- **Ningún agente se duerme esperando.** Si tiene que correr algo largo, lo corre y espera el
  resultado en la misma vuelta. Un agente detenido esperando un monitor no está trabajando, y quien
  lo delegó no se entera: el 2026-09-04 esto pasó cuatro veces y fue lo que más demoró el día.
- **Cada agente usa su propio perfil para el chequeo en la app real**, para que dos instancias de
  Electron no choquen en la misma máquina.
- **Los merges son de a uno y los hace la persona.** Quien mergea segundo trae `main` a su rama y
  resuelve el conflicto ahí, nunca en `main`.
- **Antes de relanzar un agente hay que matarlo explícitamente.** Que su aviso diga "terminó" no
  quiere decir que esté muerto: puede estar dormido esperando. Dos agentes vivos sobre el mismo
  worktree es el peor accidente del sistema y el 2026-09-04 ocurrió dos veces.

## Definition of Done

- Los criterios de la spec pasan sus evals, con la evidencia registrada. Afirmar sin evidencia no
  es done.
- Sin regresión del camino crítico.
- Sin código de intentos abandonados en el diff.
- Sin secretos en código, docs ni commits.
- `ARCHITECTURE.md` actualizado si cambió; decisiones nuevas en `decisions.md`; lo que sirva para
  la próxima vez, en `learnings/`.
- Spec archivada en `specs/done/`. Listo para PEDIR el merge — nunca autónomo.
- **Chequeo funcional en la app real.** Ninguna rama que toque la interfaz se declara terminada sin
  levantar la aplicación y recorrer el camino completo como lo haría una persona, con una captura
  por paso guardada en `docs/research/` y pegada en la Evidencia. Los chequeos automáticos no
  alcanzan: tres fallos visibles llegaron al operador con todo en verde (2026-09-03). Se hace con
  el servidor de control de pantalla o con una prueba de interfaz que guarde capturas.

## Cómo se escribe

**El lector primario de estos documentos es un agente en otra sesión, sin nada de la conversación
que los produjo.**

1. **Cada regla se enuncia en un solo lugar.** Los demás documentos la referencian por ruta.
2. **Los números y los chequeos van aislados**, nunca embebidos en una oración.
3. **Sin conectores narrativos**: no instruyen y ocupan contexto.

Una decisión tiene cuatro campos y ninguno más:

```
## FECHA · [ámbito] Título que enuncia la regla, no el tema

**Qué se decide**: una o dos líneas. La regla, sin argumento.
**Por qué**: un párrafo. Uno.
**Reemplaza a**: solo si aplica, nombrando la decisión anterior.
**La invalidaría**: la condición que la haría falsa.
```

Nombres de archivo, comandos y código en inglés. La regla del idioma del producto se enuncia una
sola vez, en la constitución del repo del producto que publica `.os/core` —`CLAUDE.md` en su
raíz— y no se repite acá.

## Idioma de la interfaz

Todo texto nuevo de la interfaz va solo al catálogo inglés (`src/renderer/src/i18n/locales/en.json`)
hasta que se reabra la traducción — ver `specs/done/008-un-solo-idioma.md`.

## Gotchas

<!-- Lo que hace tropezar y no se deduce abriendo un archivo va acá, una línea cada cosa. Lo que
     un `ls` ya contesta, no. -->

- `evals/run.sh` llama scripts de `pnpm`: sin `pnpm install` en el checkout, los criterios que los
  usan fallan aunque el código esté bien (pasó en el Gate 2 de la spec 001, 2026-09-02).
- `ORCA_DEV_USER_DATA_PATH` con una ruta larga rompe el arranque de `pnpm dev`: el daemon local
  escucha en un socket Unix bajo esa carpeta, y macOS limita esas rutas a ~104 caracteres. Síntoma:
  modal "Andes couldn't start its local command transport" con `listen EINVAL`. Usar una ruta corta
  (`/tmp/<algo-corto>`), nunca un directorio de scratchpad de sesión (spec 019, 2026-09-04).
- Dos instancias de desarrollo comparten `build.andes.dev` como identificador de paquete: nunca
  activar la ventana propia con clics o `System Events` durante un chequeo funcional — puede robarle
  el foco a la ventana de otra persona sin que las herramientas lo distingan. Manejar la instancia
  propia solo por su puerto de depuración (`chromium.connectOverCDP`), y cerrarla apenas termine el
  chequeo (spec 019, 2026-09-04).

## Convenciones de código heredadas de Orca

El código es el de Orca y sus convenciones siguen valiendo para todo lo que se escriba acá:

@AGENTS.md
