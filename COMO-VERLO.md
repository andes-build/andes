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
