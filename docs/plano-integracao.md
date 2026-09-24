# Plano detalhado — Unificar Navegação Indoor e Shopping 3D

## 1. Objetivo e arquitetura final

Transformar o projeto em uma aplicação de navegação indoor para um shopping de dois pisos, usando o modelo procedural do Blender como ambiente visual e o sistema FastAPI como fonte de verdade para QR Codes, destinos, grafos e cálculo de rotas.

A primeira versão integrada terá:

- Shopping com térreo e mezanino.
- 22 lojas do catálogo atual do Shopping 3D.
- Quatro banheiros: masculino/feminino no térreo, masculino PCD e feminino/família no mezanino.
- Entrada principal com QR Code.
- Escadas rolantes e elevador como transições entre pisos.
- Rota acessível usando elevador.
- Visualização 3D aérea guiada na versão web do app visitante.
- Mapa 2D atual como alternativa automática e manual.
- Painel administrativo para dados de navegação e validação do vínculo com o modelo, sem editar geometria 3D.

A separação de responsabilidades será:

| Camada | Responsabilidade |
|---|---|
| FastAPI | Dados do shopping, destinos, QR Codes, grafo, bloqueios e Dijkstra |
| Blender Python | Geração da geometria, coleções, objetos, âncoras e exportação GLB |
| Catálogo de cena | Ponte versionada entre dados da API e objetos/posições do modelo |
| App Expo Web | Busca, QR Code, rota, visualização 2D/3D e instruções |
| Painel React | Cadastro administrativo e validação de consistência |

## 2. Estado atual confirmado

### Navegação Indoor

- A API já possui `Shopping`, `Piso`, `No`, `Aresta`, `Loja`, `Categoria` e `QRCode`.
- Os nós usam coordenadas normalizadas entre `0` e `1`.
- O motor Dijkstra já aceita trajetos entre pisos, exige conexões por escada/elevador e filtra caminhos não acessíveis.
- O app visitante já lê QR Code, escolhe destino, calcula rota, alterna pisos e renderiza a rota em SVG sobre mapa 2D.
- O painel já cadastra pisos, nós, arestas, lojas e QR Codes, além de validar grafo.
- A seed atual representa outro shopping: um piso, 22 nós e 11 destinos. Ela não deve ser reutilizada como base do Mini Shopping.

### Shopping 3D

- O modelo tem 30 m de largura, 60 m de comprimento e dois níveis.
- O térreo está em `z = 0`; o piso caminhável do mezanino está em `z = 4,7`.
- Existem 12 lojas no térreo (`E01–E06`, `D01–D06`) e 10 no mezanino (`ME01–ME05`, `MD01–MD05`).
- A entrada principal fica na fachada sul, em torno de `y = -30`.
- O modelo possui escadas rolantes, elevador panorâmico, banheiros e lojas identificadas por códigos consistentes.
- Já há testes de configuração, geometria pura, geração headless no Blender 4.5.14 LTS e CI.
- Ainda não há exportação para `.glb`, manifesto de navegação ou integração com a API.

## 3. Organização do monorepo

O diretório `TCC` será o repositório único e passará a ter esta estrutura:

```text
TCC/
├── apps/
│   ├── visitor/              # Expo / React Native / Expo Web
│   └── admin/                # React / Vite
├── services/
│   └── api/                  # FastAPI e banco de dados
├── packages/
│   ├── shopping-3d/          # Gerador procedural Blender
│   └── scene-contract/       # Esquema e validação do catálogo de cena
├── assets/
│   └── models/
│       └── mini-shopping/
│           ├── mini-shopping-v1.glb
│           └── scene-catalog-v1.json
├── docs/
│   ├── arquitetura-integracao.md
│   ├── coordenadas-e-ancoras.md
│   ├── publicacao-modelo-3d.md
│   └── referencias.md
└── AGENTS.md
```

Regras de migração:

1. Preservar os repositórios atuais até a validação final.
2. Resolver ou versionar alterações locais antes da movimentação.
3. Importar os históricos usando `git subtree`, sem perder autoria.
4. Importar apenas `backend`, `mobile` e `admin-panel` da Navegação Indoor.
5. Não importar como produto os projetos de referência/upstream existentes dentro de `Navegacao-indoor`; documentar origem e licença em `docs/referencias.md`.
6. Importar o Shopping 3D como `packages/shopping-3d`.
7. Consolidar os workflows de CI sem apagar as validações Blender já existentes.

