---
status: implementada
depends_on: []
---

# 024 · Los archivos markdown se editan, con la experiencia de Obsidian

Hoy la pantalla de archivos deja ver los archivos del workspace pero no editarlos. Esta spec los
hace editables con la experiencia de Obsidian: se escribe sobre el texto ya formateado, no sobre
código, y se guarda solo.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `da55c96187`. El agente corre `git log da55c96187..main --stat` antes de empezar.

- La pantalla de archivos la trajo la spec 010 y se llega desde `SimpleModeNav.tsx`. Muestra los
  archivos del alcance elegido, nunca el cerebro entero.
- **Ya existe un editor de markdown enriquecido en el repo**, heredado de Orca:
  `src/renderer/src/assets/rich-markdown-editor.css` y su uso en
  `src/renderer/src/components/LinearIssueMarkdownDescriptionEditor.tsx`, con su preferencia de
  corrector en `src/renderer/src/components/settings/RichMarkdownSpellcheckSetting.tsx`.
  **Se reusa; no se trae una dependencia nueva sin justificarlo contra un criterio.**
- ❓ El agente ubica el componente exacto de la pantalla de archivos antes de tocar nada: no está
  escrito acá porque cambió con la 010 y la 013.

## Qué significa "la experiencia de Obsidian"

Peter la nombró por oposición: **no la de Orca ni la de un IDE.** En concreto, y esto es el criterio
de diseño de la spec:

- Se escribe **sobre el documento formateado**, no sobre el código fuente del markdown. Un título se
  ve como título mientras se escribe.
- **No hay botón de guardar.** Se guarda solo, y la pantalla lo dice sin pedir nada.
- **No hay panel de código, ni número de línea, ni resaltado de sintaxis, ni pestañas de editor.**
- El texto ocupa una columna cómoda de leer, no todo el ancho de la ventana.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | Un archivo markdown del alcance se abre y se edita en la misma pantalla | e2e: abrir Files, elegir un `.md`, escribir, y el texto queda |
| 2 | Se escribe sobre el texto formateado | Test de componente: al escribir `## Título` el editor muestra un encabezado, no la marca literal; e2e verifica el nodo |
| 3 | Se guarda solo, sin botón, y la pantalla lo dice | e2e: escribir, esperar, cerrar y reabrir el archivo — el cambio está en el disco. No existe ningún botón de guardar en el árbol |
| 4 | Nada de vocabulario de IDE: sin números de línea, sin resaltado de sintaxis, sin panel de código, sin pestañas | Test de componente sobre el árbol renderizado; eval sobre el catálogo inglés de esa pantalla |
| 5 | Solo se editan archivos del alcance elegido | Test unitario: una ruta fuera del alcance se rechaza. Es la misma regla de la spec 010 |
| 6 | Un archivo que no es markdown no se rompe | Test de componente: se sigue viendo como hoy, sin ofrecer edición |
| 7 | El archivo abierto que cambia en el disco no pierde lo que la persona escribió | Test unitario del caso de conflicto; la spec declara qué gana y por qué |
| 8 | El modo desarrollo no cambia | e2e en modo desarrollo |
| 9 | Código sano | `pnpm tc` · `check:code-quality:changed` · `verify:localization-*` y los tests nuevos en verde |
| 10 | Chequeo funcional en la app real | Recorrido completo —abrir, escribir, salir, volver— con una captura por paso |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (2026-09-04): la experiencia es la de Obsidian, no la de Orca ni la de un IDE,
  con el detalle de arriba. El motivo que dio: es más amable para quien no programa.
- DECIDIDO por Peter (2026-09-03, spec 010): los archivos se ven por alcance, nunca el cerebro
  entero. Editar no cambia eso.

**Delegadas al agente, con criterio**

- Cada cuánto se guarda. Criterio: que la persona nunca pierda lo escrito y que no se escriba el
  disco en cada tecla.
- Qué gana si el archivo cambió afuera. Criterio: nunca se pierde lo que la persona escribió sin
  que ella lo sepa.

**Condiciones de parada**

- Si reusar el editor heredado obliga a arrastrar superficie de Orca que la spec 002 esconde, para y
  pregunta antes de traerla.
- Si editar exige permisos de escritura que hoy la app no tiene sobre esa carpeta, para y pregunta.

## Efectos que escapan del sistema

**Sí: escribe archivos en el disco de la persona**, dentro del alcance elegido. Contención: solo
archivos ya existentes dentro del alcance, nunca fuera, y las pruebas corren sobre una carpeta
temporal, nunca sobre el cerebro real de Peter.

## Fuera de alcance, con condición de reactivación

