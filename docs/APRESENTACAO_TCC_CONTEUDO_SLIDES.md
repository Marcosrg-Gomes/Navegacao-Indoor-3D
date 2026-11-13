# Conteúdo Detalhado por Slide — Apresentação do TCC

## Slide 1 — Capa
**Elementos visuais:** Logotipo da UTFPR, título centralizado, curso, autor, orientador, local/data.

**Texto na tela:**
- UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ
- Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas
- NAVEGAÇÃO INDOOR 3D
- Sistema de orientação interna para shopping centers com mapas 2D e 3D, cálculo de rotas e painel administrativo integrado
- Trabalho de Conclusão de Curso
- Autor: [Nome do Autor] | Orientador: [Nome do Orientador]
- Santo André / 2026

**Roteiro de fala:** (30 segundos)
"Boa tarde, membros da banca. Apresento o Trabalho de Conclusão de Curso Navegação Indoor 3D, desenvolvido no curso de Análise e Desenvolvimento de Sistemas da UTFPR. Este trabalho propõe um sistema de orientação interna para shopping centers, utilizando mapas bidimensionais e tridimensionais, cálculo de rotas sobre grafo de nós, identificação de origem por QR Code e um painel administrativo integrado."

---

## Slide 2 — Introdução / Problema
**Elementos visuais:** Imagem de shopping center ou diagrama comparando GPS externo vs navegação indoor.

**Texto na tela:**
- GPS não funciona de forma confiável em ambientes fechados (concreto, vidro, metal)
- Shopping centers: múltiplos pisos, corredores extensos, lojas distribuídas
- Dificuldade de orientação gera desconforto, perda de tempo, redução da experiência
- Pessoas com mobilidade reduzida precisam de rotas acessíveis (elevador, sem escadas)
- Objetivo: solução de baixo custo, sem beacons ou sensores físicos

**Roteiro de fala:** (1 minuto)
"Ambientes internos de grandes edifícios, como shopping centers, apresentam desafios distintos da navegação ao ar livre. O GPS não funciona de forma confiável dentro de edifícios devido à atenuação do sinal por estruturas de concreto, vidro e metal. Em shopping centers, com múltiplos pisos e corredores extensos, os visitantes frequentemente têm dificuldade para localizar estabelecimentos. Para pessoas com mobilidade reduzida, a barreira é ainda maior, pois é necessário identificar rotas acessíveis que evitem escadas. Este trabalho propõe uma alternativa de baixo custo, baseada em QR Codes impressos e um grafo de navegação mantido por uma API, sem necessidade de hardware de posicionamento instalado no ambiente."

---

## Slide 3 — Justificativa e Objetivos
**Elementos visuais:** Dois quadrantes: esquerda "Justificativa", direita "Objetivos".

**Texto na tela — Justificativa:**
- Alternativa de baixo custo vs beacons Bluetooth/Wi-Fi/RFID
- Não exige infraestrutura adicional no local
- Mini Shopping como estudo de caso (2 pisos, 22 lojas, 4 banheiros)
- Validação de rotas comuns e acessíveis entre pisos

**Texto na tela — Objetivos:**
- Geral: Sistema integrado de navegação indoor com mapas 2D/3D, cálculo de rotas, QR Code, simulação e painel admin
- Específicos: API FastAPI, contrato de cena (JSON+GLB), app visitante (Expo), painel admin (React/Vite), testes automatizados

**Roteiro de fala:** (1 minuto)
"A justificativa deste trabalho reside em oferecer uma alternativa de baixo custo, sem necessidade de beacons, Wi-Fi ou sensores físicos. O Mini Shopping utilizado como estudo de caso possui dois pisos, térreo e mezanino, 22 lojas, quatro banheiros, entrada principal, escadas rolantes e elevador — um cenário suficiente para validar rotas comuns e acessíveis entre pisos. Os objetivos específicos incluem: implementar uma API REST (FastAPI) como fonte de verdade; criar um contrato de cena versionado com catálogo JSON e modelo GLB gerado pelo Blender; desenvolver o aplicativo do visitante em Expo; desenvolver o painel administrativo em React/Vite; e validar por meio de testes automatizados."

---

## Slide 4 — Metodologia
**Elementos visuais:** Linha do tempo com 6 fases.