## 4. Fonte de verdade e contrato de dados

### Fonte de verdade

- A API é responsável por identidade, disponibilidade, QR Codes, grafos, distâncias, bloqueios e rotas.
- O Blender é responsável por geometria, materiais, iluminação, câmeras e posição física dos elementos.
- O catálogo de cena é o único elo permitido entre API e modelo 3D.
- O app nunca terá coordenadas ou IDs físicos duplicados manualmente em componentes React.

### Chaves estáveis

Adicionar o campo obrigatório `codigo` a:

| Entidade | Exemplos |
|---|---|
| Shopping | `MINI_SHOPPING` |
| Piso | `TERREO`, `MEZANINO` |
| Loja | `E01`, `D05`, `ME03`, `MD05` |
| Nó | `T_ENTRADA`, `T_COR_01`, `M_ELEVADOR`, `M_BANHEIRO_FAMILIA` |

Os IDs numéricos permanecem para relacionamentos internos, mas o vínculo com o modelo 3D será sempre por `codigo`.

A migração seguirá o padrão atual de atualizações idempotentes do backend. A futura substituição por Alembic será registrada como melhoria técnica, mas não bloqueará a integração.

### Catálogo de cena

O Blender gerará `scene-catalog-v1.json` junto com o GLB.

Estrutura mínima:

```json
{
  "version": "1.0.0",
  "shopping_code": "MINI_SHOPPING",
  "model_url": "/static/models/mini-shopping/mini-shopping-v1.glb",
  "floors": {
    "TERREO": {
      "origin": [-15, 0, 30],
      "axis_x": [30, 0, 0],
      "axis_y": [0, 0, -60]
    },
    "MEZANINO": {
      "origin": [-15, 4.7, 30],
      "axis_x": [30, 0, 0],
      "axis_y": [0, 0, -60]
    }
  },
  "pois": {
    "E01": {
      "object_prefix": "LOJA_E01",
      "anchor_code": "T_LOJA_E01"
    }
  }
}
```

A conversão oficial será:

```text
coordenada API:    (coord_x, coord_y), ambas entre 0 e 1
Blender:           x = (coord_x - 0,5) × 30
                   y = (coord_y - 0,5) × 60
Visualizador GLB:  x = Blender.x
                   y = altura do piso
                   z = -Blender.y
```

Portanto:

- `coord_x = 0` representa a borda oeste.
- `coord_x = 1` representa a borda leste.
- `coord_y = 0` representa a entrada/fachada sul.
- `coord_y = 1` representa o fundo/fachada norte.
- O térreo usa elevação `0`.
- O mezanino usa elevação `4,7`.

Essa fórmula será documentada e testada para impedir divergência entre 2D e 3D.

## 5. Preparação do Shopping 3D

### Objetos e coleções navegáveis

Padronizar os objetos de referência no gerador:

```text
NAV_PISO_TERREO
NAV_PISO_MEZANINO
NAV_ENTRADA_PRINCIPAL
NAV_LOJA_E01 ... NAV_LOJA_MD05
NAV_BANHEIRO_T_MASC
NAV_BANHEIRO_T_FEM
NAV_BANHEIRO_M_MASC_PCD
NAV_BANHEIRO_M_FEM_FAMILIA
NAV_ESCADA_ROLANTE_SUBIDA_T
NAV_ESCADA_ROLANTE_SUBIDA_M
NAV_ESCADA_ROLANTE_DESCIDA_T
NAV_ESCADA_ROLANTE_DESCIDA_M
NAV_ELEVADOR_T
NAV_ELEVADOR_M
```

Essas âncoras serão objetos técnicos, não elementos decorativos. Elas precisarão:

- Ter posição derivada do mesmo `config.py` que cria o modelo.
- Ser regeneradas sempre que o layout mudar.
- Ficar na área caminhável, nunca dentro de paredes, vitrines, quiosques ou mobiliário.
- Ser incluídas no catálogo, mesmo que não sejam visíveis no GLB final.

### Exportação GLB

Criar `scripts/export_navigation_scene.py`, executado pelo Blender em modo headless.

Fluxo:

1. Executar `main.run_project()`.
2. Confirmar as coleções e âncoras obrigatórias.
3. Aplicar nomes estáveis aos objetos exportados.
4. Exportar a coleção raiz `MINI_SHOPPING`.
5. Excluir câmeras, luzes, elementos de debug e âncoras visuais desnecessárias.
6. Aplicar compressão de malha e texturas compatível com navegador.
7. Gerar o GLB e o catálogo.
8. Validar que todos os códigos de loja e destino esperados foram exportados.
9. Copiar os artefatos para `services/api/app/static/models/mini-shopping/`.

