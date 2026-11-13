# Roteiro Completo de Fala — Apresentação do TCC Navegação Indoor 3D

**Data:** 26/11/2026 | **Tempo total:** 15-20 min apresentação + 10 min perguntas
**Estrutura:** 18 slides | **Apresentador:** [Nome do Autor]

---

## INTRODUÇÃO (Slides 1-3)

### Slide 1 — Capa (0:30)

"Boa tarde, membros da banca. Apresento o Trabalho de Conclusão de Curso Navegação Indoor 3D, desenvolvido no curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas da UTFPR. Este trabalho propõe um sistema de orientação interna para shopping centers, utilizando mapas bidimensionais e tridimensionais, cálculo de rotas sobre grafo de nós, identificação de origem por QR Code e um painel administrativo integrado."

---

### Slide 2 — Introdução / Problema (1:00)

"Ambientes internos de grandes edifícios, como shopping centers, hospitais e aeroportos, apresentam desafios distintos da navegação ao ar livre. O Sistema de Posicionamento Global (GPS) não funciona de forma confiável em espaços fechados devido à atenuação do sinal por estruturas de concreto, vidro e metal, além da impossibilidade de recepção de sinais de satélite em áreas subterrâneas ou cobertas.

Shopping centers, em particular, combinam múltiplos pisos, corredores extensos, lojas distribuídas, banheiros, praças de alimentação e acessos verticais como escadas, escadas rolantes e elevadores. A ausência de sinalização adequada ou a dificuldade de localizar rapidamente um estabelecimento pode gerar desconforto, perda de tempo e redução da experiência do visitante. Para pessoas com mobilidade reduzida, a barreira é ainda maior, pois é necessário identificar rotas acessíveis que evitem escadas e utilizem elevadores ou rampas.

Este trabalho descreve o desenvolvimento do sistema Navegação Indoor 3D, concebido como Trabalho de Conclusão de Curso. O sistema oferece ao visitante ferramentas para se localizar dentro de um shopping center modelo, buscar estabelecimentos e serviços, calcular rotas sobre um grafo de nós, visualizar o trajeto em mapas bidimensionais (2D) e tridimensionais (3D), e acompanhar uma simulação de navegação. Um painel administrativo permite a gestão de lojas, nós, arestas, pisos, categorias, QR Codes e a validação da integridade do grafo de navegação."

---

### Slide 3 — Justificativa e Objetivos (1:00)

"A justificativa deste trabalho reside em oferecer uma alternativa de baixo custo, baseada em QR Codes impressos e um grafo de navegação mantido por uma API, sem necessidade de hardware de posicionamento instalado no ambiente. Soluções comerciais existentes frequentemente dependem de beacons Bluetooth, varredura de Wi-Fi ou sensores físicos, que elevam o custo de implantação e manutenção, além de exigirem infraestrutura adicional no local.

O Mini Shopping utilizado como estudo de caso possui dois pisos (térreo e mezanino), 22 lojas, quatro banheiros, entrada principal, escadas rolantes e elevador, representando um cenário suficiente para validar rotas comuns e acessíveis entre pisos. A solução se destina a ser demonstrada em ambiente controlado, com validação física presencial pendente de execução em aparelhos reais.

Os objetivos específicos do trabalho incluem: implementar uma API REST (FastAPI) como fonte de verdade para shoppings, pisos, nós, arestas, lojas, categorias, QR Codes e cálculo de rotas por algoritmo de Dijkstra, respeitando bloqueios, acessibilidade e hierarquia de dados; criar um contrato de cena versionado (catálogo JSON e modelo GLB gerado pelo Blender) que estabeleça a correspondência entre os dados da API e a geometria 3D do ambiente; desenvolver um aplicativo do visitante (Expo/React Native) com leitura de QR Code, busca de destinos, cálculo e visualização de rotas em mapas 2D e 3D, simulação de navegação, troca de pisos e painel de instruções; desenvolver um painel administrativo (React/Vite) para cadastro de pisos, nós, arestas, lojas e QR Codes, além da validação da consistência da cena 3D e auditoria de alterações; e validar o sistema por meio de testes automatizados (backend, frontend, E2E), documentando os limites da validação, incluindo a validação física pendente em aparelhos reais."

---

## DESENVOLVIMENTO (Slides 4-13)

### Slide 4 — Metodologia (1:00)

