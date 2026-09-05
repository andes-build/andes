# Medir el CLI de Claude exige desarmar las variables `CLAUDE*`

**Cuándo aplica**: cuando un criterio se verifica corriendo el binario `claude` desde una sesión de
Claude Code, que es como corren los agentes de este repo.

Una sesión lanzada desde adentro de otra hereda `CLAUDE_CODE_CHILD_SESSION=1`, y con esa marca el
CLI apaga el guardado del transcripto y lo dice en pantalla:

```
Transcript saving is off — inherited CLAUDE_CODE_CHILD_SESSION marker
```

Sin transcripto no hay archivo de sesión, y todo lo que se lee de ahí —el título, el historial, los
turnos— sale vacío. Una medición hecha así reporta "el CLI no escribe X" cuando lo que pasa es que
el agente que mide apagó la escritura.

Antes de correr el binario para medir, desarmar todas las variables `CLAUDE*` y `AI_AGENT`:

```sh
for v in $(env | grep -o '^CLAUDE[A-Z_]*') AI_AGENT; do unset $v; done
```

**El modo `-p` tampoco sirve para medir el título**: ni con el entorno limpio escribe `ai-title`.
El título se mide sobre una terminal real (`script -q /dev/null claude`), que es el canal por el que
Andes lanza el agente mientras `experimentalNativeChat` esté apagado.