O modelo terá orçamento inicial de até 25 MB. Caso ultrapasse esse limite, reduzir polígonos de mobiliário/interiores, reutilizar materiais e aplicar compressão antes de reduzir arquitetura essencial.

## 6. Novo conjunto de dados de navegação

Criar uma seed idempotente separada, por exemplo `seed_mini_shopping.py`. Ela nunca apagará dados existentes e poderá ser executada repetidamente.

### Pisos

| Código | Nome | Nível | Dimensões |
|---|---:|---:|---:|
| `TERREO` | Térreo | 0 | 30 × 60 m |
| `MEZANINO` | Mezanino | 1 | 30 × 60 m |

Também serão criadas duas plantas SVG simplificadas e proporcionais ao modelo para o fallback 2D.

### Destinos

- 22 lojas do `store_catalog` do Shopping 3D.
- Quatro banheiros existentes no modelo.
- Entrada principal como ponto de origem e destino navegável.
- Escadas rolantes e elevador como pontos de transição, não como resultados de busca comercial.

Os quiosques, bancos, lixeiras e elementos decorativos não serão destinos na primeira versão.

### Grafo físico

O grafo será construído a partir do layout derivado, não por valores fixos.

#### Térreo

- Um nó de entrada principal.
- Uma espinha dorsal no corredor central.
- Nós de interseção no alinhamento das lojas.
- Um nó de acesso para cada loja, deslocado 0,6 m em direção ao corredor a partir da vitrine.
- Nós para banheiros.
- Nós para escadas rolantes e elevador.
- Arestas calculadas pela distância física em metros.

#### Mezanino

- Duas espinhas de circulação nas passarelas laterais, sem atravessar o vão do átrio.
- Um nó de acesso para cada loja.
- Nós para os dois banheiros do piso.
- Nós de desembarque da escada rolante e do elevador.
- Conexões horizontais somente onde houver passagem física.

#### Transições verticais

| Transição | Tipo | Bidirecional | Acessível |
|---|---|---:|---:|
| Escada rolante de subida | `escada_rolante` | Não | Não |
| Escada rolante de descida | `escada_rolante` | Não | Não |
| Elevador panorâmico | `elevador` | Sim | Sim |

Adicionar `escada_rolante` aos tipos permitidos do backend, painel e app. O motor de rotas deverá:

- Permitir transições entre pisos apenas por `escada`, `escada_rolante` ou `elevador`.
- Excluir `escada` e `escada_rolante` de rotas acessíveis.
- Gerar instruções específicas: “Use a escada rolante para subir/descer” e “Use o elevador para ir ao mezanino”.
- Usar distâncias verticais explícitas, em metros, para as transições entre pisos.

### QR Codes iniciais

| Token | Local |
|---|---|
| `MINI-ENTRADA-PRINCIPAL` | Entrada principal |
| `MINI-TERREO-CENTRAL` | Corredor central térreo |
| `MINI-ESCADA-TERREO` | Base da escada rolante |
| `MINI-ELEVADOR-TERREO` | Elevador térreo |
| `MINI-MEZANINO-CENTRAL` | Passarela do mezanino |
| `MINI-ESCADA-MEZANINO` | Desembarque da escada rolante |
| `MINI-ELEVADOR-MEZANINO` | Elevador mezanino |

Esses QR Codes permitem identificar a entrada e recalibrar a posição do visitante durante o trajeto.

## 7. API de integração 3D

Criar o endpoint público:

```http
GET /api/shoppings/{shopping_id}/scene
```

Resposta:

```json
{
  "shopping_id": 1,
  "scene_version": "1.0.0",
  "model_url": "/static/models/mini-shopping/mini-shopping-v1.glb",
  "floors": [
    {
      "piso_id": 10,
      "codigo": "TERREO",
      "origin": [-15, 0, 30],
      "axis_x": [30, 0, 0],
      "axis_y": [0, 0, -60]
    }
  ],
  "pois": [
    {
      "loja_id": 31,
      "codigo": "E01",
      "object_prefix": "LOJA_E01",
      "anchor_node_id": 101
    }
  ],
  "anchors": [
    {
      "node_id": 101,
      "codigo": "T_LOJA_E01",
      "piso_id": 10
    }
  ]
}
```

