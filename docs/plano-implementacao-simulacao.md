# Plano executável — navegação simulada no shopping

**Escopo atual:** demonstrar navegação contínua no Mini Shopping cadastrado, em celular e web, sem beacons, varredura Wi‑Fi ou sensores físicos. Este documento é o único plano de implementação desta etapa. O modelo atual tem térreo, mezanino e os locais descritos no README. “Shopping completo” significa **todos os pisos, corredores e destinos que estiverem publicados no catálogo e na API**; um shopping físico diferente exige levantamento e publicação próprios.

**Resultado esperado:** a pessoa escolhe um destino, vê o mapa como tela principal, inicia uma demonstração de caminhada, acompanha marcador/instrução/distância/piso, observa um desvio com recálculo e pode começar outro trajeto da posição final. A interface sempre informa **Modo demonstração — posição simulada**. Nenhuma atualização simulada se apresenta como medição real.

## Como ler e executar este plano

Este documento especifica o **produto a construir**, os contratos, a ordem de trabalho e os testes. O [backlog de front-end](melhorias-front-end.md) detalha os ajustes visuais e fornece prompts prontos para cada frente. As entregas devem ser feitas em fatias verificáveis, seguindo a ordem abaixo; os itens visuais ligados à navegação entram na entrega 4. Não é necessário implementar todas as melhorias cosméticas para demonstrar o motor, mas os itens marcados como essenciais à compreensão da rota fazem parte de S01, S04, S05 e S11.

### O que já existe e será reaproveitado

| Parte | Estado atual | Uso na simulação |
| --- | --- | --- |
| API FastAPI | `POST /api/routes`, grafo por piso, revisão do estado e bloqueios | Calcula todas as rotas e recalcula após desvio; não duplicar Dijkstra no app. |
| `NavigationContext` | Origem por QR/manual/chegada, destino, rota e revisão | Guardará a sessão e receberá posições simuladas sem apagar as confirmações existentes. |
| Catálogo Blender | Coordenadas normalizadas e conexões entre pisos | Define geometria e caminho transitável; o simulador não inventa lojas ou atalhos. |
| `Map2D`, `SceneMap`, `FloorMap` | Planta, rota, zoom, 3D web e seleção de piso | Renderizarão marcador móvel e modo seguir; native permanece com fallback 2D. |
| `RouteGuide`, `IntentHome`, `VisitorTabBar` | Busca, instruções e quatro abas | Serão reorganizados para uma tela de navegação mobile com detalhes sob demanda. |

### Entradas, saídas e limites

Entradas: shopping e revisão ativa, piso/origem confirmada ou origem de demonstração escolhida, destino, preferência sem escadas, `RotaResponse` e ações do visitante. Saídas: marcador com fonte `simulation`, etapa atual, metros restantes, piso, estado do modo seguir e eventos de chegada/desvio. A demonstração deve funcionar no catálogo publicado inteiro; atalhos como Entrada → Natura são exemplos reproduzíveis, não a única rota possível. Não declarar a simulação como geolocalização real. Não solicitar Bluetooth, localização do aparelho ou novas permissões.

## Decisões de arquitetura para esta etapa

1. **A API continua calculando rotas.** Usar `POST /api/routes` e sua revisão; o cliente não cria um segundo algoritmo de percurso. A resposta já inclui sequência de nós, metros, etapas e pisos.
2. **O simulador percorre arestas do grafo, não uma linha livre sobre a planta.** Cada quadro interpola entre dois nós consecutivos do mesmo piso; a mudança de piso ocorre somente em uma ligação vertical válida. Isso permite cobrir qualquer caminho publicado, sem cenários codificados por nome de loja.
3. **Separar posição exibida de origem de cálculo.** `PositionEstimate` guarda piso, coordenadas, nó/aresta, progresso, hora e `source: "simulation"`. `originNode` atual permanece compatível com QR/manual/chegada. Quando for necessário pedir outra rota à API, o cliente escolhe um nó navegável coerente com o progresso; o marcador visual não precisa saltar imediatamente para esse nó.
4. **Provedor intercambiável.** O simulador implementa uma interface pequena de observações de posição. BLE e sensores poderão substituí-lo em outra fase, sem alterar mapa, guia ou regras da sessão.
5. **Demonstração explícita e opt-in.** O botão **Iniciar demonstração** só aparece quando há rota. Pausar, retomar, acelerar para teste e encerrar não confirmam presença física. QR/manual interrompem a simulação e passam a ser a origem confirmada.
6. **Sem mudança espacial neste recorte.** Usar catálogo, grafo, GLB e pisos existentes. Se um cenário revelar aresta inválida, corrigir na origem Blender/catálogo e publicar release por meio dos comandos existentes, com as validações próprias.

