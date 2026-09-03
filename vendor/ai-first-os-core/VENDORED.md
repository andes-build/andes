# Núcleo vendorizado

Copia versionada de `core/` de AI First OS que Andes trae adentro del paquete para preparar un
brain sin depender de la red ni de git (spec 005, criterio 5).

- Fuente: `https://github.com/pedroromeroluna/ai-first-os`
- Commit: `c9a5f644f21ccf030cb8b81bbf430416474b51d9`
- Fecha del commit: 2026-08-27
- Versión (`core/VERSION`): `1.3.0`
- Copiado con `rsync -a --exclude='.git'`, sin symlinks.

Actualizar esta copia es una spec aparte (fuera de alcance de la spec 005). Ningún texto de acá se
muestra tal cual en la interfaz de Andes: el paso "Preparar el brain" corre `core/install.sh` como
subproceso y resume su resultado con copy propio.
