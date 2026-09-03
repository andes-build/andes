# Cómo ver la spec 010 corriendo

Estos pasos levantan Andes desde este worktree (`andes-wt-spec-010`, rama
`spec-010-workspaces-archivos`) y muestran la barra lateral nueva y la
pantalla Files de modo simple.

## 1. Levantar la app

```
cd /Users/pedroromeroluna/Documents/proyectos/andes-wt-spec-010
pnpm install --frozen-lockfile   # si no lo corriste ya en este worktree
pnpm run dev
```

Se abre la ventana de Andes. Arranca en modo simple por default (spec 002):
no hace falta ninguna variable de entorno ni gesto oculto.

## 2. Abrir una carpeta con workspaces

Un vault de prueba con varios workspaces ya existe en
`/Users/pedroromeroluna/Documents/proyectos/ai-first-os-demo`, pero solo trae
**uno** (`workspaces/tandem-pay`). Para ver el selector con más de una opción,
usá la carpeta de prueba que ya armé para los e2e, o creá la tuya:

**Opción A — reusar el fixture de los tests** (más rápido): corré el bloque de
abajo para crear una carpeta con tres workspaces, y elegila en el paso
siguiente.

```
mkdir -p /tmp/andes-demo-workspaces/workspaces/tandem-pay
mkdir -p /tmp/andes-demo-workspaces/workspaces/ops
mkdir -p /tmp/andes-demo-workspaces/workspaces/growth
cat > /tmp/andes-demo-workspaces/workspaces/tandem-pay/README.md <<'EOF'
# Tandem Pay

Qué es, para quién y cómo gana plata.
EOF
cat > /tmp/andes-demo-workspaces/workspaces/tandem-pay/decisions.md <<'EOF'
# Decisions

## 2026-08-06 — El checkout no guarda tarjetas
EOF
cat > /tmp/andes-demo-workspaces/workspaces/ops/README.md <<'EOF'
# Ops

Qué es, para quién y cómo gana plata.
EOF
cat > /tmp/andes-demo-workspaces/workspaces/ops/backlog.md <<'EOF'
# Backlog

- [ ] Ejemplo de tarea pendiente
EOF
cat > /tmp/andes-demo-workspaces/workspaces/growth/README.md <<'EOF'
# Growth

Qué es, para quién y cómo gana plata.
EOF
```

**Opción B — el vault demo real** (`ai-first-os-demo`): solo tiene un
workspace (Tandem Pay) más la raíz, así que el selector muestra dos
opciones en vez de tres — sirve igual para ver el flujo, no para ver la
lista larga.

En la ventana de Andes: si es la primera vez que abrís esta carpeta, el
asistente de onboarding va a pedir elegir carpeta — elegí
`/tmp/andes-demo-workspaces` (o `ai-first-os-demo`) en el paso "¿Dónde vive tu
carpeta?". Si Andes ya tenía otra carpeta abierta, agregala como proyecto
nuevo desde el flujo normal de "Add project" y activala.

## 3. Qué mirar

- **Arriba de la barra lateral**: el selector con la inicial y el nombre del
  workspace activo (arranca en "My work", la raíz). Al hacer clic se abre con
  los workspaces de la carpeta, más "My work" y "New workspace" (esta última
  existe pero no crea nada todavía — ver `decisions.md`).
- **Debajo**: la navegación exacta — New thread, Command Center, Files,
  Agents & skills, More — y la sección Recent threads (vacía: la fuente de
  datos por workspace todavía no existe, ver `decisions.md`).
- **Elegir "Tandem Pay" en el selector** y después **"Files"** en la
  navegación: el árbol de la izquierda muestra solo lo de ese workspace
  (README traducido a "What this is", "Decisions"), nunca lo de "Ops" ni
  "Growth" ni el resto de la carpeta. Abrir un archivo lo muestra con
  formato a la derecha, con el botón "Open a thread about this file".
- **Volver a "My work"** en el selector: el árbol de Files cambia a la raíz
  de la carpeta.
- **"Command Center"** en la navegación: hoy muestra una pantalla mínima
  ("Coming soon") — es la spec 009, todavía no mergeada en esta rama.

## 4. Qué falta (a propósito, ver la spec archivada)

- Crear un workspace nuevo desde el selector no hace nada (fuera de alcance:
  es la spec de onboarding).
- Recent threads siempre está vacío: no existe todavía el concepto de
  conversación por workspace en el runtime.
- Command Center es un placeholder — su contenido real es otra spec.

## Modo desarrollo (para comparar)

```
ANDES_INTERFACE_MODE=developer pnpm run dev
```

Con la variable, la barra lateral vuelve a ser la de proyectos y worktrees de
siempre — nada de lo de arriba se muestra ahí, a propósito.

---

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