### Contrato da sessão

```ts
type PositionEstimate = {
  source: "simulation" | "qr" | "manual" | "arrival";
  shoppingCode: string;
  floorId: number;
  x: number; y: number;             // coordenadas normalizadas do catálogo
  fromNodeId: number | null;
  toNodeId: number | null;
  edgeProgress: number;             // 0..1 no trecho horizontal atual
  observedAt: number;
  routeRevision: string | null;
};
type SimulationStatus = "idle" | "running" | "paused" | "rerouting" | "arrived" | "error";
```

O campo `source` acompanha toda posição exibida. O contrato é uma proposta de implementação, sujeita a ajuste de nomes no TypeScript, desde que preserve a distinção entre posição simulada e confirmada. `x` e `y` usam o mesmo referencial normalizado da API; conversões para metros usam as dimensões do piso. A UI consome uma única estimativa atual; a última confirmação real pode ser mantida separadamente para recuperação.

| Evento | Estado resultante | Regra |
| --- | --- | --- |
| Escolher origem manual/ler QR | `idle` | Cancela o relógio simulado; mantém destino e pede rota atualizada se necessário. |
| Iniciar demonstração | `running` | Exige rota válida e revisão atual; começa no primeiro nó da rota ou na posição simulada validada. |
| Pausar/retomar | `paused`/`running` | Não altera destino, piso, distância ou posição durante a pausa. |
| Arrastar/zoom do mapa | sessão inalterada | Muda apenas o modo da câmera para exploração; **Minha posição** reativa seguir. |
| Trocar de aba ou app em segundo plano | `paused` | Não simular caminhada invisível; retomar de forma explícita. |
| Simular desvio | `rerouting` | Escolhe nó alcançável no mesmo shopping, consulta a API, mantém última rota visível e aceita só a resposta mais recente. |
| Concluir caminho | `arrived` | Mostra **Chegada simulada** e usa o destino como ponto inicial da próxima demonstração, sem registrar chegada física. |
| Cancelar rota | `idle` | Cancela relógio e requisições pendentes, preservando a última origem confirmada. |

### Cálculo do movimento e do progresso

1. Construir segmentos a partir de `RotaResponse.nos` e das distâncias válidas do grafo. Em arestas horizontais, interpolar entre coordenadas dos nós com duração derivada da distância e velocidade de demonstração. A velocidade padrão representa caminhada; aceleração para apresentação deve ser explicitamente rotulada.
2. Uma conexão vertical é um evento discreto: mostrar a instrução de escada/elevador, trocar o piso ao cruzar o conector e prosseguir no nó do novo piso. Não interpolar um marcador 2D entre pisos.
3. Calcular metros restantes pela distância dos segmentos futuros mais o resto do segmento atual. A instrução atual decorre de `etapas` e IDs de nós da rota, sem contador manual separado que possa divergir. Garantir progressão monotônica durante caminho normal; desvio inicia uma nova base de cálculo.
4. Para uma nova rota no meio de uma aresta, escolher um nó alcançável coerente com o sentido e a preferência sem escadas. Mostrar **Rota calculada a partir do ponto de ligação mais próximo** se a aproximação for perceptível. Não deslocar o marcador visual para um lugar falso só para coincidir com o nó da API.
5. Recalcular somente em evento significativo: desvio solicitado, destino/preferência alterados, revisão do grafo alterada ou origem confirmada atualizada. Associar cada pedido a um identificador e ignorar respostas antigas. Durante falha, congelar a simulação e manter a última rota com aviso.
6. O desenho do marcador pode atualizar em cada quadro; consultas à API, busca e renderização da cena pesada não devem ocorrer nessa frequência. Pausar o relógio quando a tela sair de foco.

