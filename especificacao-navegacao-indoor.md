Abaixo está a versão atualizada do escopo com a stack tecnológica definida (Python + FastAPI, MySQL, React Native e painel admin simples) integrada nas seções de arquitetura, requisitos e plano de implementação.

Especificação Técnica: Sistema de Navegação Indoor para Shopping Centers
Versão com stack definida — Python + FastAPI, MySQL, React Native, Painel Admin leve

0. Melhorias aplicadas nesta versão
Definição clara de MVP, v1.0 e roadmap.

Critérios de aceite por requisito funcional.

Contrato de API REST para o núcleo do sistema.

Formato de dados do grafo e exemplo.

Casos de teste para o motor de navegação.

Plano de entrega por fases com marcos verificáveis.

Riscos e mitigação.

Definição de “pronto” para o MVP.

Stack tecnológica definida: Python + FastAPI, MySQL, React Native, painel admin simples.

1. Visão Geral
O projeto consiste no desenvolvimento de um sistema web e mobile de navegação indoor para shopping centers, combinando leitura de QR Code, mapa 2D e uma representação 3D simplificada do ambiente. O visitante escaneia um código fixado em um ponto físico do shopping, tem sua posição inicial reconhecida automaticamente e é guiado até lojas, banheiros, elevadores e demais pontos de interesse por meio de uma rota calculada sobre um grafo indoor.

O sistema é concebido como um MVP aplicado a uma pequena galeria ou a um trecho reduzido de um shopping, priorizando clareza visual, viabilidade técnica dentro do prazo de um TCC e possibilidade real de demonstração.

2. Referências Técnicas Analisadas
Mantidas as quatro referências originais (QRNav, indoor-navigation-system-qrcode-augmented-reality, indoor-mall-poc, OpenIndoorMaps), com a mesma análise de padrões de arquitetura, modelagem de dados e algoritmos. A convergência em torno de grafo ponderado + Dijkstra permanece como justificativa técnica para a mesma escolha neste projeto.

3. Objetivo Geral
Desenvolver um sistema web e mobile de navegação indoor para shopping centers que utilize QR Code como ponto de entrada e definição de posição inicial, mapa 2D como principal apoio visual de orientação e um ambiente 3D simplificado como reforço da experiência e da apresentação do projeto, permitindo ao usuário buscar destinos e seguir uma rota calculada automaticamente.

4. Objetivos Específicos (priorizados)
MVP (obrigatório)
Modelar uma pequena galeria ou trecho reduzido de shopping, com pelo menos um piso.

Criar um mapa 2D funcional do espaço, com corredores, lojas e pontos de referência.

Permitir o acesso ao sistema por leitura de QR Code, sem instalação de aplicativo.

Identificar a posição inicial do usuário a partir do código lido.

Permitir a busca por lojas, serviços e categorias.

Calcular rotas entre origem e destino sobre um grafo indoor ponderado.

Exibir a rota calculada no mapa 2D.

Cadastrar e manter pisos, lojas, nós, arestas e QR Codes por meio de um painel administrativo.

v1.0 (desejável)
Desenvolver uma visualização 3D simplificada, coerente com o mapa 2D.

Exibir a rota calculada também na visão 3D.

Instruções de trajeto passo a passo com texto.

Alternância entre 2D e 3D sem perder o contexto da navegação.

Roadmap (futuro)
Múltiplos pisos em produção.

Múltiplos shoppings.

Acessibilidade avançada (rotas preferenciais, instruções por voz).

Analytics de uso.

5. Escopo Funcional (com critérios de aceite)
5.1 Acesso por QR Code
O usuário acessa a aplicação ao escanear, pela câmera do próprio navegador ou aplicativo, um QR Code fixado em um ponto físico (ou simulado, para fins de demonstração) do shopping. Cada código corresponde a um único nó de navegação e funciona como um link direto para a aplicação já com a origem definida.

Critérios de aceite:

O QR Code contém um token ou ID que identifica unicamente um nó de navegação.

Ao abrir o link, o sistema carrega o mapa do piso correspondente ao nó.

O sistema define o nó como origem da rota sem intervenção manual do usuário.

Caso o QR Code seja inválido ou não exista, o sistema exibe uma mensagem clara e oferece a opção de selecionar manualmente o ponto de partida.

5.2 Identificação da Posição Inicial
Após a leitura do código, o sistema localiza o nó de navegação correspondente e o utiliza como origem de qualquer rota calculada a seguir, sem exigir que o usuário informe manualmente onde está.

Critérios de aceite:

O sistema carrega o grafo do piso e destaca o nó de origem no mapa.

O usuário pode ver o nome ou descrição do ponto de partida.