**Texto na tela:**
- Fase 1: Levantamento de requisitos e definição de arquitetura
- Fase 2: Implementação do backend FastAPI com banco de dados e seed
- Fase 3: Modelagem 3D no Blender e exportação do GLB e catálogo
- Fase 4: Desenvolvimento do aplicativo do visitante em Expo
- Fase 5: Desenvolvimento do painel administrativo em React/Vite
- Fase 6: Testes automatizados e de integração, registro de evidências
- Abordagem: monorepo, API como fonte de verdade, Blender como fonte de geometria

**Roteiro de fala:** (1 minuto)
"O desenvolvimento seguiu uma abordagem organizada em seis fases, dentro de um repositório monolítico (monorepo) contendo backend, dois frontends, pacotes de modelagem 3D e contrato de cena. As fases foram: levantamento de requisitos e arquitetura; implementação do backend FastAPI com banco de dados e seed do Mini Shopping; modelagem 3D no Blender e exportação do GLB e catálogo de cena; desenvolvimento do aplicativo do visitante em Expo; desenvolvimento do painel administrativo em React/Vite; e execução de testes automatizados e de integração, com registro de evidências. Nenhuma funcionalidade foi declarada como concluída sem evidência correspondente no código ou nos testes."

---

## Slide 5 — Fundamentação Teórica
**Elementos visuais:** Diagrama simples de grafo com nós e arestas.

**Texto na tela:**
- Navegação indoor: técnicas para localizar pessoas dentro de edifícios sem GPS
- Baseado em grafo de nós (entradas, corredores, lojas, banheiros, escadas, elevadores)
- Algoritmo de Dijkstra executado no backend para cálculo de rotas
- Posição identificada por QR Code, escolha manual ou confirmação de chegada
- Sem rastreamento contínuo ou medição de deslocamento físico em tempo real

**Roteiro de fala:** (1 minuto)
"A navegação indoor refere-se ao conjunto de técnicas utilizadas para localizar pessoas dentro de edifícios, onde os sinais de satélite não estão disponíveis. No contexto deste trabalho, a navegação é baseada em um grafo de nós que representa os pontos navegáveis do ambiente. O cálculo de rota utiliza o algoritmo de Dijkstra, executado no backend, garantindo que o trajeto respeite a conectividade real do grafo, bloqueios de arestas e restrições de acessibilidade. A posição do visitante é identificada por leitura de QR Code, escolha manual ou confirmação de chegada. Não há rastreamento contínuo nem medição de deslocamento físico em tempo real."

---

## Slide 6 — Arquitetura do Sistema
**Elementos visuais:** Diagrama de blocos: apps/visitor ↔ services/api ↔ apps/admin, com packages/shopping-3d e assets/models conectados via contrato de cena.

**Texto na tela:**
- Monorepo: apps/visitor (Expo), apps/admin (React/Vite), services/api (FastAPI), packages/shopping-3d (Blender), packages/scene-contract (JSON Schema)
- API = fonte da navegação (identidades, disponibilidade, QR Codes, grafos, rotas)
- Blender = fonte da geometria publicada
- Contrato de cena (scene-catalog-v1.json) = único elo entre API e modelo 3D
- App nunca possui coordenadas ou IDs físicos duplicados manualmente

**Roteiro de fala:** (1 minuto e 30 segundos)
"O projeto é organizado como um monorepo com cinco pastas principais. O aplicativo do visitante roda em Expo/React Native, o painel administrativo em React/Vite, o backend em FastAPI com SQLAlchemy, a modelagem 3D em Blender e o contrato de cena como validador compartilhado. O princípio central da arquitetura é a separação de responsabilidades: a API é a fonte da navegação — identidades, disponibilidade, QR Codes, grafos, distâncias, bloqueios e rotas. O Blender é a fonte da geometria publicada. O catálogo de cena é o único elo permitido entre API e modelo 3D. O aplicativo nunca possui coordenadas ou IDs físicos duplicados manualmente em componentes React."

---

## Slide 7 — Tecnologias Utilizadas
**Elementos visuais:** Tabela com tecnologia e justificativa.

