# Coordenadas e circulação

As unidades físicas são metros. A API usa `(coord_x, coord_y)` entre zero e um.
O modelo tem 30 × 60 m e pisos a 0 e 4,7 m.

```text
Blender.x = (coord_x - 0,5) × largura
Blender.y = (coord_y - 0,5) × comprimento
GLB.x = Blender.x
GLB.y = elevação do piso
GLB.z = -Blender.y
world = origin + coord_x × axis_x + coord_y × axis_y
```

Oeste é `coord_x=0`, leste é `1`, sul/entrada é `coord_y=0`, norte é `1`.
No SVG, o sul aparece na parte superior; a mesma orientação é usada na imagem e
nos nós. O catálogo contém `origin=[-15, elevação, 30]`, `axis_x=[30,0,0]` e
`axis_y=[0,0,-60]`. O visualizador acrescenta 0,08 m de altura somente à linha da rota.

As âncoras das lojas usam `store_positions` do layout derivado; estão no centro
do acesso e 0,6 m da vitrine em direção ao corredor. Os sanitários, escadas,
elevador e geração das plantas usam as mesmas configurações que seus construtores.
`navigation.py` gera objetos técnicos `NAV_*` e o catálogo. Esses objetos vazios
são mantidos no Blender; a geometria GLB não precisa renderizá-los.

## Correção física necessária à integração

O modelo original tinha os desembarques das escadas e o elevador no vão aberto
do átrio. Foi acrescentada a laje `ARQ_LAJE_Mezanino_Desembarque`, ligando as
passarelas entre o topo das escadas e a frente do elevador. Os guarda-corpos
foram segmentados para liberar os acessos e proteger as bordas livres.
As medidas dessa ligação são derivadas de `vertical_circulation` em `config.py`.

No térreo, as espinhas laterais contornam quiosques, bancos, vasos e escadas.
No mezanino, as espinhas usam as passarelas laterais; travessias usam apenas as
lajes frontal, de desembarque e posterior. Os acessos aos sanitários contornam
o mobiliário da praça e a escada monumental pelos lados.

O teste geométrico executa a cena real com Blender, faz interseções nas alturas
0,4, 1,0 e 1,8 m em cada aresta horizontal e verifica suporte de piso em amostras
com espaçamento de até 0,3 m. Esse teste verifica a linha central do trajeto;
não certifica largura normativa, capacidade do elevador ou acessibilidade de
um edifício real. Escadas/elevador representam transições, não simulação física.