Existe um modo alternativo de seleção manual do ponto de partida, caso o QR Code não esteja disponível.

5.3 Mapa 2D
A interface apresenta um mapa 2D do piso corrente, com corredores, lojas, banheiros, elevadores, escadas, saídas e demais pontos relevantes, desenhado sobre uma planta baixa simplificada.

Critérios de aceite:

O mapa carrega em até 3 segundos em conexão 4G.

O usuário pode dar zoom e arrastar o mapa.

Lojas, corredores e pontos de interesse são visualmente distinguíveis.

A rota calculada é desenhada sobre o mapa como uma linha destacada.

5.4 Ambiente 3D Simplificado
O sistema oferece uma visão 3D do shopping obtida pela extrusão vertical dos elementos do piso (paredes, corredores, lojas), permitindo visualizar os pisos de forma empilhada e reforçando a experiência de apresentação do projeto sem exigir hardware especial ou reconstrução realista do ambiente.

Critérios de aceite:

A visão 3D representa os mesmos elementos do mapa 2D.

O usuário pode alternar entre 2D e 3D sem recarregar a página.

A rota calculada também é visível na visão 3D.

5.5 Busca por Destinos
O usuário pode pesquisar lojas, serviços e categorias — alimentação, moda, atendimento, acessibilidade, entre outras — por meio de um campo de busca textual.

Critérios de aceite:

A busca oferece sugestões automáticas enquanto o usuário digita.

A busca funciona com correspondência parcial (ex.: “pizz” encontra “Pizzaria X”).

Os resultados podem ser filtrados por categoria.

Ao selecionar um destino, o sistema calcula a rota a partir da origem atual.

5.6 Cálculo de Rotas
A aplicação calcula a rota entre origem e destino sobre um grafo indoor — nós representam pontos navegáveis do ambiente e arestas representam caminhos válidos entre eles, cada uma com um peso (distância) — utilizando o algoritmo de Dijkstra e considerando apenas arestas ativas.

Critérios de aceite:

O cálculo retorna a menor rota em termos de distância.

Arestas marcadas como inativas são ignoradas.

Se não houver rota possível, o sistema informa claramente ao usuário.

O tempo de cálculo é inferior a 1 segundo para o grafo do MVP.

5.7 Exibição de Rotas e Instruções
A rota calculada é exibida visualmente sobre o mapa 2D e, quando o modo 3D estiver ativo, também sobre a visão 3D, acompanhada de instruções textuais simples de trajeto.

Critérios de aceite:

A rota é desenhada como uma linha contínua entre origem e destino.

O usuário vê a distância total estimada.

Há instruções passo a passo (ex.: “Siga em frente por 20 m”, “Vire à esquerda”).

Ao chegar ao destino, o sistema exibe uma notificação.

5.8 Informações dos Pontos de Interesse
Cada loja ou ponto de interesse exibe nome, categoria, descrição curta, horário de funcionamento e status operacional (aberto, fechado, em manutenção).

Critérios de aceite:

Ao clicar em uma loja, o sistema exibe um painel com as informações.

O status operacional é visível antes do início da navegação.

Se o local estiver fechado, o sistema avisa o usuário.

5.9 Alternância entre 2D e 3D
O usuário pode alternar livremente entre a visualização 2D e a visão 3D a qualquer momento, sem perder o contexto da navegação em curso.

Critérios de aceite:

A alternância não recarrega a página.

A rota e o destino permanecem os mesmos após a troca de modo.

O zoom e a posição do mapa são preservados, quando possível.

5.10 Cadastro e Manutenção
Por meio de um painel administrativo, é possível cadastrar e atualizar pisos (incluindo o upload da imagem da planta baixa), lojas, nós de navegação, conexões entre nós (arestas) e QR Codes.

Critérios de aceite:

O administrador pode criar, editar e excluir pisos, lojas, nós, arestas e QR Codes.

Há validação para impedir exclusão de nós que possuem arestas associadas.

O sistema permite marcar uma aresta como inativa e reativá-la depois.

Há uma ferramenta de validação do grafo (nós isolados, arestas inválidas, etc.).

6. Escopo Não Funcional
A aplicação deve funcionar inteiramente em navegador e em aplicativo mobile, sem necessidade de duas bases de código distintas para Android e iOS.

A interface deve ser responsiva, priorizando o uso em celulares.

O sistema deve ser leve e responder rapidamente.

A solução deve ser modular e fácil de manter.

O sistema de coordenadas do mapa deve ser independente da resolução da imagem utilizada.

O projeto deve permitir expansão futura para múltiplos pisos e, eventualmente, múltiplos shoppings.