### Regras de interface durante a simulação

- Estado sem origem: pedir QR ou escolha manual antes de prometer uma rota; um cenário pronto pode preencher uma **origem de demonstração** visível.
- Estado sem rota: mapa consultável, busca e atalhos úteis. Estado com rota: mapa predominante, painel inferior com **agora**, distância restante, piso e controles da demonstração.
- Modo seguir e zoom são independentes. O gesto de arrastar desliga seguir até **Minha posição** ser acionado; troca de piso por evento da simulação pode recentralizar somente se seguir estiver ativo.
- A aba **Mapa** continua consulta livre; **Explorar → Ir** leva ao Início com destino selecionado. A aba **Ler QR** corrige uma localização física e encerra a demonstração em andamento.
- A opção **Sem escadas** usa o resultado acessível da API; o app não substitui elevador por escada por conveniência da animação.

## Requisitos e aceite

| ID | Necessidade atual | Aceite verificável |
| --- | --- | --- |
| S01 | Início centrado no mapa | Em 320, 360, 390 e 430 px: busca, piso, mapa, ação principal e próximo passo aparecem sem sobreposição; a aba inferior não cobre os controles. |
| S02 | Busca até navegação | Selecionar um destino no Início ou **Ir** em Explorar abre a rota no Início, com origem/destino corretos e preferência sem escadas preservada. |
| S03 | Movimento simulado | **Iniciar demonstração** move o marcador suavemente sobre o trajeto da API; pausar mantém a posição; retomar continua do mesmo ponto. |
| S04 | Progresso legível | Distância restante diminui, a instrução atual avança uma vez por trecho e a próxima decisão aparece antes da bifurcação; não repetir a instrução em dois cartões. |
| S05 | Câmera controlável | Em **Seguir**, o mapa acompanha a posição. Arrastar/zoom passa para exploração livre; **Minha posição** retoma o acompanhamento sem perder zoom indevidamente. |
| S06 | Mudança de piso | A passagem térreo ↔ mezanino ocorre no conector da rota; o piso exibido muda no momento adequado e a instrução identifica escada ou elevador. |
| S07 | Desvio e recálculo | Um comando de teste **Simular desvio** move a posição para outro nó alcançável do mesmo shopping; a API recalcula a rota até o destino sem criar trecho através de parede. |
| S08 | Nova rota da posição atual | Após chegar à Natura, escolher Anacapri produz rota iniciada na Natura. Se a demonstração é interrompida no caminho, a nova rota parte da última posição simulada validada, com aproximação por nó explicitada. |
| S09 | Chegada honesta | Ao fim da sequência de nós, a UI mostra **Chegada simulada**; o usuário pode iniciar outra demonstração ou corrigir posição. Isso não equivale à chegada física confirmada. |
| S10 | Falhas e saída | Erro de rota/rede preserva destino e última posição, mostra mensagem acionável e permite tentar de novo; encerrar demonstração volta ao modo normal. |
| S11 | Acessibilidade | Nome/estado dos botões para leitor de tela, fonte ampliada, contraste, movimento reduzido e controles de pelo menos 44 px; texto não depende de cor para indicar posição ou desvio. |
| S12 | Cobertura do catálogo | Cenários percorrem os dois pisos, entradas, lojas, serviços e rota sem escadas. A automação detecta destinos sem conexão e informa cobertura do grafo, sem declarar que o prédio real foi validado. |

## Prioridade MoSCoW deste recorte

| Prioridade | Itens |
| --- | --- |
| **Must** | S01–S12: mapa principal, simulação explícita, progresso, piso, desvio, recálculo, nova rota da posição atual, cobertura do catálogo e acessibilidade. |
| **Should** | Preservar sessão ao trocar de aba, atalhos de cenários para apresentação e diagnósticos simples do progresso da simulação. |
| **Could** | Voz/vibração e controle de velocidade ajustável fora da área de demonstração; prévia 3D sincronizada na web. |
| **Won't nesta entrega** | Posicionamento físico por BLE/Wi‑Fi/sensores, instalação no shopping, rastreamento em segundo plano e afirmação de chegada real automática. |

## Sequência de implementação que seguirei