"O desenvolvimento seguiu uma abordagem organizada em fases, com repositório monolítico (monorepo) contendo o backend, os dois frontends, os pacotes de modelagem 3D e o contrato de cena. As principais etapas foram: primeiro, levantamento de requisitos e definição da arquitetura; segundo, implementação do backend FastAPI com banco de dados e seed do Mini Shopping; terceiro, modelagem 3D do ambiente no Blender e exportação do GLB e catálogo de cena; quarto, desenvolvimento do aplicativo do visitante em Expo; quinto, desenvolvimento do painel administrativo em React/Vite; e sexto, execução de testes automatizados e de integração, com registro de evidências. Nenhuma funcionalidade foi declarada como concluída sem evidência correspondente no código ou nos testes."

---

### Slide 5 — Fundamentação Teórica (1:00)

"A navegação indoor refere-se ao conjunto de técnicas e tecnologias utilizadas para localizar pessoas ou objetos dentro de edifícios, onde os sinais de satélite (GPS) não estão disponíveis ou são imprecisos. Diferentemente da navegação externa, que pode confiar em coordenadas geográficas absolutas, a navegação interna depende de referências locais, como pontos de acesso Wi-Fi, beacons Bluetooth, tags NFC, QR Codes, sensores inerciais ou mapas pré-estabelecidos do ambiente.

No contexto deste trabalho, a navegação é baseada em um grafo de nós que representa os pontos navegáveis do ambiente: entradas, corredores, acessos a lojas, banheiros, escadas e elevadores. O cálculo de rota utiliza o algoritmo de Dijkstra, executado no backend, garantindo que o trajeto respeite a conectividade real do grafo, bloqueios de arestas e restrições de acessibilidade, como a exclusão de escadas e escadas rolantes em rotas acessíveis. A posição do visitante é identificada por leitura de QR Code, escolha manual ou confirmação de chegada, não havendo rastreamento contínuo ou medição de deslocamento físico em tempo real."

---

### Slide 6 — Arquitetura do Sistema (1:30)

"O projeto é organizado como um monorepo com as seguintes pastas principais: apps/visitor, que é o aplicativo do visitante em Expo / React Native / Expo Web; apps/admin, que é o painel administrativo em React / Vite; services/api, que é o backend FastAPI com SQLAlchemy, seed e testes; packages/shopping-3d, que é o gerador procedural Blender com histórico preservado; e packages/scene-contract, que é o validador compartilhado sem dependências e com JSON Schema.

A separação de responsabilidades segue o princípio de que a API é a fonte da navegação — identidades, disponibilidade, QR Codes, grafos, distâncias, bloqueios e rotas — e o Blender é a fonte da geometria publicada. O catálogo de cena é o único elo permitido entre API e modelo 3D; o aplicativo nunca possui coordenadas ou IDs físicos duplicados manualmente em componentes React."

---

### Slide 7 — Tecnologias Utilizadas (1:00)

"O sistema utiliza as seguintes tecnologias: FastAPI como backend, servindo como fonte de verdade para a navegação; SQLAlchemy como ORM, com suporte a SQLite para demonstração isolada e MySQL para produção; Expo (React Native) para o aplicativo do visitante, com suporte a Web, Android e iOS; React com Vite para o painel administrativo; Three.js e React Three Fiber para visualização 3D apenas na web; Blender 4.5.14 LTS para modelagem 3D, geração do GLB com compressão Draco e catálogo de cena; QR Code para identificação de origem, sendo uma alternativa de baixo custo; e AsyncStorage para persistência local de favoritos e destinos recentes, sem armazenar credenciais ou posição física."

---

### Slide 8 — Backend e APIs (FastAPI) (1:00)

"O backend é implementado em FastAPI com SQLAlchemy, servindo como fonte de verdade para a navegação. Os principais endpoints incluem: GET /api/shoppings para listar shoppings cadastrados; GET /api/floors, /api/nodes e /api/edges para dados de navegação; POST /api/routes para cálculo de rota entre origem e destino usando Dijkstra, respeitando bloqueios e acessibilidade; GET /api/routes/distances para retornos de distâncias em metros a partir de uma origem; GET /api/shoppings/{id}/scene para o contrato de cena, incluindo modelo GLB, pisos, POIs e âncoras; GET /api/shoppings/{id}/scene/validation para validação de consistência entre banco, catálogo e modelo 3D; e GET /api/qr-codes/{token} para identificar o nó associado a um token de QR Code.