**Texto na tela:**
| Tecnologia | Uso |
|------------|-----|
| FastAPI | Backend, fonte de verdade da navegação |
| SQLAlchemy | ORM, banco de dados (SQLite demo / MySQL produção) |
| Expo (React Native) | Aplicativo do visitante (Web, Android, iOS) |
| React + Vite | Painel administrativo |
| Three.js / React Three Fiber | Visualização 3D (web apenas) |
| Blender 4.5.14 LTS | Modelagem 3D, geração do GLB e catálogo |
| QR Code | Identificação de origem (baixo custo) |
| AsyncStorage | Favoritos e recentes (local, sem credenciais) |

**Roteiro de fala:** (1 minuto)
"O sistema utiliza FastAPI como backend com SQLAlchemy como ORM, suportando SQLite para demonstração isolada e MySQL para produção. O aplicativo do visitante é desenvolvido em Expo com suporte a Web, Android e iOS. O painel administrativo usa React com Vite. Para a visualização 3D, usamos Three.js e React Three Fiber apenas na web. A modelagem 3D é feita no Blender 4.5.14 LTS, que gera o GLB com compressão Draco e o catálogo de cena. QR Codes são usados para identificação de origem, sendo uma alternativa de baixo custo. Favoritos e destinos recentes são persistidos localmente via AsyncStorage, sem armazenar credenciais ou posição física."

---

## Slide 8 — Backend e APIs (FastAPI)
**Elementos visuais:** Lista de endpoints principais.

**Texto na tela:**
- GET /api/shoppings — Lista shoppings
- GET /api/floors, /api/nodes, /api/edges — Dados de navegação
- POST /api/routes — Cálculo de rota com Dijkstra (bloqueios, acessibilidade)
- GET /api/routes/distances — Distâncias em metros a partir da origem
- GET /api/shoppings/{id}/scene — Contrato de cena (GLB, pisos, POIs)
- GET /api/shoppings/{id}/scene/validation — Validação de consistência
- GET /api/qr-codes/{token} — Identifica nó por token de QR Code
- Revisão do shopping consultada a cada 2 segundos (app ativo)

**Roteiro de fala:** (1 minuto)
"O backend FastAPI serve como fonte de verdade para a navegação. Os principais endpoints incluem listagem de shoppings, pisos, nós e arestas; cálculo de rota via POST /api/routes usando Dijkstra, respeitando bloqueios e acessibilidade; retornos de distância em metros; contrato de cena com GLB, pisos e POIs; validação de consistência entre banco, catálogo e modelo 3D; e identificação de origem por token de QR Code. A revisão do estado do shopping é consultada periodicamente pelo aplicativo ativo — a cada dois segundos, mais latência de rede — para detectar bloqueios, reaberturas e mudanças de cadastro, provocando recálculo automático da rota quando necessário."

---

## Slide 9 — Banco de Dados e Persistência
**Elementos visuais:** Diagrama simplificado de entidades (Shopping, Piso, Nó, Aresta, Loja, Categoria, QRCode, Auditoria).

**Texto na tela:**
- Entidades: Shopping, Piso, Nó, Aresta, Loja, Categoria, QRCode, Auditoria, Diagnosticos
- SQLite: demonstração isolada, banco temporário a cada execução
- MySQL: ambiente de produção/institucional
- X-Audit-Reason: cabeçalho obrigatório em escritas admin (3-240 caracteres)
- Auditoria atômica: autor, UTC, motivo, antes/depois
- Favoritos/recentes: AsyncStorage local (apenas códigos estáveis, sem posição)

**Roteiro de fala:** (45 segundos)
"O banco de dados utiliza SQLAlchemy como ORM, com suporte a SQLite para demonstração isolada e MySQL para produção. As principais entidades são: Shopping, Piso, Nó, Aresta, Loja, Categoria, QRCode, Auditoria e Diagnosticos. Todas as escritas administrativas exigem o cabeçalho X-Audit-Reason, com 3 a 240 caracteres, registrando identificação autenticada, data/hora UTC, motivo e estado antes/depois de forma atômica. As tabelas aditivas auditoria e diagnósticos são criadas na inicialização da API. Favoritos e até oito destinos recentes por shopping são persistidos localmente via AsyncStorage, usando apenas códigos estáveis — nunca IDs do banco, posição ou credenciais."

---

