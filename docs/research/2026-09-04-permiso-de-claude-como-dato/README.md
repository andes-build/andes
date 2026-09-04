# 2026-09-04 · El permiso de Claude llega como dato

Evidencia del criterio 1 de `specs/012-el-permiso-de-claude-llega-como-dato.md`, el paso de riesgo
que decide si la spec sigue.

**Resultado**: pasa. El permiso llega como dato al código de Andes, la respuesta vuelve por el mismo
canal, y permitir y rechazar terminan distinto.

## Cómo se lanza el binario

Solo cambian los argumentos. Nada empaqueta, parchea, envuelve ni reemplaza el binario, y la capa
del inicio de sesión no se toca.

```
claude --output-format stream-json --verbose --input-format stream-json \
       --permission-prompt-tool stdio --model sonnet
```

Binario: `/opt/homebrew/bin/claude`, versión `2.1.260 (Claude Code)`.

## El hallazgo que no estaba en la spec

**`--permission-prompt-tool stdio` es el argumento que abre el canal.** Sin él, el mismo comando con
`--permission-mode manual` no entrega nada: el CLI contesta su propio pedido y emite

```json
{"type":"system","subtype":"permission_denied","tool_name":"Write",
 "message":"Claude requested permissions to write to …, but you haven't granted it yet."}
```

Con él, y después del saludo `control_request` de subtipo `initialize`, llega el pedido como dato.

## El pedido, tal como llega

```json
{"type":"control_request","request_id":"c4b30153-6afd-4f18-9914-02853713cb8b",
 "request":{"subtype":"can_use_tool","tool_name":"Write","display_name":"Write",
   "input":{"file_path":"…/nota.txt","content":"ok\n"},
   "description":"nota.txt",
   "permission_suggestions":[{"type":"setMode","mode":"acceptEdits","destination":"session"}],
   "tool_use_id":"toolu_019qn2rc6Affo29RHxefrhwQ"}}
```

El título y el detalle de la tarjeta salen de `title` / `display_name` y de `description`. No hace
falta leer la pantalla de la terminal para dibujarla.

## La respuesta, tal como vuelve

```json
{"type":"control_response","response":{"subtype":"success","request_id":"…",
  "response":{"behavior":"allow","updatedInput":{…}}}}
```

y para rechazar:

```json
{"…":"…","response":{"behavior":"deny","message":"denied by the spec 012 criterion 1 check"}}
```

## Las dos corridas

| Corrida | Permiso llegó como dato | Archivo escrito | Lo que dijo el agente |
|---|---|---|---|
| permitir | sí, `Write` | sí | "Listo, nota.txt creado con 'ok'." |
| rechazar | sí, `Write` | no | "No pude escribirlo: el permiso fue rechazado." |

En la corrida de rechazo el resultado de la herramienta vuelve marcado:
`"tool_result_meta":[{"id":"toolu_018sc5RuKnCoQpLVe7498fht","non_execution_kind":"permission-rule"}]`.

## Cómo se repite

```
ANDES_EVAL_CLAUDE_REAL=1 npx vitest run --config config/vitest.config.ts \
  src/main/claude/claude-structured-permission-as-data.integration.test.ts
```

Corrida del 2026-09-04: `Test Files 1 passed (1) · Tests 2 passed (2) · Duration 26.85s`.

Gasta cuota de la suscripción de la persona, por eso queda detrás de `ANDES_EVAL_CLAUDE_REAL=1` y
pide lo más chico que igual necesita permiso: escribir un archivo de una línea.