O cálculo de rotas utiliza o algoritmo de Dijkstra executado no servidor, percorrendo o grafo de nós ativos, respeitando o sentido das arestas, bloqueios temporários e preferência de acessibilidade. Rotas sem escadas excluem escadas e escadas rolantes. A revisão do estado do shopping é consultada periodicamente pelo aplicativo ativo — a cada dois segundos, mais latência de rede — para detectar bloqueios, reaberturas e mudanças de cadastro, provocando recálculo automático da rota quando necessário."

---

### Slide 9 — Banco de Dados e Persistência (0:45)

"O banco de dados utiliza SQLAlchemy como ORM, com suporte a SQLite para demonstração isolada e MySQL para produção. As principais entidades são: Shopping, com identificação e código estável; Piso, que representa o andar do shopping com nível, dimensões e planta; Nó, que é um ponto navegável com coordenadas normalizadas entre zero e um, tipo e status ativo; Aresta, que é uma conexão entre dois nós com distância, sentido, acessibilidade e status; Loja, estabelecimento vinculado a um nó com categoria, horário e status operacional; Categoria, agrupamento de lojas; QRCode, token vinculado a um nó para identificação de origem; e Auditoria, registro atômico de alterações administrativas com autor, UTC, motivo e antes/depois.

Todas as escritas administrativas exigem o cabeçalho X-Audit-Reason, com 3 a 240 caracteres codificado em URL, registrando identificação autenticada, data e hora UTC, motivo e estado antes/depois de forma atômica. As tabelas aditivas auditoria e diagnósticos são criadas na inicialização da API. Favoritos e até oito destinos recentes por shopping são persistidos localmente via AsyncStorage, usando apenas códigos estáveis — nunca IDs do banco, posição ou credenciais."

---

### Slide 10 — Aplicativo do Visitante (Expo) (1:30)

"O aplicativo do visitante é desenvolvido em Expo (React Native) com suporte a Web, Android e iOS. As principais telas e funcionalidades são: tela inicial com busca de destino, informação de posição (piso, origem da confirmação e horário) e ação principal de navegação; tela Explorar com busca por nome, categoria e tipo, filtros por piso, categoria, funcionamento e percurso sem escadas, e ordenação por nome, categoria, piso atual ou distância do grafo; leitura de QR Code para identificação da origem por token, com opção de código manual e seleção manual da origem; mapa 2D com planta do piso, nós, rota, marcador de posição, zoom, pan e escala em metros; mapa 3D com visualização aérea guiada do modelo GLB, apenas na web, com origem, destino e rota destacados; navegação com painel de instruções (próximo passo, distância restante, piso), simulação de caminhada, pausa, continuação e encerramento; simulação com marcador percorrendo o trajeto da API, modo demonstração explicitamente identificado, não equivalente a geolocalização real; favoritos e recentes com até 100 favoritos e 8 destinos recentes por shopping, persistidos localmente via AsyncStorage; e acessibilidade com rota sem escadas usando elevador, alvos de toque com pelo menos 44 px e suporte a teclado e leitores de tela, com validação física ainda pendente.

O aplicativo resolve SceneMap.web.tsx no navegador e SceneMap.native.tsx em Android/iOS. O módulo Three.js é carregado sob demanda por importação dinâmica somente no web. O render usa câmera ortográfica inclinada, com ocultação de coberturas e isolamento de materiais de objetos para que o destaque de uma loja não afete outras."

---

### Slide 11 — Mapas 2D e 3D — Navegação (1:00)

"O mapa 2D, renderizado em SVG sobre a planta do piso, exibe nós, arestas, rota, marcador de origem em verde, destino em vermelho e posição do visitante em azul. Os rótulos de lojas são posicionados para evitar colisões, priorizando origem, destino e acessos entre pisos. O mapa inclui escala em metros e indicação de norte.

O mapa 3D utiliza o modelo GLB publicado com câmera ortográfica inclinada. A rota é desenhada elevada 8 cm acima do solo, com segmentos separados por piso. O marcador de posição sempre aponta para a parte superior da tela, sem rotação lateral durante curvas. O mapa inverte 180° apenas quando o próximo trecho da rota está atrás do usuário, garantindo que o trajeto fique sempre à frente da seta. A câmera 3D fica atrás do usuário normalmente, ou na frente quando o mapa está invertido, preservando inclinação, perspectiva, zoom e troca de andares.

A simulação de navegação percorre as arestas do grafo, não uma linha livre sobre a planta. Cada quadro interpola entre dois nós consecutivos do mesmo piso; a mudança de piso ocorre somente em uma ligação vertical válida, como escada, escada rolante ou elevador. O simulador é explicitamente identificado como 'modo demonstração — posição simulada' e não solicita Bluetooth, localização do aparelho ou novas permissões."

