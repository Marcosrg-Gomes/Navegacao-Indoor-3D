# Explicação da Arquitetura e Tecnologias — Apresentação do TCC

Este documento serve de apoio para o apresentador explicar a arquitetura e as tecnologias durante a apresentação, com detalhes técnicos suficientes para responder perguntas da banca.

---

## 1. Visão Geral da Arquitetura

### Princípio Central: Separação de Responsabilidades

| Camada | Responsabilidade | Fonte da verdade |
|--------|-----------------|------------------|
| **API (FastAPI)** | Navegação: identidades, disponibilidade, QR Codes, grafos, distâncias, bloqueios, rotas | Dados de navegação |
| **Blender** | Geometria: arquitetura, objetos, posições, modelo 3D | Geometria publicada |
| **Contrato de Cena** | Ponte entre API e Blender: scene-catalog-v1.json | Correspondência dados ↔ geometria |

O aplicativo do visitante **nunca** possui coordenadas ou IDs físicos duplicados manualmente. Todas as posições vêm da API via contrato de cena.

---

## 2. Monorepo — Estrutura de Pastas

```
Navegacao-Indoor-3D/
├── apps/visitor/          # Expo / React Native / Expo Web (visitante)
├── apps/admin/            # React / Vite (painel administrativo)
├── services/api/          # FastAPI, SQLAlchemy, seed, testes
├── packages/shopping-3d/  # Gerador procedural Blender
├── packages/scene-contract/ # Validador compartilhado, JSON Schema
├── assets/models/mini-shopping/ # GLB, catálogo, plantas
├── assets/qr/             # 7 QR Codes portáteis + folha para impressão
├── docs/                  # Documentação técnica e acadêmica
└── evidence/              # Evidências de testes e capturas
```

---

## 3. Backend — FastAPI

### Tecnologias
- **FastAPI**: Framework web assíncrono para Python
- **SQLAlchemy**: ORM para mapeamento objeto-relacional
- **SQLite**: Banco temporário para demonstração isolada
- **MySQL**: Banco para produção/institucional

### Principais Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/shoppings` | GET | Lista shoppings cadastrados |
| `/api/floors` | GET | Lista pisos de um shopping |
| `/api/nodes` | GET | Lista nós navegáveis de um piso |
| `/api/edges` | GET | Lista arestas (conexões entre nós) |
| `/api/routes` | POST | Calcula rota com Dijkstra (bloqueios, acessibilidade) |
| `/api/routes/distances` | GET | Retorna distâncias em metros a partir da origem |
| `/api/shoppings/{id}/scene` | GET | Contrato de cena (GLB, pisos, POIs, âncoras) |
| `/api/shoppings/{id}/scene/validation` | GET | Valida consistência banco/catálogo/GLB |
| `/api/qr-codes/{token}` | GET | Identifica nó por token de QR Code |
| `/api/diagnostics/events` | POST | Registra eventos de diagnóstico anônimos |
| `/api/admin/audit` | GET | Consulta histórico de alterações admin |

### Algoritmo de Dijkstra
- Executado no servidor, não no cliente
- Percorre grafo de nós ativos
- Respeita sentido das arestas, bloqueios temporários e acessibilidade
- Rotas sem escadas excluem escadas e escadas rolantes

### Revisão do Shopping
- Consultada pelo app ativo a cada 2 segundos (mais latência de rede)
- Detecta bloqueios, reaberturas e mudanças de cadastro
- Provoca recálculo automático da rota quando necessário
- A chegada confere a revisão novamente e recusa trajeto desatualizado

---

## 4. Frontend Visitante — Expo (React Native)

### Tecnologias
- **Expo**: Framework React Native com suporte a Web, Android, iOS
- **React Navigation**: Navegação entre telas
- **AsyncStorage**: Persistência local (favoritos, recentes, dispensa de ajuda)
- **Three.js + React Three Fiber**: Visualização 3D (web apenas, carregamento sob demanda)
- **zustand**: Gerenciamento de estado

### Telas Principais

| Tela | Funcionalidade |
|------|---------------|
| Inicial | Busca de destino, informação de posição, ação de navegação |
| Explorar | Busca por nome/categoria/tipo, filtros, ordenação |
| Leitura QR | Identificação de origem por token, código manual, seleção manual |
| Mapa 2D | Planta SVG com nós, rota, marcador, zoom, pan, escala em metros |
| Mapa 3D | Visualização aérea do GLB (web), origem/destino/rota destacados |
| Navegação | Próximo passo, distância restante, piso, simulação |
| Simulação | Marcador percorrendo trajeto, pausa, continuação, encerramento |

### Comportamento de Navegação
- Posição atualizada apenas por QR Code, seleção manual ou confirmação de chegada
- Sem rastreamento contínuo ou medição de deslocamento físico
- Ao confirmar chegada, o destino torna-se nova origem da sessão
- Mapa abre o piso correto para o novo destino
- Trajeto concluído desaparece após confirmação de chegada

---

## 5. Mapa 2D e 3D

### Mapa 2D (SVG)
- Renderizado sobre a planta do piso
- Nós, arestas, rota, marcador de origem (verde), destino (vermelho), posição (azul)
- Rótulos de lojas posicionados para evitar colisões
- Escala em metros, indicação de norte (sempre para cima)
- Zoom, pan, escala, retorno à posição, centralização de rota