O mapa 2D e o ambiente 3D devem ser coerentes entre si.

A navegação deve ser intuitiva e visualmente clara.

O sistema deve funcionar nos navegadores modernos mais usados em dispositivos móveis.

7. Requisitos Funcionais (com prioridade)
ID	Descrição	Prioridade
RF01	Permitir acesso ao sistema por meio da leitura de um QR Code.	Alta
RF02	Identificar a posição inicial do usuário a partir do QR Code lido.	Alta
RF03	Exibir um mapa 2D do piso corrente do shopping.	Alta
RF04	Exibir uma representação 3D simplificada do ambiente.	Média
RF05	Permitir a busca de lojas, serviços e categorias por texto.	Alta
RF06	Listar destinos filtrados por categoria.	Média
RF07	Calcular a rota entre origem e destino utilizando Dijkstra.	Alta
RF08	Exibir visualmente o trajeto calculado sobre o mapa 2D e 3D.	Alta
RF09	Permitir a alternância entre a visualização 2D e 3D.	Média
RF10	Exibir informações de cada ponto de interesse.	Alta
RF11	Informar ao usuário quando ele chegar ao destino selecionado.	Média
RF12	Permitir o cadastro e a atualização de pisos, lojas, nós, arestas e QR Codes.	Alta
RF13	Permitir que o administrador marque uma aresta como temporariamente indisponível.	Média
8. Requisitos Não Funcionais (com métricas)
ID	Descrição	Métrica / critério
RNF01	A aplicação deve ser executada em navegador e em app mobile (React Native).	Sem duas bases de código para Android e iOS.
RNF02	A interface deve ser responsiva, priorizando smartphones.	Layout testado em resoluções de 360x640 a 414x896.
RNF03	O sistema deve carregar e responder rapidamente.	Mapa carrega em ≤ 3s; rota calcula em ≤ 1s.
RNF04	O sistema de coordenadas do mapa deve ser independente da resolução.	Coordenadas normalizadas entre 0 e 1.
RNF05	A arquitetura deve ser modular.	Separação clara entre frontend, backend e dados.
RNF06	O mapa 2D e a visão 3D devem representar consistentemente os mesmos dados.	Mesmos nós, arestas e pontos de interesse.
RNF07	A navegação deve funcionar de forma confiável.	Sem dependência de conectividade de alta largura.
RNF08	O sistema deve funcionar nos navegadores modernos mais utilizados.	Chrome, Safari, Firefox, Edge (últimas 2 versões).
RNF09	A interface deve ser simples o suficiente para uso sem treinamento.	Teste de usabilidade com 5 usuários sem instrução.
9. Regras de Negócio
RN01 – Cada QR Code deve estar vinculado a exatamente um nó de navegação do shopping.

RN02 – Todo destino exibido ao usuário deve estar previamente cadastrado no sistema.

RN03 – Uma rota só pode ser calculada entre nós válidos e conectados do grafo de navegação.

RN04 – O destino escolhido deve pertencer ao mesmo shopping em que o usuário iniciou a navegação.

RN05 – Quando houver mais de um piso, o cálculo de rota deve considerar escadas, elevadores ou escadas rolantes como conexões entre pisos.

RN06 – Cada ponto de interesse deve possuir, no mínimo, nome, categoria e status operacional.

RN07 – O sistema não deve gerar rotas que passem por áreas marcadas como não navegáveis ou por arestas inativas.

RN08 – O mapa 2D e a visão 3D devem representar os mesmos pontos principais do ambiente.

RN09 – Caso um local esteja indisponível (fechado, em manutenção), isso deve ser indicado ao usuário antes ou durante a navegação.

RN10 – O MVP pode se limitar a uma pequena galeria ou a um único piso, sem prejuízo da validade das demais regras.

RN11 – Uma aresta do grafo marcada como inativa não deve ser considerada pelo motor de cálculo de rotas até que seja reativada.

10. Atores
Visitante
Usuário final que escaneia o QR Code, busca destinos e é guiado pela rota calculada. Não realiza nenhum tipo de cadastro.

Administrador
Responsável pelo cadastro e manutenção dos dados do shopping: pisos (incluindo a planta baixa), lojas e pontos de interesse, nós de navegação, conexões entre nós (arestas) e QR Codes — incluindo a possibilidade de marcar temporariamente uma conexão como indisponível.

Apoio Técnico
Perfil opcional, destinado a testes, validação do ambiente de demonstração e verificação da integridade do grafo de navegação antes de uma apresentação.