---

### Slide 12 — Rotas Acessíveis e Troca de Pisos (0:45)

"A rota sem escadas exclui escadas e escadas rolantes, usando o elevador para transição entre pisos. Pode produzir um caminho mais longo; se não houver alternativa disponível, informa que não encontrou rota. Escadas rolantes têm nós próprios, arestas verticais unidirecionais e pesos em metros medidos entre âncoras. O elevador é bidirecional. Rotas acessíveis excluem escadas e escadas rolantes mesmo se uma aresta for marcada como acessível. O motor consulta o grafo atual a cada cálculo.

Trocas de piso identificam o acesso e os pisos, com instruções estruturadas por etapa. Por exemplo, uma rota da entrada para o BURGER KING no mezanino instrui o usuário a utilizar o elevador panorâmico, com identificação do acesso entre pisos no painel de navegação."

---

### Slide 13 — Painel Administrativo (0:45)

"O painel administrativo permite ao operador gerenciar os dados de navegação e validar a consistência do sistema. As telas implementadas são: login, com autenticação por chave de API administrativa; dashboard, com visão geral de estatísticas e integridade do grafo; shoppings, para cadastro, edição e exclusão; pisos, para gerenciamento de andares, dimensões métricas e plantas baixas; editor de nós, para criação, edição, exclusão e reposicionamento de nós sobre a planta; arestas, para cadastro de conexões entre nós com distância, sentido e acessibilidade; lojas, para cadastro de estabelecimentos vinculados a nós e categorias; categorias, para gerenciamento de categorias de lojas; QR Codes, para geração e gestão de tokens vinculados a nós; validação, para análise de integridade do grafo, detectando nós isolados, arestas inválidas e referências órfãs; cena 3D, para validação da correspondência entre catálogo, banco e rotas, sem edição geométrica; e auditoria, para histórico de alterações administrativas e falhas de navegação.

Toda escrita administrativa requer o cabeçalho X-Audit-Reason com 3 a 240 caracteres. A alteração e seu histórico são gravados na mesma transação. Restaurações de edições usam as validações atuais e recusam conflitos com alterações posteriores."

---

## RESULTADOS E CONCLUSÃO (Slides 14-17)

### Slide 14 — Testes e Validação (1:00)

"Os testes automatizados abrangem o backend, o frontend e a integração entre ambos. Os resultados observados incluem: 129 testes de backend aprovados, com 1 teste ignorado condicionalmente por exigir MySQL; 9 testes de Blender/Python aprovados, com lint, formatação e compilação aprovados; 1.149 amostras de geometria real, sem obstáculos nem falta de piso no grafo horizontal; exportação headless com 1.909 objetos e GLB de 3.488.904 bytes, dentro do orçamento de 25 MiB; visitante web com TypeScript e exportação Expo aprovados, com Draco servido localmente; Android/iOS com exportações Hermes aprovadas, mas sem instalação em emulador ou aparelho físico; painel com TypeScript e build Vite aprovados; 7 testes E2E integrados aprovados no Chromium; e 8 testes de regressão aprovados.

A validação de integração verificou fluxos ponta a ponta no navegador, incluindo QR da entrada, busca de destino, rota, GLB real retornado pela API, mesmos nós em 3D e na linha SVG, confirmação de chegada, rota acessível pelo elevador, troca para o mezanino, bloqueio com indisponibilidade clara, restauração de aresta, falha do GLB com mapa 2D, WebGL indisponível com preservação da origem, e clique na geometria de uma loja.

Os limites da validação incluem: MySQL não executado localmente; Android/iOS exportados sem instalação em aparelho físico; leitura óptica de QR Codes, câmera real e teste com visitantes pendentes; navegadores Firefox, WebKit, Chrome instalado e Edge não testados; TalkBack/VoiceOver e fonte ampliada no sistema dependem do roteiro físico; e vulnerabilidades nas cadeias de dependências (29 no visitante, 4 no painel) não tratadas com atualização ampla."

---

### Slide 15 — Resultados Obtidos (0:45)

