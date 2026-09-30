# Plano executável — navegação simulada no shopping

**Escopo atual:** demonstrar navegação contínua no Mini Shopping cadastrado, em celular e web, sem beacons, varredura Wi‑Fi ou sensores físicos. Este é o recorte imediato do [plano de navegação autônoma](plano-navegacao-autonoma.md). O modelo atual tem térreo, mezanino e os locais descritos no README. “Shopping completo” significa **todos os pisos, corredores e destinos que estiverem publicados no catálogo e na API**; um shopping físico diferente exige levantamento e publicação próprios.

**Resultado esperado:** a pessoa escolhe um destino, vê o mapa como tela principal, inicia uma demonstração de caminhada, acompanha marcador/instrução/distância/piso, observa um desvio com recálculo e pode começar outro trajeto da posição final. A interface sempre informa **Modo demonstração — posição simulada**. Nenhuma atualização simulada se apresenta como medição real.

## Decisões de arquitetura para esta etapa

1. **A API continua calculando rotas.** Usar `POST /api/routes` e sua revisão; o cliente não cria um segundo algoritmo de percurso. A resposta já inclui sequência de nós, metros, etapas e pisos.
2. **O simulador percorre arestas do grafo, não uma linha livre sobre a planta.** Cada quadro interpola entre dois nós consecutivos do mesmo piso; a mudança de piso ocorre somente em uma ligação vertical válida. Isso permite cobrir qualquer caminho publicado, sem cenários codificados por nome de loja.
3. **Separar posição exibida de origem de cálculo.** `PositionEstimate` guarda piso, coordenadas, nó/aresta, progresso, hora e `source: "simulation"`. `originNode` atual permanece compatível com QR/manual/chegada. Quando for necessário pedir outra rota à API, o cliente escolhe um nó navegável coerente com o progresso; o marcador visual não precisa saltar imediatamente para esse nó.
4. **Provedor intercambiável.** O simulador implementa uma interface pequena de observações de posição. BLE e sensores poderão substituí-lo em outra fase, sem alterar mapa, guia ou regras da sessão.
5. **Demonstração explícita e opt-in.** O botão **Iniciar demonstração** só aparece quando há rota. Pausar, retomar, acelerar para teste e encerrar não confirmam presença física. QR/manual interrompem a simulação e passam a ser a origem confirmada.
6. **Sem mudança espacial neste recorte.** Usar catálogo, grafo, GLB e pisos existentes. Se um cenário revelar aresta inválida, corrigir na origem Blender/catálogo e publicar release por meio dos comandos existentes, com as validações próprias.

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

## Testes e riscos que governam a execução

- Rodar typecheck, build web e exportação nativa do visitante; testes Playwright da jornada mobile. Rodar pytest da API se seus contratos mudarem. Se a cena mudar, executar também validação Blender/contrato/publicação.
- Testar no mínimo quatro larguras móveis, orientação vertical, fonte ampliada, teclado e leitor de tela quando houver aparelho. Conferir pausa, mudança de aba, perda de rede, rota cancelada, destino novo e bloqueio do grafo.
- Risco principal: tratar posição interpolada como origem física verdadeira. Resposta: fonte visível em todas as telas e separação explícita entre demonstração e confirmação real.
- Risco de recálculo em loop: resposta da API pode chegar depois de outro comando. Resposta: identificar requisições, descartar respostas antigas e limitar recálculos.
- Risco de salto visual na troca de piso ou na nova rota: manter coordenada visual contínua e explicar a aproximação do nó usada pela API.
- Risco de escala: rotas podem ter muitos nós. Atualizar apenas posição/progresso por quadro; evitar refazer listas, grafo e cena 3D a cada atualização.

**Condição para encerrar esta etapa:** todos os critérios S01–S12 cobertos, nenhuma falha nas validações relevantes, demonstração claramente identificada e roteiro executável do início ao fim em térreo e mezanino. A instalação de localização física fica na fase posterior do plano de navegação autônoma.
