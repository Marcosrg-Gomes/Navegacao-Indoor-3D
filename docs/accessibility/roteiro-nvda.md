# Roteiro de Teste Manual com NVDA — Acessibilidade

## Contexto

O NVDA (NonVisual Desktop Access) está instalado no Windows e deve ser usado para validação manual da acessibilidade do sistema de navegação indoor. Este roteiro **não afirma** que o NVDA foi testado automaticamente pelo Playwright — os testes automatizados com axe-core cobrem apenas violações detectáveis estaticamente. A validação com NVDA deve ser feita manualmente por uma pessoa que utilize o leitor de tela.

## Ambiente

- NVDA instalado no Windows
- Navegador: Chromium/Chrome, Firefox ou Edge
- Servidor: `services/api/mini_server.py --port 8766` (rodando localmente)
- URL do visitante: `http://127.0.0.1:8766/?qr=MINI-ENTRADA-PRINCIPAL`
- URL do admin: `http://127.0.0.1:8766/admin/` (chave: `audit-local-admin-key-with-32-characters`)

## Atalhos NVDA utilizados

| Atalho | Função |
|--------|--------|
| `NVDA + N` | Abre o menu do NVDA |
| `NVDA + Q` | Sai do NVDA |
| `Ins` ou `CapsLock` (tecla NVDA) | Tecla modificadora |
| `Tecla NVDA + ↓` / `↑` | Lê o próximo/anterior objeto |
| `Tecla NVDA + Tab` | Move para o próximo elemento focável |
| `Tecla NVDA + H` | Navega por títulos |
| `Tecla NVDA + F7` | Lista de elementos (links, títulos, landmarks, campos de formulário) |
| `Tecla NVDA + Ctrl + Espaço` | Lê o conteúdo atual |
| `Tecla NVDA + B` | Lê a barra de status |

## Roteiro de testes

### 1. Página inicial do visitante

| Passo | Ação | Resultado esperado | Critério de aprovação | Evidência |
|-------|------|-------------------|----------------------|-----------|
| 1.1 | Abrir `http://127.0.0.1:8766/?qr=MINI-ENTRADA-PRINCIPAL` | Página carrega e o NVDA anuncia o título da página | Título anuncia "Mini Shopping" ou similar | |
| 1.2 | Navegar com `Tab` pelos elementos focáveis | NVDA anuncia cada elemento (botões, links, campos) | Cada elemento tem nome acessível descritivo | |
| 1.3 | Ativar `Tecla NVDA + H` para navegar por títulos | Títulos são anunciados com nível (h1, h2) | Hierarquia de títulos correta | |
| 1.4 | Clicar em "Pesquisar destinos" | Tela de Explorar é anunciada | Mudança de contexto comunicada | |
| 1.5 | Verificar o rótulo da origem | NVDA anuncia "Sua localização está em Entrada Principal, Térreo" | Origem e piso anunciados | |

### 2. Busca de destinos (Explorar)

| Passo | Ação | Resultado esperado | Critério de aprovação | Evidência |
|-------|------|-------------------|----------------------|-----------|
| 2.1 | Abrir a tela Explorar | Título h1 anunciado | Título único na página | |
| 2.2 | Buscar por nome (ex: "ADIDAS") | Resultados filtrados anunciados | Contagem de resultados anunciada | |
| 2.3 | Navegar pelos resultados com `Tab` | Cada loja tem nome, categoria, status e distância anunciados | Rótulos completos e descritivos | |
| 2.4 | Selecionar uma loja | Botão "Traçar rota" anunciado com nome da loja | Ação acessível por teclado | |

### 3. Filtros

| Passo | Ação | Resultado esperado | Critério de aprovação | Evidência |
|-------|------|-------------------|----------------------|-----------|
| 3.1 | Abrir "Filtrar e ordenar" | Dialog anuncia "Filtros e ordenação" | Dialog tem role apropriado | |
| 3.2 | Foco inicial no dialog | Foco está dentro do dialog ao abrir | Foco gerenciado corretamente | |
| 3.3 | Selecionar um filtro (ex: "Térreo") | Filtro aplicado anunciado | Mudança comunicada | |
| 3.4 | Fechar com `Escape` | Dialog fecha e foco retorna ao botão trigger | Retorno de foco correto | |
| 3.5 | Verificar botão "Remover filtro" | Botão anunciado com nome do filtro | Rótulo descritivo | |

