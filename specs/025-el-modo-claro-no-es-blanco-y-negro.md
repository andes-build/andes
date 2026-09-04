---
status: pendiente
depends_on: []
---

# 025 · El modo claro no es blanco y negro

En modo claro la barra lateral es negra y el área de contenido es blanca, y el contraste entre las
dos parte la pantalla. El área de contenido pasa a un gris muy claro; la barra lateral sigue oscura.

**Tipo**: feature · **Flujo**: requirements-first

## Estado previo

`main` en `da55c96187`. El agente corre `git log da55c96187..main --stat` antes de empezar.

Se ve en las capturas de los chequeos funcionales de las specs 012 y 013: barra lateral negra contra
fondo blanco puro. La paleta viene heredada de Orca; el agente ubica dónde vive antes de tocar nada
—❓ no está escrito acá porque no se verificó— y cambia **los tokens**, nunca color a color en cada
componente.

## Criterios de aceptación

| # | Criterio | Eval |
|---|---|---|
| 1 | En modo claro el área de contenido es un gris muy claro, no blanco puro | Test unitario sobre los tokens: el fondo de contenido en claro no es `#ffffff` |
| 2 | La barra lateral sigue oscura y sigue leyéndose como una pieza aparte | Captura del chequeo funcional, con la barra distinguible del contenido |
| 3 | El texto sobre el fondo nuevo cumple contraste de accesibilidad | Test unitario que calcula el contraste de texto primario, secundario y deshabilitado contra el fondo nuevo: todos ≥ 4.5:1 el primario y ≥ 3:1 los demás |
| 4 | Las superficies que se apoyan sobre el fondo siguen distinguiéndose | Test unitario: tarjetas, campos y menús no quedan del mismo color que el fondo |
| 5 | El modo oscuro no cambia | Test unitario de los tokens oscuros, sin diferencias |
| 6 | El cambio está en los tokens, no repartido por componentes | `git diff --stat`: los archivos de color cambian; ningún componente incorpora un color literal nuevo. Eval que busca colores literales agregados en el diff |
| 7 | Código sano | `pnpm tc` · `check:code-quality:changed` en verde |
| 8 | Chequeo funcional en la app real | Capturas en claro y en oscuro, de la conversación, el Command Center y los archivos |

## Decisiones

**Cerradas antes de delegar**

- DECIDIDO por Peter (2026-09-04): en modo claro no quiere el contraste de negro contra blanco. La
  barra lateral oscura se queda; el contenido va a un gris muy claro.

**Delegadas al agente, con criterio**

- Qué gris exactamente. Criterio: que se despegue del blanco lo suficiente para que la barra lateral
  no corte la pantalla, y que las tarjetas blancas encima sigan leyéndose como elevadas. Se elige
  con las capturas a la vista, no en abstracto.

**Condiciones de parada**

- Si cambiar el token del fondo rompe una superficie heredada de Orca que el modo simple no muestra,
  declaralo y seguí; si rompe una que sí muestra, para y reporta.

## Efectos que escapan del sistema

Ninguno.

## Fuera de alcance, con condición de reactivación

- Un tema propio de Andes, distinto del heredado: se reactiva cuando haya identidad visual definida.
- Que la persona elija el color: no hay pedido.
