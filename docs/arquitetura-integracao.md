# Arquitetura integrada

FastAPI mantém identidades, disponibilidade, grafo, bloqueios e Dijkstra.
O Blender mantém arquitetura, objetos e posições. `scene-catalog-v1.json`, gerado
do layout, contém transforms por piso, POIs, âncoras, arestas físicas e tokens QR.
A seed lê esse contrato; não importa módulos Blender. Componentes React não
contêm posições físicas de lojas nem IDs numéricos do banco.

## Contratos e compatibilidade

`codigo` é obrigatório e único por tipo de entidade no banco. Códigos explícitos
usam letras maiúsculas, números e `_` (até 80 caracteres). Os IDs numéricos
continuam nas relações. Para preservar clientes anteriores, quando `codigo` é
omitido no POST, a API atribui uma vez `AUTO_<UUID>`. Atualizações não regeneram
códigos; vazio ou nulo é rejeitado. O painel permite preencher o código estável.
O Mini Shopping usa sempre os códigos explícitos do catálogo.

A atualização idempotente atribui `LEGACY_<TABELA>_<ID>` aos registros anteriores.
SQLite usa triggers de obrigatoriedade para evitar reconstruir tabelas; MySQL
usa `NOT NULL`. Ambos recebem índice único. A migração futura para Alembic é
dívida técnica documentada; não há necessidade de apagar o banco.

`GET /api/shoppings/{id}/scene` retorna transforms com IDs reais, POIs e âncoras
ativos. `404` significa shopping indisponível ou sem publicação; `409` significa
catálogo/GLB inválido, código sem correspondência, coordenada, dimensão, tipo ou
vínculo divergente. O cliente recebe o GLB determinado pelo servidor. Não há
parâmetro para selecionar outro modelo. Códigos presentes no catálogo mas ausentes
do banco também invalidam a cena. Entidades inativadas permanecem no histórico
e são omitidas da resposta pública.

`GET /api/admin/shoppings/{id}/scene/validation` exige a mesma API key dos demais
endpoints administrativos. Exibe inventário, ausências nos dois sentidos,
divergências espaciais e destinos sem rota comum/acessível. Bloqueios válidos
podem tornar uma rota indisponível sem invalidar a correspondência geométrica.

## Rotas e apresentação

Escadas rolantes têm nós próprios, arestas verticais unidirecionais e pesos em
metros medidos entre as âncoras. Elevador é bidirecional. Rotas acessíveis
excluem escadas e escadas rolantes mesmo se uma aresta for marcada acessível.
O motor consulta o grafo atual a cada cálculo; o botão Recalcular aplica bloqueios.

Expo resolve `SceneMap.web.tsx` no navegador e `SceneMap.native.tsx` em Android/iOS.
O módulo Three.js é carregado sob demanda por importação dinâmica somente no web.
O render usa câmera ortográfica inclinada, oculta coberturas e o piso superior
quando o térreo está ativo, e atenua o térreo no mezanino. Materiais de objetos
são isolados para o destaque de uma loja não alterar outras lojas.

A exploração 3D usa `MapControls` do Three.js já instalado, com zoom até 8×,
pan no plano do piso, rotação limitada e ações explícitas de enquadramento.
Atualizações de rota não reposicionam a câmera. Rótulos usam as âncoras da API,
projetadas na tela, priorizando origem/destino e evitando sobreposição.

`Map2D` mantém zoom/deslocamento locais. `MapGestureSurface.web` usa Pointer
Events, captura durante o arraste e zoom ancorado ao cursor; a versão nativa usa
um `PanResponder` estável e pinça. A planta permanece parcialmente visível nos
limites do movimento. O estado 2D é conservado ao alternar a visualização web.
Controles de zoom, retorno à origem e enquadramento compartilham `MapToolbar`.
Nenhuma dessas ações altera as coordenadas ou o cálculo de rotas da API.

O carregamento tem limite de 20 segundos, progresso, tratamento de erro do GLB,
falha/perda de WebGL e tentativa manual. O fallback conserva a mesma rota e
instruções. Os decodificadores Draco são copiados da versão instalada do Three.js
para estáticos locais; o visualizador não depende de CDN.

Dependências acrescentadas: `three@0.170.0`, `@react-three/fiber@8.18.0` e
`@types/three@0.170.0` no visitante. Fiber 8 acompanha React 18, conforme a
[documentação oficial](https://r3f.docs.pmnd.rs/getting-started/installation).
O carregamento Draco segue o [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html).
Nenhum serviço externo foi acrescentado.
