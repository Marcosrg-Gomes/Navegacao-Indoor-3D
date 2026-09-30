# Diretório, orientação e percurso

O desenho segue a lógica de um diretório e da sinalização física: códigos de
espaços, nomes em listas, plantas ao lado e instruções com setas. A mudança é de
estrutura e interação, além de tipografia, cores e acabamento.

Na revisão mobile de 29/09/2026, a tela inicial passou a apresentar três decisões
em ordem: buscar o destino, informar a posição e abrir uma categoria. O diretório
mantém busca, categorias e o botão **Ir** em cada resultado; a vista da planta é
uma troca explícita no celular. No percurso, o passo atual e as ações de mapa,
correção e chegada vêm antes dos detalhes expansíveis. Botões principais têm
altura mínima de 48–52 px e as ações secundárias, de 44 px. A linguagem visual
usa sinalização verde escura e amarela, com cores suaves para diferenciar
categorias sem depender somente da cor. O conteúdo continua disponível em texto.

O rodapé mobile agora separa **Início**, **Mapa**, **Ler QR** e **Explorar**.
Cada área tem no mínimo 56 px de altura, rótulo visível e ícone; a área segura
inferior do aparelho é respeitada. O item ativo usa um sinal amarelo compacto
no ícone. O mapa abre diretamente na aba própria, em 2D por padrão na web em
telas estreitas, com opção de passar para 3D. Quando há rota, um botão retorna
às instruções. A visualização escolhida e o zoom permanecem ao trocar de aba.

## Cobertura das 20 melhorias

| # | Proposta | Implementação e limite |
|---|---|---|
| 1 | Diretório compacto | Linhas com código real, nome, categoria, piso e distância; índice A–Z e agrupamento por categoria. |
| 2 | Lista ligada à planta | Foco, mouse e seleção destacam o espaço. Desktop em duas áreas; celular alterna lista/planta sem apagar filtros. |
| 3 | Localização contextual | Origem e piso identificados; sem origem, convite para confirmar a posição antes das distâncias. |
| 4 | Reconhecimento do entorno | “Estou vendo uma loja” permite buscar nome ou selecionar na planta e exige confirmação de estar na entrada do local. |
| 5 | Instruções como sinalização | Seta grande, etapa atual, duas próximas e histórico expansível sem repetir essas etapas. |
| 6 | Referências nas direções | A API usa referências do próprio nó ou ligadas por aresta ativa do corredor, até 8 m; não escolhe pela proximidade através de paredes. |
| 7 | Chegada útil | Confirmação antes do mapa, nova rota, lugares próximos, correção de posição e próxima parada. |
| 8 | Filtros em linguagem cotidiana | Perguntas sobre procura, piso, categoria, ordem, funcionamento e escadas, com critérios removíveis. |
| 9 | Identidade de categorias e serviços | Códigos de lojas e sinais WC/elevador/entrada/alimentação; elevadores exibem conexões cadastradas a outros pisos. Nomes de acessos vêm do catálogo. |
| 10 | Funcionamento contextual | A API informa “Fecha em”, “Aberto até” ou abertura futura quando o horário é interpretável; detalhes oferecem alternativas abertas da categoria. |
| 11 | Planta legível | Código em visão geral, nome ao aproximar, rótulos com prevenção de colisão, setas na rota, origem circular e destino quadrado, destaque de favoritos, escala e norte. Destino pulsa duas vezes na web e respeita movimento reduzido. Seta da origem indica o percurso, não bússola do aparelho. |
| 12 | 3D para antecipar o caminho | Prévia em perspectiva a 1,65 m, início/fim do trecho, referência destacada e saída no próximo piso. Usa apenas a geometria publicada, com os recortes de piso existentes. Web; fallback 2D preservado. |
| 13 | Foco no percurso | Busca e filtros gerais saem da tela de rota; acesso direto entre instruções e mapa, com correção de localização disponível. |
| 14 | Recuperação de desorientação | “Estou perdido” reúne QR, reconhecimento de local e revisão da última posição; confirmar novo local recalcula mantendo destino. |
| 15 | Acessibilidade explicada | Metros no piso, elevadores, escadas e estimativa a 1 m/s sem espera. Preferência sem escadas e limites sobre o interior das lojas são explícitos. |
| 16 | Marcos reais | Referências são lojas, entradas e conectores cadastrados. Esculturas, jardins ou outros marcos não existentes no catálogo não foram inventados; novos marcos exigem cadastro e publicação espacial. |
| 17 | Remoção de elementos genéricos | Cabeçalho compacto, linhas em vez de cartões repetidos, códigos em vez de iniciais inventadas, busca plana e ações escritas. Logos cadastrados são preservados. |
| 18 | Tipografia para orientação | Títulos editoriais, códigos monoespaçados, nomes legíveis e setas maiores; hierarquia de ação atual e próximas ações. |
| 19 | Favoritos espaciais | Fixação na planta, distâncias da origem, passeio por seleção ordenada e aviso opcional de locais a até 35 m. Não há notificações de fundo nem localização automática. |
| 20 | Início por intenção | Busca de destino, reconhecimento/QR, serviços próximos, diretório e meus lugares; depois percurso e chegada. |

## Horários e disponibilidade