## Slide 10 — Aplicativo do Visitante (Expo)
**Elementos visuais:** Capturas de tela do app (tela inicial, mapa 2D, mapa 3D, Explorar).

**Texto na tela:**
- Telas: Inicial, Explorar, Leitura QR, Mapa 2D, Mapa 3D, Navegação, Simulação
- QR Code: definição de origem, opção de código manual, seleção manual
- Mapa 2D: planta SVG com nós, rota, marcador, zoom, pan, escala em metros
- Mapa 3D: visualização aérea do GLB (web), origem/destino/rota destacados
- Navegação: próximo passo, distância restante, piso, simulação, pausa/continuação
- Favoritos: até 100 por shopping; recentes: até 8 por shopping
- Acessibilidade: rota sem escadas, alvos ≥ 44 px, suporte a teclado

**Roteiro de fala:** (1 minuto e 30 segundos)
"O aplicativo do visitante oferece telas de inicial, Explorar, leitura de QR Code, mapa 2D, mapa 3D, navegação e simulação. A leitura de QR Code identifica a origem, com opção de código manual e seleção manual da origem. O mapa 2D renderiza a planta SVG com nós, arestas, rota, marcador de posição, zoom, pan e escala em metros. O mapa 3D, disponível na web, utiliza o modelo GLB publicado com origem, destino e rota destacados. A navegação exibe o próximo passo, distância restante e piso, com simulação de caminhada, pausa, continuação e encerramento. Favoritos permitem até 100 por shopping e recentes até 8, persistidos localmente. Em acessibilidade, a rota sem escadas usa elevador, alvos de toque têm pelo menos 44 px e há suporte a teclado e leitores de tela (validação física pendente)."

---

## Slide 11 — Mapas 2D e 3D — Navegação
**Elementos visuais:** Comparativo lado a lado: mapa 2D e mapa 3D com rota.

**Texto na tela:**
- Mapa 2D (SVG): planta do piso, origem verde, destino vermelho, rota azul, posição azul
- Mapa 3D (GLB): câmera ortográfica inclinada, rota elevada 8 cm acima do solo
- Norte sempre para cima; inversão de 180° apenas quando próximo trecho está atrás
- Segmentos de rota separados por piso
- Mudança de piso apenas em ligação vertical válida (escada, escada rolante, elevador)
- Simulação: interpolação entre nós, não rastreamento físico

**Roteiro de fala:** (1 minuto)
"O mapa 2D, renderizado em SVG sobre a planta do piso, exibe nós, arestas, rota, marcador de origem (verde), destino (vermelho) e posição do visitante (azul), com escala em metros e indicação de norte. O mapa 3D utiliza o modelo GLB publicado com câmera ortográfica inclinada; a rota é desenhada elevada 8 cm acima do solo, com segmentos separados por piso. O marcador de posição sempre aponta para a parte superior da tela, sem rotação lateral durante curvas. O mapa inverte 180° apenas quando o próximo trecho da rota está atrás do usuário. A simulação percorre as arestas do grafo, interpolando entre nós consecutivos do mesmo piso; a mudança de piso ocorre somente em uma ligação vertical válida. O simulador é explicitamente identificado como 'modo demonstração — posição simulada' e não solicita Bluetooth, localização do aparelho ou novas permissões."

---

## Slide 12 — Rotas Acessíveis e Troca de Pisos
**Elementos visuais:** Diagrama mostrando térreo → elevador → mezanino.

**Texto na tela:**
- Rota sem escadas: exclui escadas e escadas rolantes, usa elevador entre pisos
- Pode produzir caminho mais longo; se não houver alternativa, informa inexistência
- Escadas rolantes: nós próprios, arestas verticais unidirecionais, pesos em metros
- Elevador: bidirecional, conecta térreo e mezanino
- Trocas de piso identificam acesso e pisos, com instruções estruturadas por etapa
- Exemplo: Entrada → BURGER KING (mezanino) via elevador

**Roteiro de fala:** (45 segundos)
"A rota sem escadas exclui escadas e escadas rolantes, usando o elevador para transição entre pisos. Pode produzir um caminho mais longo; se não houver alternativa disponível, informa que não encontrou rota. Escadas rolantes têm nós próprios, arestas verticais unidirecionais e pesos em metros medidos entre âncoras. O elevador é bidirecional. Trocas de piso identificam o acesso e os pisos, com instruções estruturadas por etapa. Por exemplo, uma rota da entrada para o BURGER KING no mezanino instrui o usuário a utilizar o elevador panorâmico, com identificação do acesso entre pisos no painel de navegação."

