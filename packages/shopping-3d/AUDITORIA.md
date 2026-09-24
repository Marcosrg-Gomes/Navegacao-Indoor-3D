# Auditoria de fechamento — 13/09/2026

## Integração validada — 19/09/2026

O histórico abaixo foi preservado. A integração atual acrescenta âncoras,
catálogo espacial, exportação GLB e navegação nos dois pisos. Blender 4.5.14
executou a geração e a exportação de 1.909 objetos em um GLB de 3.488.904 bytes.
Os 27 destinos têm geometria e âncora; 1.149 amostras do grafo horizontal passaram
sem colisões nem falta de suporte de piso. A ligação de desembarque e os
guarda-corpos foram ajustados para criar circulação física no mezanino.

Os renders `cam_aerea.png` e `cam_mezanino.png` foram regenerados. As demais
imagens são referências anteriores. Nove testes puros, lint e formatação
passaram. A inspeção interativa da geometria exportada foi feita no navegador;
a inspeção em viewport nativo do Blender não foi realizada nesta integração.
Veja [evidências e limites](../../docs/validacao-integracao.md).

## Validação dinâmica — 16/09/2026

- Blender 4.5.14 LTS executado em modo headless com `--background --factory-startup --python scripts/render_headless.py`.
- A cena completa foi gerada com êxito: arquitetura, 22 lojas, áreas, mobiliário, iluminação e 7 câmeras (6 estáticas e 1 animada).
- As seis vistas estáticas foram renderizadas novamente a 640×360: `cam_aerea.png`, `cam_corredor.png`, `cam_entrada.png`, `cam_mezanino.png`, `cam_praca.png` e `cam_wormseye.png`.
- A inspeção visual dos renders confirmou a presença da geometria e das câmeras atuais. As cenas internas estão visualmente muito claras; isso é um ajuste estético de iluminação/exposição a ser tratado separadamente, não uma falha de geração.
- `renders/shopping_validado.blend` foi gerado para inspeção local e é ignorado pelo Git.

Revisão das melhorias existentes de geometria, proporções e alinhamentos, preservando as alterações anteriores. Nenhum recurso de navegação ou exportação de modelos foi acrescentado.

## Correção nesta revisão

As 10 grelhas de ar dos forros superiores estavam posicionadas junto à fachada. Agora ficam a 0,40 m da parede de fundo, usando `outer_x` do layout individual, nos dois lados do shopping. O problema foi reproduzido numericamente antes da correção.

## Verificações executadas

- Sintaxe dos 40 arquivos Python: aprovada.
- `git diff --check`: aprovado.
- Arco: espessura radial constante, vértices distintos e arestas compartilhadas por duas faces com orientação consistente.
- Peças trapezoidais: normais externas, com topo maior e menor que a base.
- Átrio: lajes, passarelas, guarda-corpos e LEDs alinhados em dois layouts; postes apoiados, sem posições duplicadas e com espaçamento máximo de 3 m.
- Fachadas: vãos de vidro, caixas dos rolos e soleiras com medidas consistentes nas 22 lojas; entrada respeitando a largura mínima configurada.
- Layouts com 2, 6 e 7 lojas por lado no térreo: pisos e paredes de fundo alinhados; os 10 forros superiores respeitam as dimensões individuais; grelhas dentro das lojas e a 0,40 m do fundo.

As verificações geométricas executam as funções Python com captura dos parâmetros dos construtores e das coordenadas das malhas. Não executam a API real do Blender, os modificadores ou a renderização.

## Pendência histórica — superada pela validação dinâmica de 16/09

Executar a geração e a inspeção visual no Blender. O executável não foi localizado nos caminhos verificados e o módulo `bpy` não está disponível no Python deste ambiente. As imagens existentes em `renders/` não foram regeneradas e não comprovam o estado atual do código.