11. Modelo de Dados
Entidade	Atributos principais	Relacionamentos
Shopping	id, nome, endereço	1 shopping → N pisos
Piso	id, shoppingId, nome/nível, imagem da planta baixa	1 piso → N nós de navegação
Nó de Navegação	id, pisoId, coordX, coordY (normalizadas, 0 a 1), tipo	1 nó → N arestas; 0-1 QR Code; 0-1 loja/POI
Aresta	id, nóOrigemId, nóDestinoId, distância, orientação, acessível, ativa	relação reflexiva entre dois nós
Loja / Ponto de Interesse	id, nóId, nome, categoria, descrição, horário, status	N lojas → 1 categoria; 1 loja → 1 nó
Categoria	id, nome	1 categoria → N lojas
QR Code	id, código/token, nóId, descrição, link	1 QR Code → 1 nó
Rota (calculada)	origem, destino, sequência de nós, distância total, instruções	não persistida por padrão
12. Arquitetura Proposta
12.1 Visão em Camadas
Camada de apresentação (frontend):

Aplicativo mobile em React Native (Android + iOS com uma única base de código).

Painel administrativo web simples (React ou HTML/JS servido pelo FastAPI).

Camada de aplicação (backend): API REST em Python + FastAPI.

Camada de dados (persistência): Banco relacional MySQL.

Motor de navegação: Componente em Python responsável por montar o grafo a partir dos dados cadastrados e calcular o caminho mais curto entre dois nós (Dijkstra).

12.2 Stack Tecnológica Definida
Camada	Tecnologia	Justificativa
Backend/API	Python + FastAPI	Entrega endpoints REST com validação automática (Pydantic), é rápido de implementar e testar, e integra facilmente com MySQL.
Banco de Dados	MySQL	Banco relacional amplamente adotado, com bom suporte a consultas e integridade referencial para o modelo de dados do projeto.
App Mobile	React Native	Permite desenvolver para Android e iOS com uma única base de código JavaScript/TypeScript, aproveitando conhecimento prévio em JS e atendendo ao RNF01.
Painel Admin	Web simples (React ou HTML/JS)	Não exige framework pesado para CRUD de piso/nó/aresta/QR Code; pode ser servido diretamente pelo FastAPI como arquivos estáticos.
12.3 Contrato de API (exemplo)
Método	Endpoint	Descrição
GET	/api/shoppings	Lista shoppings cadastrados.
GET	/api/shoppings/{id}/floors	Lista pisos de um shopping.
GET	/api/floors/{id}/graph	Retorna o grafo do piso (nós e arestas).
POST	/api/routes	Calcula rota entre origem e destino.
GET	/api/pois	Lista pontos de interesse (com filtros).
POST	/api/admin/nodes	Cria um nó de navegação.
POST	/api/admin/edges	Cria uma aresta entre dois nós.
POST	/api/admin/qr-codes	Cria um QR Code vinculado a um nó.
12.4 Decisões de Interpretação (Ambiguidades Resolvidas)
Algoritmo de cálculo de rota: adotado o algoritmo de Dijkstra sobre um grafo ponderado. Justificativa: três dos quatro repositórios analisados implementam exatamente essa combinação de forma independente, indicando ser a solução mais direta e comprovadamente suficiente para grafos indoor do porte de uma galeria ou de um shopping de pequeno/médio porte.

Sistema de coordenadas: adotadas coordenadas locais normalizadas (0 a 1), em vez de coordenadas geográficas reais (latitude/longitude). Justificativa: o ambiente é interno e não depende de GPS; coordenadas normalizadas relativas à imagem do piso são mais simples de cadastrar e independem da resolução da imagem, como observado no projeto indoor-navigation-system-qrcode-augmented-reality. Coordenadas geográficas reais — caminho seguido por OpenIndoorMaps — tornam-se relevantes apenas se o projeto precisar futuramente combinar rotas externas (chegar até o shopping) com rotas internas.

Técnica de representação 3D: adotada a extrusão vertical dos pisos, e não a realidade aumentada. Justificativa: realidade aumentada com âncoras espaciais (observada no projeto indoor-navigation-system-qrcode-augmented-reality) exige calibração física prévia do ambiente e hardware compatível, o que é incompatível com o prazo e o propósito de demonstração de um MVP acadêmico; a extrusão de pisos entrega uma experiência 3D coerente com o mapa 2D usando apenas os mesmos dados já cadastrados.

Local de execução do motor de navegação: recomendado o cálculo no lado do servidor (FastAPI) para o MVP. Justificativa: com Python + FastAPI, é simples expor um endpoint /api/routes que recebe origem e destino e retorna a rota calculada, centralizando a lógica e facilitando testes e validações.