O campo existente `horario_funcionamento` aceita texto livre. Para interpretação
temporal conservadora, use `Diariamente HH:MM-HH:MM [UTC-03:00]` (ou `[UTC]`).
Zonas IANA também são aceitas se o sistema tiver sua base de fusos; o deslocamento
UTC funciona sem instalar dependências adicionais no Windows. Intervalos que
atravessam meia-noite são aceitos. Horas iguais, valores inválidos, feriados e
semanas com exceções permanecem como texto, sem cálculo automático.

`horario_resumo` e `aberto_agora` são campos aditivos da API. O diretório renova
os dados a cada minuto enquanto a tela está ativa. Fechamento/manual e manutenção
prevalecem. Fora de um horário interpretável, uma rota até o local exige a mesma
confirmação usada para destinos fechados. O trajeto leva ao acesso, sem prometer
atendimento. Sem horários interpretáveis, mantém-se o estado operacional cadastrado.

## Posição, passeio e referências

Mover, aproximar ou girar o mapa não altera a origem. Avançar instruções e trocar
a prévia também não. A origem só muda por QR, confirmação manual ou chegada.
Reconhecer visualmente uma loja exige estar em seu acesso antes da confirmação.
Uma referência conectada é um auxílio de orientação, não uma análise de visibilidade
por câmera. Não há posição, orientação do celular ou medição de filas ao vivo.

Favoritos e a preferência de avisos ficam salvos localmente por shopping. A ordem
do passeio fica na sessão; não é uma otimização automática de todas as paradas.
Cada trecho usa a API e suas validações atuais. Estabelecimentos indisponíveis
não podem ser incluídos a partir da seleção de favoritos.

## Validação

- API: referências conectadas, exclusão de arestas bloqueadas, composição da rota,
  horários diurnos/noturnos e exigência de confirmação fora do horário.
- Navegador: `wayfinding.spec.ts` cobre diretório/planta, reconhecimento de origem,
  recuperação de posição, prévia 3D e várias paradas.
- Regressão: mapas com arraste/pinça, QR por token, chegada NATURA → ANACAPRI,
  bloqueios, recálculo, persistência, falhas WebGL, teclado, contraste e texto 200%.
- TypeScript, exportação web e exportações Android/iOS com isolamento dos módulos 3D.

As imagens e relatórios ficam em `evidence/wayfinding-*`. O roteiro de
[teste físico](teste-fisico-visitante.md) continua necessário para câmera, placas
QR impressas, leitores de tela nativos, condições reais de circulação e fidelidade
da maquete. Exportar Android/iOS não equivale a executar em aparelho.

### Resultado desta implementação — 28/09/2026

- API completa: **134 passaram, 1 ignorado**; dois avisos de depreciação das dependências.
- TypeScript e exportação web: passaram.
- Exportações Android/iOS: passaram, com verificação de ausência de Three.js/Fiber
  nos pacotes nativos.
- Rodada de regressão: 37/38 passaram. A falha encontrou o cabeçalho bloqueando
  a lista com texto a 200%; o cabeçalho móvel foi colocado dentro da rolagem.
- Rodada final de layout e novos fluxos: **11/11 passaram**, incluindo o caso
  corrigido, seleção ligada ao mapa, alternativas abertas e pisos do elevador.
  Relatório: `evidence/wayfinding-final-tests.json`. Os cenários novos também
  verificam ausência de erros JavaScript não tratados.
- Revisão visual de desktop, celular, chegada, prévia 3D e texto ampliado realizada.

As suítes existentes de Blender foram preservadas. Esta alteração não modificou
geometria, GLB ou catálogo e não publicou uma nova versão espacial.

### Revisão mobile — 29/09/2026

- A skill `frontend-design` foi instalada em `.agents/skills/frontend-design`
  antes da alteração do front-end, com licença e referências locais.
- TypeScript, exportação web e bundles Android/iOS passaram; a verificação dos
  pacotes nativos não encontrou módulos 3D exclusivos da web.
- Regressão Chromium: **26/26 passaram**, incluindo busca, filtros, origens,
  chegada, troca de piso, mapa, favoritos, recuperação de erro, contraste,
  teclado e texto ampliado. O teste mobile adicional passou em **320 e 390 px**,
  com ações de ao menos 44 px e sem rolagem horizontal da página.
- Capturas da tela inicial, do diretório e da rota estão em
  `evidence/mobile-refresh-complete-artifacts/`; os relatórios estão em
  `evidence/mobile-refresh-complete-tests.json` e
  `evidence/mobile-refresh-compact-tests.json`.

### Navegação inferior — 29/09/2026

- As quatro abas foram verificadas em 320, 360, 390 e 414 px: rótulos visíveis,
  alvos de toque de pelo menos 44 px e nenhuma rolagem horizontal da página.
- A nova aba Mapa abre a planta 2D diretamente no celular, conserva o zoom ao
  alternar abas e preserva o zoom 3D ao trocar temporariamente para 2D.
- A leitura do QR de demonstração abre o mapa com a posição atualizada; o teste
  de câmera simulada também passou na base de testes correspondente.
- TypeScript, exportação web e bundles Android/iOS passaram. A rodada final da
  navegação inferior teve **5/5** cenários aprovados; os testes existentes de
  interações do mapa passaram **4/4** após corrigir a troca 3D/2D.
- Relatórios: `evidence/mobile-tabs-complete-tests.json`,
  `evidence/mobile-tabs-final-tests.json` e
  `evidence/mobile-tabs-scanner-tests.json`.