| Entrega | Mudanças previstas | Prova de conclusão |
| --- | --- | --- |
| **1. Base de posição** | Criar tipos e estado de `PositionEstimate`, fonte e sessão; encapsular atualizações QR/manual/chegada existentes; manter destino e revisão da rota. | Testes de transição: QR → simulação → pausa → QR, sem origem antiga ou destino perdido. |
| **2. Motor determinístico** | Percorrer `route.nos` por distância e tempo; interpolar apenas arestas horizontais, tratar conectores verticais como eventos; comandos iniciar/pausar/retomar/encerrar/velocidade. | Mesmo cenário e velocidade geram o mesmo progresso; nenhuma coordenada sai do piso/aresta publicados. |
| **3. Progresso e recálculo** | Calcular metros restantes e etapa atual a partir da resposta da API; implementar desvio para nó válido, limiar contra recálculo em cascata e proteção contra resposta atrasada. | Testes para desvio, bloqueio/revisão, troca de destino e preferência sem escadas. |
| **4. Tela Início mobile** | Reorganizar `index.tsx`: mapa como superfície principal, busca compacta no topo, instrução em painel inferior, marcador, status de demonstração e controles próximos ao polegar. Preservar Mapa/QR/Explorar. | Testes visuais e de interação em larguras móveis; gestos de mapa e abas funcionam. |
| **5. Cenários e documentação** | Incluir cenários pré-definidos somente como atalhos de apresentação, além do modo genérico que funciona para qualquer rota; documentar modo demonstração e limitações. | Entrada → Natura → Anacapri; desvio; troca de piso; sem escadas; pausa; rede indisponível. |

As entregas 1–3 são a base funcional; a entrega 4 apresenta a experiência mobile; a entrega 5 fecha a demonstração. A estimativa preliminar é de **3 a 6 semanas de trabalho**, sujeita à complexidade de adaptação dos gestos 2D/3D e às correções encontradas nos testes. É uma faixa de planejamento, não prazo garantido.

### Critérios de passagem entre entregas

| Após | Portão de qualidade | Se falhar |
| --- | --- | --- |
| 1 | Não existem duas fontes concorrentes de origem; QR/manual interrompem a simulação em qualquer estado. | Corrigir o estado antes de animar o mapa. |
| 2 | Percurso determinístico em térreo e mezanino, pausa estável, nenhum salto por parede ou entre pisos. | Revisar segmentação e contrato espacial; não mascarar com animação. |
| 3 | Desvio e nova rota usam API, respostas obsoletas são descartadas, bloqueio e modo sem escadas são respeitados. | Revisar origem escolhida para recálculo e eventos da sessão. |
| 4 | Buscar, iniciar, seguir e encerrar cabem em 320–430 px e continuam operáveis com fonte grande. | Ajustar hierarquia e painel inferior antes de adicionar detalhes. |
| 5 | Todos os cenários rodam do início ao fim e o modo demonstração é inequívoco. | Corrigir fluxo ou documentação antes de divulgar. |

## Estrutura mínima proposta

```text
apps/visitor/
  positioning/
    types.ts                    # posição, fonte e estado de demonstração
    routeProgress.ts            # metros, trecho, piso e etapa atual
    simulation.ts               # relógio e interpolação determinística
    providers/Simulation.ts     # interface para futuro provedor físico
  components/
    NavigationMap.tsx           # mapa e modo seguir
    NavigationPanel.tsx         # próximo passo e controles da sessão
    SimulatedPosition.tsx       # marcador e legenda de demonstração
  app/(tabs)/index.tsx          # composição da tela principal
  context/NavigationContext.tsx # sessão/origem e integração com a API
apps/admin/tests/
  simulation-navigation.spec.ts # fluxo de ponta a ponta no navegador
docs/
  plano-implementacao-simulacao.md
```

Os nomes poderão ser ajustados para reutilizar os componentes atuais. A primeira entrega deve evitar um estado paralelo que contradiga `NavigationContext`. O mapa nativo continua 2D; a web pode manter o 3D opcional.

## Recursos necessários no ambiente agora

