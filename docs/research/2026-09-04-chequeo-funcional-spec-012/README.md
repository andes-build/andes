# 2026-09-04 · Chequeo funcional de la spec 012 — PASA

**El criterio 9 pasa.** El recorrido completo con el binario real de Claude, en la aplicación de
verdad, modo simple: se abre un hilo, se pide algo que requiere permiso, se permite en un hilo y se
rechaza en otro, y el resultado difiere en el disco.

## Cómo se corre

```
node config/scripts/spec-012-functional-check.mjs        # imprime SPEC012 {workspace, cdpPort}
node config/scripts/spec012/walk.mjs <puerto> setup <carpeta>
node config/scripts/spec012/walk.mjs <puerto> thread
node config/scripts/spec012/walk.mjs <puerto> ask "<pedido>"
node config/scripts/spec012/walk.mjs <puerto> click "^Allow$"
```

La aplicación se maneja **solo por el puerto de depuración**, nunca con clics del sistema: dos
instancias de desarrollo comparten `build.andes.dev` y una activación robaría el foco de la ventana
de otra persona (advertencia de `CLAUDE.md`). Corre sobre una carpeta de prueba en `/tmp` y con el
`HOME` real, porque Claude firma contra él.

## Los pasos, con su captura

| Captura | Qué muestra |
|---|---|
| `01-app-abierta.png` | La aplicación abierta, modo simple, sin carpeta |
| `02-carpeta-agregada.png` | La carpeta de prueba agregada y activa |
| `03-tarjeta-de-permiso.png` | El hilo abierto y la tarjeta de permiso: título `Write`, detalle `permiso.txt`, Allow y Deny |
| `04-permitido-archivo-escrito.png` | Permitido: el agente confirma y `permiso.txt` existe con `PERMITIDO` |
| `05-segundo-hilo-tarjeta.png` | Un segundo hilo con su propia tarjeta, esta vez `rechazo.txt` |
| `06-rechazado-sin-archivo.png` | Rechazado: el agente dice que no pudo escribirlo y `rechazo.txt` no existe |

El disco al terminar: `LEEME.md` y `permiso.txt`. `rechazo.txt` no está.

## Lo que este chequeo encontró y esta rama arregla

Nada de esto se veía sin correr la aplicación: los tests unitarios estaban en verde.

1. **La adquisición esperaba `system/init`**, que el binario emite recién con el primer turno. Una
   sesión sin escribir no tiene id que anunciar y el `create` moría a los 60 segundos.
2. **El carril arrastraba los argumentos por defecto del perfil**, que traen el de saltear permisos
   —de otro agente— y mataban al hijo con `unknown option`.
3. **El enrutador convertía "este carril no reporta opciones de sesión" en un error**, y el attach
   las lee en toda sesión.
4. **El id de operación del primer mensaje no tenía la forma del registro durable.**
5. **La proyección de pestañas escondía de todo cliente cualquier sesión que no fuera Codex**, y el
   portón del Command Center contaba solo pestañas de terminal: el hilo existía y respondía, y la
   pantalla seguía mostrando el Command Center.
6. **El permiso pendiente se guardaba con el id del pedido y la tarjeta contesta con el id del ítem
   del journal.** Toda respuesta llegaba como "claude is no longer waiting on permission". El test
   unitario del criterio 3 pasaba porque contestaba con el id equivocado, igual que el adaptador.

## Lo que queda abierto

**El compositor dice "Message delivery is unconfirmed · Retry" después de cada mensaje**, aunque el
mensaje llegó y el agente contestó. Se ve en todas las capturas. Es la reconciliación del outbox de
la interfaz contra el journal, no el carril de datos, y no es de esta spec.

**El transcripto muestra los cuadros internos del CLI** (`system:thinking_tokens`,
`system:task_summary`, `system:hook_started`) como filas propias. Es la regla de la spec 012 de no
inventar ni tirar lo que no se modela; qué se dibuja y qué se pliega es trabajo de la superficie de
la conversación, no de este carril.