---

## Slide 13 — Painel Administrativo
**Elementos visuais:** Capturas de tela do painel (login, dashboard, validação de cena).

**Texto na tela:**
- Telas: Login, Dashboard, Shoppings, Pisos, Editor de Nós, Arestas, Lojas, Categorias, QR Codes, Validação, Cena 3D, Auditoria
- Validação de integridade do grafo: nós isolados, arestas inválidas, referências órfãs
- Validação de cena 3D: correspondência entre catálogo, banco e rotas
- Auditoria: histórico de alterações (autor, UTC, motivo, antes/depois)
- X-Audit-Reason obrigatório em todas as escritas admin

**Roteiro de fala:** (45 segundos)
"O painel administrativo permite ao operador gerenciar os dados de navegação e validar a consistência do sistema. As telas implementadas incluem login, dashboard com estatísticas e integridade do grafo, cadastro de shoppings, pisos, editor de nós, arestas, lojas, categorias, QR codes, validação de integridade do grafo, validação de cena 3D e auditoria. A validação de integridade detecta nós isolados, arestas inválidas e referências órfãs. A validação de cena 3D verifica a correspondência entre catálogo, banco e rotas, sem edição geométrica. Toda escrita administrativa requer o cabeçalho X-Audit-Reason, com motivo de 3 a 240 caracteres, registrando auditoria atômica."

---

## Slide 14 — Testes e Validação
**Elementos visuais:** Tabela resumindo resultados de testes.

**Texto na tela:**
- Backend: 129 testes aprovados (1 ignorado — requer MySQL)
- Blender/Python: 9 testes aprovados; lint e formatação aprovados
- Geometria real: 1.149 amostras, sem obstáculos no grafo horizontal
- Exportação headless: 1.909 objetos, GLB 3.488.904 bytes (orçamento 25 MiB)
- Visitante web: TypeScript e exportação Expo aprovados; Draco servido localmente
- Android/iOS: exportações Hermes aprovadas (sem teste em dispositivo físico)
- Painel: TypeScript e build Vite aprovados
- E2E integrados: 7 testes Chromium aprovados; 8 regressão aprovados
- Validação física (QR, câmera, TalkBack, MySQL): pendente de execução presencial

**Roteiro de fala:** (1 minuto)
"Os testes automatizados abrangem backend, frontend e integração. O backend teve 129 testes aprovados, com 1 ignorado por exigir MySQL. Blender/Python teve 9 testes aprovados com lint e formatação OK. A geometria real foi validada com 1.149 amostras sem obstáculos no grafo horizontal. A exportação headless gerou 1.909 objetos e um GLB de 3.488.904 bytes, dentro do orçamento de 25 MiB. O visitante web passou em TypeScript e exportação Expo, com Draco servido localmente. As exportações Android/iOS Hermes foram aprovadas, mas sem instalação em dispositivo físico. O painel passou em TypeScript e build Vite. Os testes E2E integrados tiveram 7 testes Chromium aprovados e 8 de regressão. A validação física — leitura óptica de QR, câmera real, TalkBack/VoiceOver, MySQL local — permanece pendente de execução presencial."

---

## Slide 15 — Resultados Obtidos
**Elementos visuais:** Captura da rota Entrada → NATURA → ANACAPRI.

**Texto na tela:**
- Sistema funcional: backend FastAPI, app Expo (Web/Android/iOS), painel React/Vite integrados
- Mapas 2D e 3D: planta SVG e cena GLB com origem, destino, rota, marcador
- Rotas entre pisos: comum e acessível (elevador, sem escadas/escadas rolantes)
- Simulação: marcador percorrendo trajeto da API, modo demonstração, sem rastreamento físico
- Painel admin: cadastro, validação de grafo, auditoria de alterações
- Contrato de cena: catálogo JSON e GLB versionados, publicados pelo Blender
- Exemplo de rota: Entrada → NATURA (chegada) → ANACAPRI

