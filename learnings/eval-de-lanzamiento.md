# Un eval de lanzamiento afirma el efecto, no la llamada

**Cuándo aplica**: cuando un criterio dice que una superficie "lanza", "abre", "manda" o "corre"
algo.

Afirmar los argumentos con los que se llamó a una función intermedia no prueba nada sobre el
efecto. En la spec 010, el eval de "New thread lanza el agente detectado" afirmaba el objeto pasado
a `createTab` y quedó en verde durante toda una spec sobre una pestaña que abría un shell pelado:
`createTab` con `launchAgent` etiqueta, no lanza.

Lo que sí sirve, en orden de preferencia:

1. Verificar de punta a punta que el efecto llega (escribir un mensaje y ver la respuesta).
2. Afirmar la llamada que produce el efecto —acá, `queueTabStartupCommand` con su comando— dejando
   correr de verdad la capa intermedia en vez de simularla.

**Cuidado con el e2e que esquiva el botón**: el e2e de la spec 011 probaba la conversación lanzando
desde el menú de la barra de pestañas. Ese camino sí lanzaba el agente, así que la prueba pasaba
mientras el botón que usa el operador estaba roto. Un e2e de una superficie entra por la superficie.
