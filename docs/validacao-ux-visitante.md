# Validação da navegação e da interface do visitante

Verificação local em 26/09/2026, com Chromium no Windows e bancos SQLite
temporários dos servidores de demonstração.

## Comportamento verificado

- Entrada → NATURA → confirmação de chegada → ANACAPRI: a segunda requisição
  de rota usa o nó da NATURA como origem. O trajeto concluído desaparece.
- Iniciar outra navegação e cancelar uma rota preservam a localização.
- Selecionar o próprio local apresenta a chegada sem criar uma rota.
- Chegada ao BURGER KING abre o mezanino. A próxima rota pelo Explorar parte
  do BURGER KING, inclusive quando o novo destino fica no térreo.
- Falha de rede na confirmação mantém a origem anterior e permite repetir;
  cancelar durante a requisição impede uma atualização tardia da localização.
- Instruções aparecem uma vez, com expansão/recolhimento na própria tela.
- Rota acessível usa elevador e exclui escadas e escadas rolantes.
- Explorar combina piso e categoria, abre detalhes e oferece uma ação separada
  para navegar. Revisão visual em 360 e 1280 px, incluindo legendas das abas.
- Próxima instrução destacada e demais passos recolhidos. Avançar passos ou
  visualizar um trecho em outro piso não altera a posição confirmada.
- Última localização identifica piso, fonte (QR, manual ou chegada) e horário.
- Busca no Explorar, atalhos de serviços e ordenação por percurso da API.
- Favoritos, oito recentes e dispensa da ajuda persistem após reabrir;
  a posição exige nova confirmação. Ajuda pode ser reaberta pelo teclado.
- Elevadores sem POI de loja recebem rotas; retorno à entrada parte da última
  localização confirmada.
- Recálculo conserva a rota enquanto aguarda a API. Falha identifica o trajeto
  anterior e desabilita chegada; nova tentativa recupera sem alterar a origem.
- Explorar recupera falha de carregamento. Verificação web de foco/Enter,
  nome/estado dos controles e botão de favorito com alvo mínimo de 44 px.
- Ensaio visual de texto ampliado em card a 360 px sem overflow horizontal.
  Isso não equivale ao teste de escala de fonte do sistema em aparelho físico.
- Regressão dos gestos 2D/3D, fallback do modelo, busca, manutenção, bloqueio de
  caminhos, QR simulado, administração e cinco visitantes simultâneos.

## Resultados

- TypeScript do visitante: passou.
- Build web: passou; estáticos gerados pelo comando do Expo.
- Exportações Hermes Android/iOS: passaram, com isolamento dos componentes web.
- Build e TypeScript do painel: passaram.
- API: 116 testes passaram; homologação MySQL ignorada por falta de configuração
  desse ambiente. Inclui distâncias contra rotas com bloqueios e etapas entre pisos.
- Gerador Blender: nove testes unitários passaram; geometria e catálogo não foram alterados.
- [24 testes integrados](../evidence/visitor-experience-tests.json): passaram.
- [8 testes de regressão](../evidence/visitor-experience-regression-tests.json): passaram.
- [Explorar no celular](../evidence/visitor-explore-360.png) e
  [no desktop](../evidence/visitor-explore-1280.png): capturas da versão validada.

A primeira execução do teste de cinco visitantes, concorrendo com outra suíte,
registrou 1045 ms para uma rota (limite de 1000 ms). A suíte foi repetida sem
essa concorrência e passou integralmente; o limite não foi relaxado.

## Cobertura das melhorias propostas

| Melhoria | Entrega |
| --- | --- |
| Modo de navegação | Passo atual, demais instruções recolhidas e chegada em destaque |
| Localização compreensível | Piso, origem da confirmação e horário |
| Controles dos mapas | Zoom/enquadramento visíveis e controles 3D adicionais recolhidos |
| Explorar | Busca, atalhos, filtros e ordenação por piso, nome, categoria ou percurso |
| Cards | Situação, localização, ações separadas e informações vazias omitidas |
| Acessível | Rota sem escadas, explicação e tratamento de indisponibilidade |
| Hierarquia visual | Tipografia, contraste, superfícies e ações consistentes |
| Ícones e toque | Ícones vetoriais e ampliação dos alvos de interação |
| Carregamento e falhas | Skeleton do diretório, recálculo preservado e tentativas por contexto |
| Pisos | Etapas da API, acesso entre pisos e contagem de passos por piso |
| Primeiro uso | Orientação dispensável, persistência e ajuda reaberta |
| Acessibilidade de interface | Semântica, teclado web e revisão com texto ampliado; leitores físicos pendentes |
| Personalização | Favoritos, recentes locais e retorno à entrada |
| Teste no local | [Roteiro preparado](teste-fisico-visitante.md); execução presencial pendente |

O teste de scanner usa vídeo e eventos simulados; a leitura óptica com câmera
física continua pendente. As exportações móveis não substituem a execução em
aparelhos. A localização é atualizada por QR, seleção manual ou chegada
confirmada; não existe rastreamento contínuo do deslocamento.

O README documenta os comandos para repetir a validação. As suítes
`visitor-journey.spec.ts` e `visitor-experience.spec.ts` estão incluídas no
workflow de integração. TalkBack, VoiceOver, câmera real e uso caminhando devem
seguir o roteiro presencial antes de considerar esses cenários homologados.
