# Gatear un modo por el componente que realmente pinta, no por el que parece dueño

**Cuándo aplica**: al esconder una superficie de la interfaz "en modo X" cuando esa superficie
tiene más de un punto de render (un portal más antiguo y una implementación inline más nueva, por
ejemplo).

Gatear el componente que el nombre sugiere ("la barra de pestañas es `TerminalTitlebarTabs`") no
alcanza si ese componente ya no es el que pinta. En Andes, `TerminalTitlebarTabs` se vuelve `null`
en cuanto existe cualquier layout (`effectiveActiveLayout`, spec 021) — desde que la spec 021
arregló el panel en blanco, **todo** worktree con pestañas tiene un layout, así que ese portal no
pinta nunca en la práctica. La barra que la persona ve es el strip de 32px que arma cada
`TabGroupPanel`, sin condición de modo desde que existe.

**Cómo se descubrió**: un eval unitario con `useAppStore` mockeado pasaba en verde gateando solo
`TerminalTitlebarTabs` — el mock nunca ejecuta el layout de grupos real, así que nunca expone que
ese componente ya no pintaba nada. El chequeo funcional obligatorio de la spec 013, con `pnpm dev`
real, mostró la barra de pestañas completa en modo simple pese al eval verde.

**El chequeo que lo hubiera encontrado antes**: buscar todos los `<TabBar` (o el componente
equivalente) del árbol —`grep -rln "<TabBar\b" src`— antes de asumir que gatear uno alcanza.
Cuando una superficie tiene un portal y una implementación inline, las dos necesitan su propio
gate.
