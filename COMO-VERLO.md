# Cómo ver el hilo funcionando (spec 011, etapa 1)

Esto levanta Andes desde este worktree, en modo simple (el default), y muestra un hilo real de
Claude conversando —sin terminal a la vista— con el permiso funcionando como tarjeta.

## 1. Instalar dependencias (una sola vez)

```
cd /Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-011
pnpm install --frozen-lockfile
```

## 2. Levantar Andes

```
pnpm dev
```

Modo simple es el default (spec 002): no hace falta ninguna variable de entorno. Si en tu máquina
ya quedó seteado `ANDES_INTERFACE_MODE=developer` de otra sesión, sacalo antes de correr `pnpm dev`.

## 3. Agregar el vault de prueba como proyecto

En la ventana que abre:

1. Agregá `/Users/pedroromeroluna/Documents/proyectos/ai-first-os-demo` como carpeta/proyecto
   (el flujo de "agregar carpeta" del onboarding o de la barra lateral).
2. Con el proyecto activo, abrí un hilo nuevo eligiendo **Claude** como agente (menú "New tab" de
   la barra de pestañas, o el botón equivalente si ya pasaste el onboarding).

## 4. Qué deberías ver

- El hilo abre directo como **conversación** —burbujas de texto y un cuadro para escribir abajo—,
  nunca una terminal. Esto es nuevo en esta spec: antes, sin el ajuste experimental prendido, el
  mismo hilo abría como terminal cruda.
- Escribile algo al agente (por ejemplo "leé el archivo CLAUDE.md y contame qué dice"). La
  respuesta aparece en la conversación; podés seguir la charla con una segunda pregunta sin que se
  reinicie la sesión.
- Pedile algo que necesite tocar un archivo (por ejemplo "creá un archivo nuevo llamado
  prueba.md con una línea de texto"). Va a aparecer una **tarjeta** con el nombre de la
  herramienta y dos botones, Allow y Deny — no una selección numerada en texto plano de terminal.
  - **Deny** frena la escritura (el archivo no se crea) y la conversación sigue: podés seguir
    escribiendo.
  - **Allow** deja correr la herramienta y la conversación sigue.

## Lo que falta (a propósito, en esta etapa)

Por debajo, el botón de la tarjeta sigue mandando la tecla al agente igual que antes (Allow → `1`,
Deny → `Esc`) — no llega como dato desde el kit de agentes. Está documentado como pendiente en el
criterio 0 de `specs/done/011-el-hilo.md`, con los archivos exactos, y es el estado previo de la
próxima spec. Para Peter, hoy, la diferencia no se nota: la tarjeta se ve y funciona igual.

También quedan afuera de esta etapa (ver "Diferido a la spec de restos" en la spec archivada): la
tarjeta de subagente, los estados incómodos (sesión sin iniciar, caída a mitad, respuesta vacía),
la revisión de jerga en los textos, que el hilo nazca con el primer mensaje del Command Center, y
que modo desarrollo mantenga paridad con la suite completa.

## Modo desarrollo, sin cambios

Si necesitás ver la terminal cruda como hoy, corré con `ANDES_INTERFACE_MODE=developer pnpm dev` —
esa superficie no se tocó en esta spec.