**Roteiro de fala:** (45 segundos)
"O sistema foi implementado conforme planejado, entregando um aplicativo do visitante com mapas 2D e 3D, cálculo de rotas sobre grafo de nós, identificação de origem por QR Code, simulação de navegação e um painel administrativo para gerenciamento e validação. Os principais resultados incluem: sistema funcional com backend, app e painel integrados; mapas 2D e 3D com origem, destino, rota e marcador; rotas entre pisos comuns e acessíveis utilizando elevador; simulação identificada como modo demonstração, sem rastreamento físico; painel administrativo com cadastro, validação de grafo e auditoria; e contrato de cena versionado com catálogo JSON e GLB publicados pelo Blender. Um cenário reproduzível é: Entrada → NATURA (confirmação de chegada) → ANACAPRI."

---

## Slide 16 — Limitações e Trabalhos Futuros
**Elementos visuais:** Duas colunas: Limitações | Trabalhos Futuros.

**Texto na tela — Limitações:**
- Validação física pendente (QR, câmera, TalkBack, rede móvel, aparelho físico)
- MySQL não executado localmente (SQLite temporário na demo)
- Sem instalação em emulador/aparelho Android/iOS
- Navegadores Firefox, WebKit, Chrome, Edge não testados
- Vulnerabilidades de dependências (29 visitor, 4 painel) não tratadas
- Sem rastreamento contínuo de posição física

**Texto na tela — Trabalhos Futuros:**
- Roteiro de teste físico em Android e iOS
- Homologação MySQL em produção
- Tratamento de vulnerabilidades de dependências
- Definição de hospedagem, domínio, credenciais
- Avaliação de acessibilidade normativa de edifício real

**Roteiro de fala:** (45 segundos)
"O sistema apresenta limitações identificadas com base nas evidências: validação física pendente (leitura óptica de QR, câmera real, teste com visitantes, TalkBack/VoiceOver, rede móvel, desempenho em aparelho físico); MySQL não executado localmente, usando SQLite temporário; nenhuma instalação em emulador ou aparelho Android/iOS; navegadores Firefox, WebKit, Chrome e Edge não testados; e vulnerabilidades nas cadeias de dependências (29 no visitante, 4 no painel) não tratadas. Os trabalhos futuros incluem execução do roteiro de teste físico, homologação MySQL, tratamento de vulnerabilidades, definição de hospedagem e credenciais de produção, e avaliação de acessibilidade normativa de edifício real."

---

## Slide 17 — Conclusão e Contribuições
**Elementos visual:** Resumo visual com ícones de QR Code, mapa 2D, mapa 3D, painel admin.

**Texto na tela:**
- Sistema integrado de navegação indoor para shopping centers
- Atende requisitos funcionais: QR Code, busca, cálculo de rotas, mapas 2D/3D, simulação, painel admin
- Principais contribuições:
  1. Separação clara: API = fonte da navegação, Blender = fonte da geometria, contrato de cena como elo
  2. QR Codes como mecanismo de baixo custo, sem beacons ou sensores físicos
  3. Orientação consistente dos mapas 2D e 3D, norte sempre para cima

**Roteiro de fala:** (30 segundos)
"O Navegação Indoor 3D foi desenvolvido como sistema integrado de orientação interna para shopping centers, com foco no Mini Shopping como estudo de caso. O sistema atende aos requisitos funcionais definidos: identificação de origem por QR Code, busca de destinos, cálculo de rotas sobre grafo de nós pelo backend, visualização em mapas 2D e 3D, simulação de navegação, troca de pisos e painel administrativo com validação de integridade do grafo. As principais contribuições são: a separação clara entre API como fonte de verdade da navegação e Blender como fonte da geometria, mediada pelo contrato de cena versionado; o uso de QR Codes como mecanismo de baixo custo, sem necessidade de beacons ou sensores físicos; e a orientação consistente dos mapas 2D e 3D, com norte sempre para cima."

---

## Slide 18 — Perguntas da Banca
**Elementos visuais:** Espaço em branco para anotações, dados de contato.

**Texto na tela:**
- Perguntas e respostas
- Contato: [Nome do Autor]
- Repositório: github.com/Marcosrg-Gomes/Navegacao-Indoor-3D
- Documentação: docs/ no repositório local

**Roteiro de fala:** "Estamos à disposição para responder às perguntas da banca."
