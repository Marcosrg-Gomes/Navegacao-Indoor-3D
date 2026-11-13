# Sequência de Demonstração Prática — Apresentação do TCC

**Data:** 26/11/2026 | **Ambiente:** Demonstração local isolada (SQLite temporário, sem MySQL, sem Docker)
**URLs de acesso:** Visitante: http://127.0.0.1:8766/?qr=MINI-ENTRADA-PRINCIPAL | Painel: http://127.0.0.1:8766/admin/

---

## Pré-requisitos para a Demonstração

Antes de iniciar a apresentação, garantir que:

1. O servidor mini_server.py esteja rodando na porta 8766
2. Os builds do visitante e admin estejam gerados (`npm run build:web` e `npm run build`)
3. O navegador esteja aberto na URL do visitante com o QR da entrada
4. O painel administrativo esteja acessível em uma aba separada
5. Nenhuma janela desnecessária esteja aberta no computador de apresentação

---

## Sequência Passo a Passo (cerca de 8-10 minutos)

### Passo 1 — Abertura e Tela Inicial (1:30)

**Ação:** Abrir `http://127.0.0.1:8766/?qr=MINI-ENTRADA-PRINCIPAL`

**O que mostrar:**
- Tela inicial do aplicativo do visitante
- Informação de posição: piso (térreo), origem (QR da entrada), horário de atualização
- Barra de busca de destinos

**O que falar:**
"O visitante inicia a jornada lendo o QR Code da entrada principal. O sistema identifica a origem, exibe o piso atual (térreo) e o horário da confirmação. A partir daqui, o visitante pode buscar qualquer destino cadastrado."

---

### Passo 2 — Busca e Seleção de Destino (1:00)

**Ação:** Clicar em "Pesquisar destinos" ou "Explorar destinos", digitar "NATURA" ou "ADIDAS", selecionar o resultado.

**O que mostrar:**
- Tela de busca/Explorar com resultados filtrados
- Detalhes do destino selecionado (nome, piso, categoria, horário de funcionamento)
- Botão "Ir" para iniciar navegação

**O que falar:**
"O visitante pesquisa por nome ou categoria. O sistema exibe os resultados com informações de piso, categoria e horário de funcionamento. Ao selecionar um destino, o visitante pode iniciar a navegação diretamente."

---

### Passo 3 — Cálculo de Rota e Visualização (1:30)

**Ação:** Clicar em "Ir" para iniciar navegação para o destino selecionado.

**O que mostrar:**
- Painel de navegação com próximo passo, distância restante e piso
- Mapa 2D com rota traçada (origem verde, destino vermelho, rota azul)
- Marcador de posição na aresta atual do grafo

**O que falar:**
"O sistema calcula a rota usando o algoritmo de Dijkstra no backend. O mapa 2D exibe o trajeto completo, com o marcador de posição fixado na aresta atual do grafo. O painel de navegação mostra o próximo passo, a distância restante e o piso atual."

---

### Passo 4 — Troca de Piso e Rota Acessível (1:30)

**Ação:** Iniciar uma nova rota da entrada para uma loja no mezanino (ex.: BURGER KING), selecionando "Rota sem escadas".

**O que mostrar:**
- Instrução indicando o elevador para troca de piso
- Rota que usa o elevador panorâmico, não escadas/escadas rolantes
- Mapa mostrando o mezanino como destino

**O que falar:**
"Para acessar o mezanino, o sistema sugere o elevador panorâmico, mantendo a acessibilidade. A rota sem escadas exclui escadas e escadas rolantes, podendo produzir um caminho mais longo, mas garantindo acesso para pessoas com mobilidade reduzida."

---

### Passo 5 — Simulação de Navegação (1:30)

**Ação:** Iniciar a simulação de navegação (marcador percorrendo o trajeto).

**O que mostrar:**
- Marcador azul percorrendo a rota no mapa
- Próximo passo destacado no painel de instruções
- Opções de pausa, continuação e novo destino

**O que falar:**
"A simulação de navegação move o marcador ao longo das arestas do grafo. É importante ressaltar que isto é um modo demonstração explícito — o marcador percorre o trajeto da API, mas não mede a posição física real do visitante. Não há rastreamento contínuo."

---

### Passo 6 — Confirmação de Chegada e Nova Rota (1:00)

**Ação:** Clicar em "Cheguei ao destino" quando o marcador chegar ao destino.

**O que mostrar:**
- Tela de confirmação de chegada
- O destino selecionado torna-se nova origem da sessão
- O mapa abre o piso correto para uma nova rota

**O que falar:**
"Ao confirmar a chegada, o destino se torna a nova origem da sessão. Isso permite encadear navegações, por exemplo: Entrada → NATURA (chegada) → ANACAPRI. Cada nova rota parte do local onde o visitante chegou."

---

### Passo 7 — Painel Administrativo (1:00)

**Ação:** Abrir `http://127.0.0.1:8766/admin/` em outra aba.

**O que mostrar:**
- Login com chave administrativa
- Dashboard com estatísticas (shoppings, pisos, nós, arestas, lojas, categorias, QR Codes)
- Validação de cena 3D
- Histórico de auditoria

**O que falar:**
"O painel administrativo permite ao operador gerenciar todos os dados de navegação e validar a consistência do sistema. O dashboard exibe estatísticas gerais, e a validação de cena verifica a correspondência entre o banco de dados, o catálogo JSON e o modelo GLB."

---

### Passo 8 — Encerramento da Demonstração (0:30)

**Ação:** Retornar à tela do visitante e resumir as funcionalidades mostradas.

**O que falar:**
"Demonstramos: identificação de origem por QR Code, busca de destinos, cálculo de rotas com Dijkstra, visualização em mapas 2D e 3D, rotas acessíveis entre pisos, simulação de navegação, confirmação de chegada e painel administrativo com validação de integridade."

---

## Script de Contingência (se algo falhar)

| Problema | Solução |
|----------|---------|
| Servidor não responde | Verificar se mini_server.py está rodando na porta 8766 |
| Mapa 3D não carrega | Usar mapa 2D (fallback automático); explicar que WebGL pode não estar disponível |
| QR Code não lê (demo local) | O QR já está na URL (?qr=MINI-ENTRADA-PRINCIPAL); não é necessário câmera na demo web |
| Build desatualizado | Executar `npm run build:web` e `npm run build` antes da apresentação |
| Painel não carrega | Verificar se o build do admin foi gerado em services/api/app/static/admin |

---

## Orientações para Apresentar sem Improvisação

1. **Nunca navegue sem roteiro:** Siga a sequência acima passo a passo
2. **Não clique em itens não planejados:** Mantenha o foco nas funcionalidades demonstradas
3. **Se algo der erro, mantenha a calma:** Use o script de contingência e explique a limitação
4. **Não invente funcionalidades:** Se algo não estiver implementado, diga que é um trabalho futuro
5. **Use as capturas da pasta evidence/ como backup:** Se a demonstração ao vivo falhar, mostre as capturas de tela prontas
6. **Respeite o tempo:** A demonstração prática deve durar cerca de 8-10 minutos
7. **Prepare o ambiente com antecedência:** Teste a demonstração pelo menos uma vez antes da apresentação