- Crear archivos nuevos y borrar: se reactiva cuando alguien lo pida.
- Los enlaces entre documentos al estilo de Obsidian: spec propia si aparece la necesidad.

## Evidencia

Rama `spec-024-markdown-editable`, worktree
`/Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-024`, sobre `main` en `5c183b2e7c`.
Ninguna prueba corrió sobre el cerebro real: la de interfaz escribe en el repositorio temporal de
`os.tmpdir()` que arma `tests/e2e/global-setup.ts`, y el chequeo funcional arma su propia carpeta
en `/tmp` y la borra al terminar.

### Cómo quedó la experiencia

Reusa el editor heredado de Orca —Tiptap con `createRichMarkdownExtensions`,
`encodeRawMarkdownHtmlForRichEditor` y `createRichMarkdownEditorCodec`— **sin ninguna dependencia
nueva** y sin montar nada del chrome de Orca (barra de herramientas, riel de revisión, panel de
índice, superficie de edición completa): ese chrome son componentes, no extensiones, así que no
montarlos alcanza y la condición de parada de la spec —arrastrar superficie que la spec 002
esconde— nunca se activó. Detalle en `ARCHITECTURE.md`, "Los documentos markdown se editan".

### `evals/run.sh` — 168/168 en verde (158 de specs anteriores sin cambios + 10 de esta spec)

```
PASS spec024#1 un archivo markdown del alcance se abre y se edita en la misma pantalla
PASS spec024#2 se escribe sobre el texto formateado: tecleando ## sale un encabezado, no la marca literal
PASS spec024#3 se guarda solo, sin botón, y la pantalla lo dice
PASS spec024#4 nada de vocabulario de IDE: sin números de línea, resaltado, panel de código ni pestañas; el texto va en una columna cómoda
PASS spec024#5 solo se editan archivos del alcance elegido: una ruta de afuera se rechaza
PASS spec024#6 un archivo que no es markdown se sigue viendo como hoy, sin ofrecer edición
PASS spec024#7 el archivo que cambió en el disco no pierde lo que la persona escribió: gana su texto y la pantalla lo dice (decisions.md, 2026-09-04)
PASS spec024#8 el modo desarrollo no cambia
PASS spec024#9 código sano (pnpm tc · calidad de lo cambiado · verify:localization-* y los tests nuevos en verde)
PASS spec024#10 chequeo funcional en la app real: abrir, escribir, salir y volver, con una captura por paso
168 pasan · 0 fallan
```

Corrido tres veces. La segunda corrida dio 167/1 porque se solapó con el archivado de esta misma
spec —el archivo se movió a `specs/done/` mientras la suite lo leía—; la tercera, sobre el árbol
ya quieto, volvió a dar 168/0 sin ningún FAIL.

### Criterio 1 · se abre y se edita

e2e `tests/e2e/simple-mode-files-editing.spec.ts`, prueba "a document opens for writing and what is
typed is saved by itself": elige el workspace, abre Files, hace clic en `Decisions`, escribe, y lo
escrito llega al archivo real del disco.

```
✓ 1 simple-mode-files-editing.spec.ts:53 › a document opens for writing and what is typed is saved by itself (criteria 1, 3) (15.8s)
✓ 2 simple-mode-files-editing.spec.ts:86 › the screen has no save button and no editor tabs (criteria 3, 4) (13.9s)
✓ 3 simple-mode-files-editing.spec.ts:109 › developer mode still shows its own shell, not the Files screen (13.2s)
  3 passed (44.8s)
```

### Criterio 2 · se escribe sobre el texto formateado

`src/renderer/src/components/files/WorkspaceMarkdownEditor.test.tsx`: teclea `## Written now`
carácter por carácter a través de `handleTextInput` —el mismo camino que usa un teclado— sobre el
conjunto de extensiones que monta la pantalla, y el resultado es un `<h2>` con el texto
`Written now`, sin `##` en ningún lado del árbol; el markdown que sale sigue siendo `## Written
now`. La otra prueba abre `## Decisions` y verifica lo mismo al abrir. En la app real es la captura
`07-el-titulo-se-ve-como-titulo.png`.

### Criterio 3 · se guarda solo, sin botón, y la pantalla lo dice

`use-workspace-file-autosave.test.ts` (5 pruebas): tres teclas seguidas son **una** escritura y
recién después de la pausa; irse del archivo escribe lo pendiente en el archivo que estaba abierto,
no en el nuevo; un fallo de escritura se reporta en vez de decir que guardó. `WorkspaceFileViewer.
test.tsx` verifica que no hay ningún botón cuyo texto o etiqueta diga "save" y que la pantalla dice
`Saves as you write`. En la app real, `06-guardado-sin-boton.png` y el archivo que quedó en disco
(`documento-en-disco.md`).