Regras:

- Retornar apenas entidades ativas.
- Retornar `404` se o shopping não possuir cena publicada.
- Retornar `409` se houver código de banco sem correspondência no catálogo.
- Não permitir que o cliente escolha arbitrariamente outro GLB.
- Servir GLB e catálogo via `/static/models/`, já suportado pelo FastAPI.
- Publicar uma nova versão de cena somente depois de validação da API e do catálogo.

O endpoint de rota continuará retornando os nós atuais. O app usará o identificador do piso e o transform retornado pela cena para desenhar a mesma rota no modelo 3D.

## 8. Experiência do visitante

### Tela principal

Manter o fluxo atual:

```text
Abrir app
→ ler QR ou selecionar origem
→ buscar loja/banheiro/entrada
→ selecionar rota acessível ou comum
→ calcular rota
→ visualizar em 2D ou 3D
→ trocar piso quando necessário
→ confirmar chegada ou ler novo QR
```

### Novo componente 3D

Criar:

```text
components/
├── SceneMap.web.tsx
├── SceneMap.native.tsx
├── SceneRoute.tsx
├── ScenePois.tsx
└── sceneTransform.ts
```

- `SceneMap.web.tsx`: carrega o GLB com Three.js e React Three Fiber.
- `SceneMap.native.tsx`: não importa bibliotecas 3D; mostra o mapa 2D existente.
- `SceneRoute.tsx`: converte os nós da rota em segmentos por piso e desenha a rota elevada 8 cm acima do solo.
- `ScenePois.tsx`: identifica objetos por prefixo, destaca destino e permite selecionar POIs.
- `sceneTransform.ts`: contém exclusivamente a fórmula oficial de conversão de coordenadas.

### Interação 3D

A visão inicial será aérea guiada:

- Câmera ortográfica inclinada.
- Piso ativo destacado; outro piso parcialmente oculto.
- Botões de térreo/mezanino.
- Botão “Centralizar rota”.
- Clique em loja para abrir os detalhes já existentes.
- Destino com cor própria.
- Origem com marcador próprio.
- Linha de rota com segmentos separados por piso.
- Marcadores claros para elevador e escadas rolantes.
- Painel textual de instruções permanece visível.

Não haverá primeira pessoa, colisões, movimentação livre, realidade aumentada ou navegação 3D nativa em Android/iOS nesta versão.

### Fallback

O seletor terá os modos:

```text
Automático | Mapa 3D | Mapa 2D
```

No modo automático:

1. Tentar carregar WebGL, catálogo e GLB.
2. Mostrar indicador de progresso.
3. Se houver erro, indisponibilidade de WebGL ou exceder limite de carregamento, trocar para o mapa 2D.
4. Exibir aviso acessível, sem ocultar a rota ou instruções.
5. Permitir nova tentativa manual do 3D.

## 9. Painel administrativo

O painel continuará gerenciando:

- Shoppings.
- Pisos.
- Nós.
- Arestas.
- Lojas.
- Categorias.
- QR Codes.
- Bloqueios e ativação de rotas.

Adicionar uma área “Cena 3D” em modo de validação, sem edição geométrica.

Ela exibirá:

- Versão do GLB publicado.
- Data de publicação.
- Quantidade esperada e encontrada de lojas, banheiros, pisos e âncoras.
- Códigos sem correspondência no banco.
- Códigos sem correspondência no catálogo.
- Nós fora dos limites físicos do piso.
- POIs sem rota possível.
- Aviso se a rota acessível não alcançar algum destino.
- Link para abrir o visualizador web com o shopping e piso selecionados.

A edição de objeto, escala, âncora e posição 3D continuará no Shopping 3D/Blender. Isso evita que o painel crie divergência entre banco e modelo.

## 10. Publicação do modelo

O processo de publicação será:

```text
Alterar configuração/layout no Blender
→ executar testes Python do Shopping 3D
→ gerar cena headless
→ exportar GLB + catálogo
→ validar catálogo contra seed/API
→ copiar artefatos para static/models
→ executar testes backend e web
→ publicar nova versão
```

Nenhum GLB será substituído silenciosamente. Cada publicação receberá versão explícita, por exemplo:

```text
mini-shopping-v1.glb
scene-catalog-v1.json
mini-shopping-v2.glb
scene-catalog-v2.json
```

O endpoint retornará apenas a versão ativa. A anterior será mantida até a nova passar em validação.

