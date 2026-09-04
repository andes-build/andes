---
status: pendiente
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