13. Fluxo Principal do Usuário
O visitante encontra um QR Code fixado em um ponto físico (ou simulado) do shopping.

Ele escaneia o código pela câmera do smartphone, diretamente pelo navegador ou aplicativo.

A aplicação abre automaticamente, sem necessidade de instalação (web) ou com abertura direta do app (mobile).

O sistema identifica o nó de navegação correspondente ao código lido e o define como origem.

O mapa 2D é carregado, centralizado na posição inicial do usuário.

O usuário busca ou seleciona um destino — loja, serviço ou categoria.

O sistema calcula a rota mais curta entre origem e destino, considerando apenas as arestas ativas do grafo.

A rota é exibida visualmente sobre o mapa 2D e, se o modo 3D estiver ativo, também sobre a visão 3D simplificada.

O usuário segue as instruções até o destino e é notificado ao chegar.

14. Melhorias Propostas para o MVP
Coordenadas normalizadas (0 a 1) em vez de pixels absolutos.

Atributo de disponibilidade por aresta (“ativa”/“inativa”).

Estrutura de dados pronta para múltiplos shoppings.

Busca com sugestões automáticas.

Instrução textual associada a cada aresta.

Modo alternativo de seleção manual do ponto de partida.

Cadastro de conexões entre nós como etapa administrativa explícita.

15. Escopo do MVP
15.1 Entra no MVP
Pequena galeria ou um único piso do shopping.

Conjunto reduzido de lojas e serviços, cadastrados manualmente.

Leitura de QR Code para definição da posição inicial.

Mapa 2D funcional, com corredores, lojas e pontos de referência.

Busca textual por lojas, serviços e categorias.

Cálculo de rota por grafo, com Dijkstra, considerando arestas ativas.

Exibição da rota e instruções básicas de trajeto.

Painel administrativo simples para cadastro de pisos, nós, arestas, lojas e QR Codes.

Backend em Python + FastAPI com endpoints REST.

Banco de dados MySQL.

App mobile em React Native (Android + iOS).

15.2 Fica fora do MVP
Posicionamento contínuo por sensores (Bluetooth/BLE, Wi-Fi ou visão computacional).

Realidade aumentada com âncoras espaciais.

Aplicativo nativo separado para Android e iOS (duas bases de código).

Integração com meios de pagamento.

Suporte simultâneo a múltiplos shoppings em produção.

Entregas automatizadas por robôs, autenticação biométrica sem contato e analytics avançado de tráfego de clientes.

16. Plano de Entrega por Fases
Fase 1 — Núcleo de navegação (2–3 semanas)
Configuração do ambiente Python + FastAPI.

Modelagem do banco de dados MySQL.

Cadastro de pisos, nós e arestas via API.

Implementação do motor de navegação (Dijkstra) em Python.

Testes de cálculo de rotas via endpoint /api/routes.

Fase 2 — Mapa 2D e QR Code (2–3 semanas)
Leitura de QR Code no aplicativo React Native.

Renderização do mapa 2D com imagem de fundo.

Desenho da rota calculada sobre o mapa.

Busca de destinos via API.

Fase 3 — Painel administrativo (1–2 semanas)
Telas de cadastro de pisos, lojas, nós, arestas e QR Codes (React ou HTML/JS).

Validação do grafo.

Marcação de arestas como ativas/inativas.

Fase 4 — Visão 3D e polimento (2–3 semanas)
Implementação da extrusão 2.5D.

Alternância entre 2D e 3D.

Instruções passo a passo.

Testes de usabilidade e correções.

17. Riscos e Mitigação
Risco	Impacto	Mitigação
Escopo 3D consumir tempo excessivo	Alto	Tratar 3D como funcionalidade opcional; entregar 2D primeiro.
Dificuldade em modelar o grafo	Médio	Ferramenta de validação; documentação clara do formato.
QR Code não funcionar em alguns dispositivos	Médio	Oferecer seleção manual do ponto de partida.
Dados inconsistentes no painel administrativo	Médio	Validações e mensagens de erro claras.
Curva de aprendizado em React Native	Médio	Começar com funcionalidades básicas (leitura de QR, mapa 2D) e evoluir gradualmente.
18. Definição de “Pronto” para o MVP
O MVP é considerado pronto quando:

Um visitante consegue escanear um QR Code, buscar uma loja e seguir uma rota até ela no mapa 2D (via app React Native ou navegador).

O administrador consegue cadastrar pisos, nós, arestas, lojas e QR Codes pelo painel admin.

O backend em FastAPI calcula rotas corretamente e ignora arestas inativas.

O banco MySQL armazena e recupera os dados de forma consistente.

Não há erros críticos em testes de usabilidade com 5 usuários.