### 4. Lojas e andares

| Passo | Ação | Resultado esperado | Critério de aprovação | Evidência |
|-------|------|-------------------|----------------------|-----------|
| 4.1 | Selecionar uma loja | Nome, categoria, piso, horário anunciados | Todas as informações relevantes comunicadas | |
| 4.2 | Trocar de piso no FloorSwitcher | "Agora exibindo o piso X" anunciado | Mudança de piso comunicada | |
| 4.3 | Verificar identificação de lojas no mapa | Lojas têm nomes e tipos anunciados | Elementos do mapa identificados | |

### 5. Rotas

| Passo | Ação | Resultado esperado | Critério de aprovação | Evidência |
|-------|------|-------------------|----------------------|-----------|
| 5.1 | Traçar uma rota | "Rota calculada até [destino], X metros, Y passos" anunciado | Anúncio de rota completo | |
| 5.2 | Verificar instruções de manobra | Próxima instrução anunciada | Instruções comunicadas | |
| 5.3 | Chegada ao destino | "Você chegou ao destino: [destino]" anunciado | Chegada comunicada | |
| 5.4 | Rota sem escadas | "(rota sem escadas)" anunciado quando aplicável | Opção de acessibilidade comunicada | |
| 5.5 | Erro de rota | "Erro na rota: [mensagem]" anunciado | Erro comunicado | |

### 6. Formulários (painel admin)

| Passo | Ação | Resultado esperado | Critério de aprovação | Evidência |
|-------|------|-------------------|----------------------|-----------|
| 6.1 | Fazer login no admin | Formulário de login acessível | Labels associados aos campos | |
| 6.2 | Navegar para Lojas/Categorias/Pisos | Tabelas e selects acessíveis | `<select>` tem label associado | |
| 6.3 | Abrir um modal (ex: Nova loja) | Foco entra no modal, título anunciado | Dialog acessível | |
| 6.4 | Fechar modal com Escape | Foco retorna ao elemento trigger | Retorno de foco correto | |

### 7. Mensagens dinâmicas

| Passo | Ação | Resultado esperado | Critério de aprovação | Evidência |
|-------|------|-------------------|----------------------|-----------|
| 7.1 | Disparar um toast (sucesso/erro) | Toast anunciado pelo NVDA | Mensagem comunicada via aria-live | |
| 7.2 | Verificar erro de validação | Erro anunciado com descrição | Mensagem de erro clara | |

### 8. Mapa indoor (prioritário)

| Passo | Ação | Resultado esperado | Critério de aprovação | Evidência |
|-------|------|-------------------|----------------------|-----------|
| 8.1 | Abrir o mapa 2D | NVDA anuncia "Mapa 2D do piso com nós e rota de navegação" | Mapa identificado como imagem | |
| 8.2 | Navegar pelos nós do mapa | Cada nó (loja, banheiro, elevador) anunciado com nome e tipo | Elementos do mapa identificados | |
| 8.3 | Verificar a posição atual | "Sua posição simulada" ou "Sua última posição confirmada" anunciado | Posicionamento comunicado | |
| 8.4 | Trocar de piso | "Agora exibindo o piso X" anunciado | Mudança de piso comunicada | |
| 8.5 | Abrir mapa 3D | "Explorar mapa 3D: arraste para mover, use a roda para aproximar" anunciado | Mapa 3D tem rótulo acessível | |

## Critérios de aprovação geral

- Todos os elementos interativos têm nomes acessíveis descritivos
- Alterações de contexto (novas telas, dialogs, mensagens) são anunciadas
- O foco é gerenciado corretamente (entrada/saída de dialogs, retorno ao trigger)
- Não há armadilhas de teclado
- Informações não são transmitidas apenas por cor

## Espaço para evidências

| Data | Testador | Navegador | Resultado | Observações |
|------|----------|-----------|-----------|-------------|
| | | | | |
| | | | | |