## 11. Testes obrigatórios

### Shopping 3D

- Todas as 22 lojas possuem código, coleção, objeto e âncora.
- Todos os quatro banheiros possuem âncora.
- Entrada, elevador e escadas rolantes possuem âncoras.
- Coordenadas das âncoras ficam dentro da área caminhável.
- Exportação GLB executa no Blender headless.
- Catálogo contém todos os códigos obrigatórios.
- Renderização de referência é regenerada.
- O tamanho do GLB respeita o orçamento.

### Backend

- Migração mantém dados existentes.
- Seed do Mini Shopping é idempotente.
- Dois pisos são criados com dimensões 30 × 60 m.
- Os 22 estabelecimentos e quatro banheiros existem.
- Todos os destinos possuem nó válido.
- Todo nó possui coordenadas entre 0 e 1.
- Todas as arestas usam distância positiva.
- Rota da entrada até cada destino é possível.
- Rota acessível usa elevador e não usa escadas/escadas rolantes.
- Bloqueio de uma aresta recalcula rota alternativa ou retorna indisponibilidade.
- Endpoint `/scene` resolve todos os códigos e rejeita catálogos inválidos.

### App visitante

- QR Code posiciona o usuário no piso correto.
- Busca abre destino e calcula rota.
- Visualizador 3D usa o GLB retornado pela API.
- Rota no 3D possui os mesmos nós da rota 2D.
- Mudança de piso atualiza cena e segmento de rota.
- Destino é destacado no objeto correto.
- Clique em loja abre detalhes corretos.
- Erro do GLB ativa fallback 2D.
- Aplicativo nativo usa mapa 2D sem importar dependências Three.js.

### Teste ponta a ponta

```text
QR de entrada
→ buscar uma loja no térreo
→ calcular rota
→ abrir visualização 3D
→ confirmar destaque correto

QR de entrada
→ buscar uma loja no mezanino
→ calcular rota
→ visualizar transição de piso
→ usar elevador em rota acessível

Bloquear corredor
→ recalcular
→ confirmar rota alternativa ou indisponibilidade clara
```

## 12. Ordem de implementação

### Fase 1 — Consolidar e preservar

1. Criar a estrutura do monorepo.
2. Importar módulos canônicos com histórico.
3. Preservar referências externas fora da aplicação.
4. Consolidar documentação, AGENTS e CI.

### Fase 2 — Criar contrato espacial

1. Adicionar códigos estáveis ao backend.
2. Criar o contrato JSON de cena.
3. Documentar conversão 2D → Blender → GLB.
4. Adicionar validação de catálogo.

### Fase 3 — Preparar o modelo Blender

1. Criar âncoras técnicas.
2. Criar exportador GLB e catálogo.
3. Validar exportação no Blender headless.
4. Publicar primeiro modelo versionado.

### Fase 4 — Criar dados reais de navegação

1. Criar seed do Mini Shopping.
2. Gerar plantas 2D alinhadas.
3. Construir grafo dos dois pisos.
4. Criar QR Codes físicos.
5. Validar rotas comuns e acessíveis.

### Fase 5 — Exibir a cena no app

1. Adicionar dependências web de Three.js.
2. Criar visualizador aéreo guiado.
3. Converter e desenhar rota.
4. Adicionar seleção de piso, foco e destaques.
5. Implementar fallback 2D.

### Fase 6 — Validar e publicar

1. Executar testes backend, mobile, painel e Blender.
2. Rodar E2E com QR e rota entre pisos.
3. Inspecionar modelo no navegador e em celular.
4. Registrar evidências e limitações.
5. Publicar a versão inicial integrada.

## 13. Critérios de aceite

A integração será considerada concluída quando:

- O repositório único contiver todos os módulos canônicos.
- O Mini Shopping de dois pisos for gerado pelo Blender e publicado em GLB.
- As 22 lojas, quatro banheiros e entrada principal existirem tanto na API quanto no catálogo de cena.
- Todo destino puder ser selecionado e receber rota.
- Rotas entre térreo e mezanino funcionarem.
- Rotas acessíveis utilizarem elevador.
- QR Code localizar o visitante em um nó real do modelo.
- O mapa 3D destacar origem, destino e rota corretos.
- O mapa 2D continuar funcionando como alternativa.
- O painel identificar inconsistências entre banco, grafo e modelo.
- A geração Blender, API, app web e testes de integração passarem no CI.