"O sistema Navegação Indoor 3D foi implementado conforme planejado, entregando um aplicativo do visitante com mapas 2D e 3D, cálculo de rotas sobre grafo de nós, identificação de origem por QR Code, simulação de navegação e um painel administrativo para gerenciamento e validação. Os principais resultados são: sistema funcional com backend FastAPI, aplicativo Expo (Web/Android/iOS) e painel React/Vite integrados e executando em ambiente local; mapas 2D e 3D com renderização de planta 2D em SVG e cena 3D em GLB, com origem, destino, rota e marcador de posição; rotas entre pisos comuns e acessíveis entre térreo e mezanino, utilizando elevador para acessibilidade e excluindo escadas e escadas rolantes em rotas acessíveis; simulação em modo demonstração com marcador percorrendo o trajeto da API, explicitamente identificado como simulação, sem rastreamento físico; painel administrativo com cadastro de shoppings, pisos, nós, arestas, lojas, categorias e QR Codes, com validação de integridade do grafo e auditoria de alterações; e contrato de cena com catálogo JSON e modelo GLB versionados, publicados pelo Blender e validados pelo publicador da API.

Um cenário reproduzível é: Entrada → NATURA (confirmação de chegada) → ANACAPRI. Após a confirmação de chegada na NATURA, o nó da loja torna-se a origem da próxima rota, o trajeto concluído desaparece e o mapa abre o piso correto para o novo destino."

---

### Slide 16 — Limitações e Trabalhos Futuros (0:45)

"O sistema apresenta as seguintes limitações, identificadas com base nas evidências e documentação do projeto: validação física pendente, incluindo leitura óptica de QR Codes, câmera real, teste com visitantes, TalkBack/VoiceOver, rede móvel e desempenho em aparelho físico, com roteiro preparado em docs/teste-fisico-visitante.md; MySQL não executado localmente, com validação utilizando banco SQLite temporário; nenhuma instalação em emulador ou aparelho físico Android/iOS realizada, com exportações nativas validando apenas a compilação, não a experiência de uso; navegadores Firefox, WebKit, Chrome instalado e Edge não testados, com testes E2E utilizando Chromium do Playwright; vulnerabilidades nas cadeias de dependências (29 no visitante e 4 no painel) não tratadas com atualização ampla de Expo/Vite neste trabalho; hospedagem, domínio e credenciais de produção não definidos; a localização é atualizada apenas por QR Code, seleção manual ou confirmação de chegada, sem rastreamento contínuo do deslocamento físico do visitante; e a simulação não mede posição física real, com o marcador percorrendo o trajeto da API em modo demonstração explícito.

Os trabalhos futuros incluem: execução do roteiro de teste físico em aparelhos Android e iOS, incluindo leitura óptica de QR Codes impressos, TalkBack/VoiceOver e uso caminhando; homologação do banco de dados MySQL em ambiente de produção; tratamento das vulnerabilidades de dependências (Expo/Vite) antes de implantação pública; definição de hospedagem, domínio e credenciais de produção; possível substituição do gerenciamento de banco por Alembic para migrations estruturadas, registrada como dívida técnica; e avaliação de acessibilidade normativa de edificação real, não certificada por este trabalho que valida apenas o modelo virtual."

---

### Slide 17 — Conclusão e Contribuições (0:30)

"O Navegação Indoor 3D foi desenvolvido como sistema integrado de orientação interna para shopping centers, com foco no Mini Shopping como estudo de caso. O sistema atende aos requisitos funcionais definidos: identificação de origem por QR Code, busca de destinos, cálculo de rotas sobre grafo de nós pelo backend, visualização em mapas 2D e 3D, simulação de navegação, troca de pisos e painel administrativo com validação de integridade do grafo. Os testes automatizados realizados cobrem backend, frontend, integração, layout, acessibilidade e regras de negócio, com resultados aprovados nas suítes executadas.

As principais contribuições deste trabalho são: primeiro, a separação clara entre API como fonte de verdade da navegação e Blender como fonte da geometria, mediada pelo contrato de cena versionado; segundo, o uso de QR Codes como mecanismo de baixo custo para identificação de origem, sem necessidade de beacons ou sensores físicos; e terceiro, a orientação consistente dos mapas 2D e 3D, com norte sempre para cima e inversão de 180° apenas quando o próximo trecho da rota está atrás do usuário."

---

### Slide 18 — Perguntas da Banca

"Estamos à disposição para responder às perguntas da banca."

---

## TEMPO TOTAL ESTIMADO

| Seção | Slides | Tempo |
|-------|--------|-------|
| Introdução | 1-3 | 2:30 |
| Desenvolvimento | 4-13 | 9:00 |
| Resultados e Conclusão | 14-17 | 3:30 |
| Perguntas | 18 | 10:00 |
| **Total** | | **~25:00** |

**Nota:** Se o tempo for excedido, comprimir slides 10, 11 e 14 (mais densos em conteúdo técnico).