### Criterio 4 · nada de vocabulario de IDE

`WorkspaceMarkdownEditor.test.tsx` y `WorkspaceFileViewer.test.tsx`: sin `role="tab"`, sin
`.monaco-editor`, sin `.line-numbers`, sin `textarea`, y el markdown crudo (```` ``` ````) nunca
aparece como texto. El eval además rechaza que los componentes de la pantalla importen Monaco, la
barra de herramientas o el panel de índice, y que cualquier texto suyo nombre línea, sintaxis,
código fuente o pestaña. La columna es `max-w-[46rem] mx-auto`.

### Criterio 5 · solo dentro del alcance

`src/main/workspaces/workspace-file-write.test.ts`: una ruta fuera del alcance, una ruta de
travesía que solo parece anidada, un archivo que no es documento y un archivo que no existe son
cuatro rechazos, y en los tres primeros el archivo de destino queda con su contenido intacto. La
validación vive en el proceso principal, no en la interfaz.

### Criterio 6 · lo que no es markdown no se rompe

`WorkspaceFileViewer.test.tsx`: con `orca.yaml` no se monta el editor, no aparece el estado de
guardado, y sigue el `MarkdownPreviewBody` de solo lectura de la spec 010. En la app real es
`09-un-archivo-que-no-es-documento-no-se-edita.png`.

### Criterio 7 · el conflicto con cambios de afuera

`workspace-file-write.test.ts`, prueba "keeps what the person wrote when the file changed
elsewhere": se abre el documento, algo lo reescribe afuera con una hora posterior, y al guardar el
disco queda con el texto de la persona y la respuesta trae `outcome: 'changed-elsewhere'`.
`use-workspace-file-autosave.test.ts` verifica que ese caso lleva la pantalla a
`saved-over-outside-change`, cuyo texto es "Saved. This file had also changed somewhere else, and
what you wrote is what was kept." La regla y las alternativas descartadas están en `decisions.md`,
2026-09-04.

### Criterio 8 · el modo desarrollo no cambia

e2e, describe "Developer mode — untouched by the Files editor": ni la navegación de modo simple ni
el editor de archivos existen en el árbol.

### Criterio 9 · código sano

```
$ pnpm tc                                → sin salida, en verde
$ npx oxlint (los archivos de esta spec) → sin hallazgos
$ pnpm run verify:localization-catalog   → 12557 claves verificadas
$ pnpm run verify:localization-extraction → exit 0
$ pnpm run verify:localization-coverage  → "passed with 12 allowlisted candidates"
$ npx vitest run src/renderer/src/components/files/ src/main/workspaces/
  Test Files  9 passed (9) · Tests  36 passed (36)
```

`pnpm run check:code-quality:changed` reporta **un** hallazgo de React Doctor, en
`src/renderer/src/components/native-chat/NativeChatApprovalCard.tsx:72`
(`no-array-index-as-key`). No es de esta rama: ese archivo no está en su diff y el hallazgo entró
en `main` con `d371b15859` (la conversación de la spec 012). El script compara contra
`d97c8cc07c5a`, anterior a ese commit, y por eso lo cuenta como nuevo. Queda reportado para que
Peter lo asigne.

### Criterio 10 · chequeo funcional en la app real

`config/scripts/spec-024-functional-check.mjs`, con perfil propio en `/tmp` y control por el puerto
de depuración —nunca activando la ventana, que es la regla de `CLAUDE.md` cuando hay otra instancia
de Electron viva—. Nueve capturas en
`docs/research/2026-09-04-chequeo-funcional-spec-024/`: app abierta, carpeta abierta, pantalla de
archivos, documento abierto con formato, escribiendo, guardado sin botón, el título escrito que se
ve como título, la vuelta al documento con el texto puesto, y el archivo que no es documento. El
archivo que quedó en el disco:

```
# Decisions

As it was on disk. Escrito en el chequeo funcional.

## Un titulo escrito ahora
```

## Lo que queda abierto

- **No hay vigilancia del archivo en disco.** Un cambio hecho afuera se detecta al guardar, no en
  vivo: un documento abierto y sin tocar sigue mostrando lo que se leyó al abrirlo hasta que se
  vuelve a abrir. Cerrarlo pide un observador de archivos, que es superficie nueva y ninguna
  criterio de esta spec la pide.
- **Un conflicto se cuenta, no se muestra.** La pantalla dice que el archivo había cambiado afuera,
  pero no ofrece ver qué decía la otra versión: eso sería una vista de diferencias, vocabulario de
  programador que el criterio de diseño de la spec descarta. Si aparece la necesidad, es spec
  propia.
- **Crear y borrar archivos siguen fuera de alcance**, como la spec los dejó.