- Repositório atual, dependências já documentadas no README, API de demonstração, catálogo publicado e navegadores de teste.
- Um Android e um iPhone físicos são desejáveis para conferir toque, fonte grande e leitor de tela; a lógica da simulação funciona sem eles.
- Nenhum beacon, novo roteador, permissão Bluetooth, conta externa ou varredura de Wi‑Fi é necessário nesta etapa.
- Não alterar manualmente `services/api/app/static/*` ou arquivos GLB. Gerar builds com os comandos existentes.

### Execução e validação reproduzível

No Windows/PowerShell, após instalar as dependências conforme o README:

```powershell
npm run typecheck --prefix apps/visitor
npm run build:web --prefix apps/visitor
npm run build:native --prefix apps/visitor
npm run build --prefix apps/admin
.\.venv\Scripts\python.exe -m pytest services/api/tests -q
```

Rodar Playwright com a API de demonstração acessível, usando os comandos do README. O novo teste `simulation-navigation.spec.ts` deve exercitar pelo menos: Entrada → Natura → Anacapri, pausa/retomada, desvio, troca de piso, sem escadas, QR durante a simulação, arrastar/recentralizar e falha de rede. Testes unitários do motor devem controlar tempo por relógio falso, sem esperar animação real. Se o catálogo precisar mudar, aplicar o processo de exportação/publicação e executar as validações Blender e `scene-contract` antes de usar a nova versão.

Os resultados em navegador e exportação nativa verificam a lógica e o empacotamento. Toque, legibilidade, leitor de tela e desempenho em aparelho físico exigem ensaio em Android/iPhone. Registrar modelo, tamanho de tela, escala de fonte, tarefa, tempo, erro e correção observada; não marcar como testado o que não foi executado.

## Testes e riscos que governam a execução

- Rodar typecheck, build web e exportação nativa do visitante; testes Playwright da jornada mobile. Rodar pytest da API se seus contratos mudarem. Se a cena mudar, executar também validação Blender/contrato/publicação.
- Testar no mínimo quatro larguras móveis, orientação vertical, fonte ampliada, teclado e leitor de tela quando houver aparelho. Conferir pausa, mudança de aba, perda de rede, rota cancelada, destino novo e bloqueio do grafo.
- Risco principal: tratar posição interpolada como origem física verdadeira. Resposta: fonte visível em todas as telas e separação explícita entre demonstração e confirmação real.
- Risco de recálculo em loop: resposta da API pode chegar depois de outro comando. Resposta: identificar requisições, descartar respostas antigas e limitar recálculos.
- Risco de salto visual na troca de piso ou na nova rota: manter coordenada visual contínua e explicar a aproximação do nó usada pela API.
- Risco de escala: rotas podem ter muitos nós. Atualizar apenas posição/progresso por quadro; evitar refazer listas, grafo e cena 3D a cada atualização.

### Dependências e decisões registradas

| Dependência | Situação nesta etapa | Decisão |
| --- | --- | --- |
| API de rotas e revisão | Já existe | Reutilizar; só ampliar contrato se os testes mostrarem uma lacuna concreta. |
| Grafo/catálogo dos dois pisos | Já existe | Testar cobertura inteira antes de declarar o escopo concluído. |
| Origem da demonstração | Deve ser explícita | Escolha manual, QR ou cenário pronto rotulado; nunca inferir localização física. |
| Mapa 3D | Web opcional | A animação 2D e a rota têm prioridade; preservar fallback nativo. |
| Pacotes novos | Não previstos | Preferir TypeScript e componentes existentes; documentar eventual dependência necessária. |
| Infraestrutura física | Não necessária | Nenhuma compra ou configuração do shopping bloqueia a simulação. |

### Entregáveis finais

Código do simulador e integração, Início mobile reorganizado, testes determinísticos e de jornada, instruções de execução no README, capturas de referência mobile e registro de limitações. A entrega deve permitir a qualquer pessoa reproduzir os cenários sem acesso a hardware de localização. Commit e push dependem de pedido explícito conforme `AGENTS.md`.

**Condição para encerrar esta etapa:** todos os critérios S01–S12 cobertos, nenhuma falha nas validações relevantes, demonstração claramente identificada e roteiro executável do início ao fim em térreo e mezanino. Localização física está fora do escopo deste plano.