### Mapa 3D (GLB + Three.js)
- Modelo GLB publicado pelo Blender
- Câmera ortográfica inclinada
- Rota elevada 8 cm acima do solo
- Segmentos de rota separados por piso
- Marcador aponta para cima (0° ou 180°), sem rotação lateral durante curvas
- Inversão de 180° apenas quando próximo trecho está atrás do usuário
- Câmera 3D atrás do usuário normalmente, na frente quando mapa invertido

### Simulação
- Percorre arestas do grafo, não linha livre
- Interpolação entre nós consecutivos do mesmo piso
- Mudança de piso apenas em ligação vertical válida (escada, escada rolante, elevador)
- Identificado como "modo demonstração — posição simulada"
- Não solicita Bluetooth, localização do aparelho ou novas permissões

---

## 6. Rotas Acessíveis

- Rota sem escadas: exclui escadas e escadas rolantes, usa elevador
- Pode produzir caminho mais longo; se não houver alternativa, informa inexistência
- Escadas rolantes: nós próprios, arestas verticais unidirecionais, pesos em metros
- Elevador: bidirecional, conecta térreo e mezanino
- Trocas de piso identificam acesso e pisos, com instruções estruturadas por etapa

---

## 7. Painel Administrativo — React/Vite

### Telas
Login, Dashboard, Shoppings, Pisos, Editor de Nós, Arestas, Lojas, Categorias, QR Codes, Validação, Cena 3D, Auditoria

### Funcionalidades
- Cadastro, edição e exclusão de shoppings, pisos, nós, arestas, lojas, categorias, QR Codes
- Validação de integridade do grafo: nós isolados, arestas inválidas, referências órfãs
- Validação de cena 3D: correspondência entre catálogo, banco e rotas (sem edição geométrica)
- Auditoria: histórico de alterações com autor, UTC, motivo, antes/depois

### Segurança
- X-Audit-Reason obrigatório (3-240 caracteres) em todas as escritas admin
- Auditoria atômica: alteração e histórico na mesma transação
- Chaves individuais opcionais para identificar administradores

---

## 8. Modelagem 3D — Blender

### Tecnologias
- **Blender 4.5.14 LTS**: Modelagem e exportação
- **GLB**: Formato binário glTF com compressão Draco
- **Orçamento**: Até 25 MiB por GLB

### Mini Shopping
- 2 pisos: térreo (z=0) e mezanino (z=4,7m)
- Dimensões: 30 × 60 m por piso
- 22 lojas, 4 banheiros, entrada principal, escadas rolantes, elevador panorâmico

### Processo de Publicação
1. Blender gera GLB (com Draco) e scene-catalog-v1.json
2. O catálogo contém transforms por piso, POIs, âncoras, arestas físicas, tokens QR
3. O publicador valida o catálogo contra a API (hash, tamanho, cabeçalho, nomes no GLB)
4. Publica ativos estáticos para consumo do frontend
5. Nenhum GLB é substituído silenciosamente; cada publicação recebe versão explícita

---

## 9. Banco de Dados — Modelo de Dados

### Entidades Principais

| Entidade | Atributos principais |
|----------|---------------------|
| Shopping | Código estável, identificação |
| Piso | Nível, dimensões, planta |
| Nó | Coordenadas (0-1), tipo, status ativo |
| Aresta | Distância, sentido, acessibilidade, status |
| Loja | Categoria, horário, status operacional, nó vinculado |
| Categoria | Nome, agrupamento |
| QRCode | Token, nó vinculado |
| Auditoria | Autor, UTC, motivo, antes/depois |
| Diagnosticos | Contadores por tipo e código de falha |

### Persistência
- SQLite: banco temporário a cada execução da demonstração
- MySQL: produção, requer .env com DATABASE_URL, ADMIN_API_KEY, SECRET_KEY
- Favoritos/recentes: AsyncStorage local (códigos estáveis, sem posição)

---

## 10. QR Codes e Localização de Origem

- 7 QR Codes portáteis (tokens) em assets/qr/
- Cada código associado a um nó específico do shopping
- Leitura define o ponto de referência como origem
- Opção de código manual e seleção manual da origem
- Após confirmação de chegada, o local torna-se nova origem da sessão
- Posição não é persistida entre sessões
- Não há rastreamento contínuo: apenas QR, seleção manual e chegada confirmada mudam a origem

---

## 11. Diferenciais do Projeto

1. **Separação clara API × Blender**: API como fonte de verdade da navegação, Blender como fonte da geometria, contrato de cena como elo único
2. **QR Codes de baixo custo**: Sem necessidade de beacons, Wi-Fi, RFID ou sensores físicos
3. **Mapas 2D e 3D consistentes**: Norte sempre para cima, inversão de 180° apenas quando necessário
4. **Rotas acessíveis**: Exclusão de escadas/escadas rolantes, uso de elevador entre pisos
5. **Simulação identificada**: Modo demonstração explícito, sem se passar por rastreamento real
6. **Auditoria administrativa**: Registro atômico de alterações com motivo obrigatório
7. **Fallback 2D**: Quando WebGL/GLB falha, mapa 2D permanece funcional
