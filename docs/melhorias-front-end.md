# Backlog de front-end — visitante e painel

**Objetivo:** fazer o sistema parecer uma ferramenta de orientação construída para este shopping, utilizável por pessoas de idades diferentes em celulares pequenos. Este backlog acompanha o [plano de implementação da navegação simulada](plano-implementacao-simulacao.md). Ele lista melhorias a implementar; não descreve funcionalidades já entregues.

**Base da análise:** `apps/visitor/app/(tabs)/index.tsx` mistura busca, diretório, guia e mapa em uma rolagem; `RouteGuide.tsx` concentra instruções e muitos controles; `Map2D.tsx` já oferece pan/zoom; `VisitorTabBar.tsx` tem quatro destinos; `explore.tsx` tem filtros e diretório; `apps/admin` possui o painel operacional. A skill instalada [frontend-design](../.agents/skills/frontend-design/SKILL.md), seu [guia de direção visual](../.agents/skills/frontend-design/references/aesthetic-playbook.md) e seus [padrões de implementação](../.agents/skills/frontend-design/references/implementation-patterns.md) orientam tipografia, hierarquia, movimento, responsividade e acessibilidade.

## Direção visual escolhida

**Sinalização física de shopping, com caráter utilitário.** Usar códigos de piso e de espaço que já existem, nomes reais das lojas, setas claras, linhas de orientação e uma cor de rota reconhecível. O gesto visual recorrente pode ser uma **faixa de percurso**: linha vertical curta ligando “agora”, “depois” e “chegada”, presente no painel e nos detalhes. Não aplicar textura, brilho, cartões flutuantes ou animações só para enfeitar. O mapa é o elemento mais importante. A tipografia deve ser legível no movimento; a cor reforça o significado, mas texto/forma continuam suficientes. Não inventar fotos, logos, coordenadas, referências ou horários.

**Prioridades:** P0 entra junto da simulação e da navegação principal; P1 fecha a experiência mobile; P2 melhora consulta, acabamento e operação. Cada prompt abaixo deve ser executado como mudança pequena e validada. Reutilizar componentes atuais e preservar a API/catálogo como fontes de verdade. Quando o prompt tocar no layout, verificar 320, 360, 390 e 430 px, fonte ampliada e área segura inferior.

## A. Estrutura da experiência

### FE01 · P0 · Início com uma decisão clara

Problema: o Início alterna entre `IntentHome` e uma longa página de rota/mapa; a posição da ação principal muda muito. **Prompt:** “Refatore `app/(tabs)/index.tsx` para apresentar busca e destino em uma área curta e estável, com o mapa do shopping visível. Antes da rota, mostre origem, serviços úteis e uma ação principal sem cobrir o mapa. Com rota, destaque mapa e próximo passo. Preserve QR, favoritos e ajuda em ações secundárias acessíveis.” **Aceite:** a pessoa encontra destino e começa a rota sem percorrer seções longas.

### FE02 · P0 · Mapa dominante durante a rota

Problema: a rota divide atenção com o restante da página rolável. **Prompt:** “Crie uma composição mobile em que o mapa ocupe a área disponível entre cabeçalho compacto, painel de instrução e abas, sem ScrollView envolvendo a superfície gestual. Mantenha o mapa interativo e o painel independente.” **Aceite:** pan/zoom não rolam a página e a próxima ação fica visível sem procurar.

### FE03 · P0 · Painel inferior em três estados

Problema: `RouteGuide` mostra muitos controles simultâneos. **Prompt:** “Divida o guia em resumo, intermediário e expandido: resumo com uma instrução e distância; intermediário com próxima decisão; expandido com passos, opções e detalhes. Preserve foco, estados e a ação de chegada.” **Aceite:** uma instrução principal por vez e detalhes acessíveis em até um gesto.

### FE04 · P0 · Barra inferior coerente com a tarefa

Problema: a barra atual identifica abas, mas não comunica a diferença entre navegação ativa e consulta livre. **Prompt:** “Ajuste `VisitorTabBar` para manter Início, Mapa, Ler QR e Explorar com rótulos visíveis, alvo confortável, área segura e estado ativo inequívoco. Em rota ativa, o rótulo de Início pode indicar a navegação sem mudar o destino da aba.” **Aceite:** nenhuma aba é encoberta em telas pequenas/fonte grande; leitor de tela anuncia seleção.

### FE05 · P0 · Volta consistente do Explorar

Problema: o diretório e o mapa podem iniciar destinos de pontos diferentes da interface. **Prompt:** “Ao tocar em Ir em Explorar, selecione o destino e abra o Início com rota e foco no próximo passo. Preserve filtro/rolagem do diretório para quando a pessoa voltar.” **Aceite:** nenhum destino se perde na troca de aba e não aparece rota iniciada da entrada por engano.

### FE06 · P1 · Busca sempre acessível

Problema: a busca aparece em posições diferentes conforme o estado. **Prompt:** “Unifique a entrada de busca no Início e no acesso a nova rota, com rótulo ‘Para onde você vai?’, sugestões úteis e resultado claro. No percurso, abra a busca como camada que volta à rota sem apagá-la.” **Aceite:** nova rota em até dois toques, sem limpar a posição.

### FE07 · P1 · Estado de origem em uma linha

Problema: a origem é descrita em vários textos. **Prompt:** “Mostre uma linha curta e estável: piso, local e fonte da posição. Diferencie ‘QR confirmado’, ‘escolha manual’ e ‘modo demonstração’ por texto e ícone; toque abre correção.” **Aceite:** a origem visível coincide com o estado usado pela rota.

### FE08 · P1 · Chegada que leva à próxima ação

Problema: a chegada ocupa uma seção longa e obriga a reorganizar mentalmente a navegação. **Prompt:** “Crie um estado de chegada compacto com destino, localização resultante e três ações: nova rota, lugares próximos, voltar à entrada. Para simulação, escrever ‘Chegada simulada’ em destaque.” **Aceite:** Natura → Anacapri começa da Natura e a origem exibida confirma isso.

## B. Mapa e orientação

### FE09 · P0 · Marcador de posição distinto

**Prompt:** “No `Map2D`/`FloorMap`, desenhe marcador do visitante com forma e orientação distintas da origem verde e do destino vermelho. Para simulação, inclua legenda textual ‘Posição simulada’; para QR/manual, mostre última posição confirmada.” **Aceite:** em 1× e com daltonismo, rota, usuário e destino são distinguíveis.

### FE10 · P0 · Seguir, explorar e recentralizar

**Prompt:** “Adicione estado explícito `following` ao viewport. Atualizações simuladas movem a câmera somente quando seguir está ativo. Um arraste manual entra em explorar; o botão Minha posição restaura seguir. Zoom manual permanece.” **Aceite:** arrastar nunca causa recentralização automática involuntária.

### FE11 · P0 · Distância e etapa no mapa

**Prompt:** “Mostre no painel de navegação a distância restante calculada a partir do percurso simulado e a instrução ativa, ligada ao nó/aresta atual. Elimine contadores paralelos manuais quando a simulação estiver ativa.” **Aceite:** a distância diminui durante caminhada normal e troca corretamente após recálculo.

### FE12 · P0 · Transição entre pisos compreensível

**Prompt:** “Quando a rota cruzar elevador ou escada, mantenha a instrução de acesso visível e sinalize ‘Agora: Mezanino’ após o evento de troca. Destaque o conector correspondente no mapa, sem animar atravessando o vazio.” **Aceite:** o piso visualizado e o marcador permanecem coerentes.

### FE13 · P1 · Hierarquia da planta em dois níveis

**Prompt:** “Revise `FloorMap` para visão geral com corredores, rota, serviços e códigos de espaços; ao aproximar, revele nomes das lojas sem colisões. Reduza rótulos secundários antes de sacrificar a rota.” **Aceite:** destino e caminho continuam legíveis em 320 px e zoom 1×.

### FE14 · P1 · Controles do mapa junto ao polegar

**Prompt:** “Reposicione zoom, recentralizar, enquadrar rota e piso sem cobrir instruções ou marcador. Agrupe funções por intenção e deixe alvos de no mínimo 44 px.” **Aceite:** uso com uma mão em 320–430 px, inclusive com área segura inferior.

### FE15 · P1 · Rota acessível visível no mapa

**Prompt:** “Quando ‘Sem escadas’ estiver ativo, identifique elevador e trecho acessível com símbolo e texto na legenda; não dependa de roxo ou verde isolados. Informe indisponibilidade de elevador com a mensagem da API.” **Aceite:** o modo escolhido é verificável no painel e na planta.

### FE16 · P1 · Miniatura da jornada entre pisos

**Prompt:** “No detalhe expandido, mostre segmentos Térreo → Elevador/Escada → Mezanino → Destino com distâncias por piso. Cada segmento abre o respectivo piso sem alterar a localização atual.” **Aceite:** tocar na prévia nunca muda a origem da rota.

### FE17 · P1 · 3D como prévia contextual

**Prompt:** “Na web, apresente a opção 3D como ‘Ver próximo acesso’ ao chegar perto de troca de piso ou bifurcação. Preserve o modo 2D, o progresso e o zoom ao voltar.” **Aceite:** a prévia usa a cena publicada e não se apresenta como câmera ao vivo.

### FE18 · P2 · Legenda sob demanda

**Prompt:** “Troque a legenda sempre expandida por acesso ‘Símbolos do mapa’, preservando uma indicação mínima de usuário, rota e destino. O conteúdo aberto deve ter exemplos de elevador, escada, banheiro e entrada.” **Aceite:** mapa ocupa mais espaço sem perder explicação.

## C. Busca, Explorar e destinos

### FE19 · P1 · Diretório como linhas de sinalização

**Prompt:** “Em `explore.tsx`, apresente código real, nome, piso, categoria, funcionamento e distância em linhas compactas com divisórias claras. Mantenha Ir no mesmo ponto de cada linha; evite cartões iguais em cascata.” **Aceite:** pelo menos três resultados ficam visíveis em um celular comum com fonte padrão, sem truncar nome ou ação; fonte ampliada pode mostrar menos linhas sem perder conteúdo.

### FE20 · P1 · Filtros em linguagem de necessidade

**Prompt:** “Organize filtros por perguntas simples: ‘O que procura?’, ‘Qual piso?’, ‘Aberto agora?’, ‘Evitar escadas?’. Mostre critérios ativos como texto removível e mantenha os resultados em contexto.” **Aceite:** zerar filtro e remover um critério são ações distintas e óbvias.

### FE21 · P1 · Ações rápidas úteis

**Prompt:** “No Início, use quatro atalhos baseados em necessidades: banheiro, alimentação, elevador e lojas. Apresente resultados reais da API, sem números inventados nem imagens genéricas.” **Aceite:** cada atalho abre uma lista de destinos utilizáveis.

### FE22 · P1 · Resultado de busca com contexto espacial

**Prompt:** “Em `SearchBar`, inclua piso e código do local no resultado, e distância somente quando a origem estiver definida. Se houver homônimos, diferencie por piso/ala cadastrada.” **Aceite:** selecionar um resultado não exige voltar para descobrir em que piso fica.

### FE23 · P1 · Detalhe do local como folha de decisão

**Prompt:** “Em `PoiDetails`, priorize nome, piso, estado operacional e botão Ir. Deixe telefone, descrição e dados secundários abaixo. Se estiver fechado/em manutenção, explique a confirmação necessária antes da rota.” **Aceite:** a decisão de ir ao local cabe no primeiro viewport da folha.

### FE24 · P2 · Diretório ligado à planta

**Prompt:** “Ao selecionar/focar uma linha no Explorar, destaque o mesmo espaço em `DirectoryMap`; ao tocar no mapa, selecione a linha correspondente. Preserve filtros e posição de rolagem.” **Aceite:** lista e planta nunca apontam para lojas diferentes.

### FE25 · P2 · Favoritos e recentes sem competição visual

**Prompt:** “Mostre favoritos e recentes em uma seção curta abaixo da busca, com código/piso e ação Ir. Limite itens visíveis e ofereça ‘Ver todos’; não ocupe a área principal da rota.” **Aceite:** seção útil sem empurrar o mapa para baixo.

### FE26 · P2 · Estados vazios com ação real

**Prompt:** “Crie mensagens específicas para busca sem resultados, sem origem, piso sem locais e filtro muito restritivo. Cada estado oferece uma ação que resolve o problema: limpar filtro, escolher origem ou voltar aos pisos.” **Aceite:** não existe estado vazio que termine em texto genérico.

## D. Acessibilidade e linguagem

### FE27 · P0 · Uma ação principal por estado

**Prompt:** “Faça auditoria dos estados inicial, rota, erro, pausa e chegada. Em cada um, destaque uma única ação principal e agrupe alternativas secundárias em ordem de uso. Preserve ações de emergência/correção sempre acessíveis.” **Aceite:** usuário novo consegue dizer o próximo toque em até alguns segundos no teste presencial.

### FE28 · P0 · Textos honestos da simulação

**Prompt:** “Revise microtextos para separar ‘posição simulada’, ‘última posição confirmada’ e ‘chegada simulada’. Substitua jargão de API por consequência clara para a pessoa. Nunca usar ‘você está aqui’ para estimativa sem o rótulo de demonstração.” **Aceite:** usuários de teste entendem que o ponto se move por simulação.

### FE29 · P1 · Fonte ampliada sem perda de função

**Prompt:** “Teste todas as telas e folhas com fontScale 1,4 e 1,8. Permita quebra de linha, crescimento vertical e rolagem interna quando necessário; preserve botões e rótulos.” **Aceite:** nenhuma ação fica cortada em 320 px com fonte ampliada.

### FE30 · P1 · Leitores de tela durante a rota

**Prompt:** “Anuncie mudança de piso, recálculo, pausa, chegada simulada e próxima instrução com prioridade adequada. Evite anunciar posição a cada quadro. Garanta ordem lógica de foco em painel e folhas.” **Aceite:** TalkBack/VoiceOver permitem percorrer a jornada sem depender da planta.

### FE31 · P1 · Movimento com propósito

**Prompt:** “Use transições curtas apenas para mover marcador, abrir painel e indicar troca de piso. Respeite redução de movimento; nesse modo, atualize estados sem pulsos e sem deslocamentos decorativos.” **Aceite:** interface continua compreensível com animações desativadas.

### FE32 · P1 · Contraste e redundância

**Prompt:** “Audite cores de texto, estado selecionado, rota, alertas e botões para contraste AA. Diferencie origem/destino/usuário por forma, ícone e rótulo além da cor.” **Aceite:** estados de sucesso, erro e rota continuam distinguíveis em escala de cinza.

### FE33 · P2 · Ajuda localizada no momento da dúvida

**Prompt:** “Reduza o tutorial inicial a um gesto por vez. Perto dos controles, ofereça ajuda curta para ‘seguir mapa’, ‘corrigir posição’ e ‘sem escadas’, com acesso à ajuda completa.” **Aceite:** a orientação aparece no contexto certo sem bloquear a tarefa.

### FE34 · P2 · Teclado e foco na web

**Prompt:** “Garanta Tab/Shift+Tab, foco visível e Escape em busca, filtros, detalhes, painel e controles do mapa. Quando uma folha fecha, devolva foco ao acionador.” **Aceite:** fluxo básico é concluído sem mouse.

## E. Identidade, acabamento e painel administrativo

### FE35 · P1 · Tokens visuais de sinalização

**Prompt:** “Consolide em `constants/colors.ts` e estilos compartilhados um sistema de superfícies, texto, rota, pisos, estados e espaçamento. Use identidade utilitária de shopping: divisórias, códigos e setas; evite gradientes, brilhos e sombras repetidas.” **Aceite:** componentes novos e antigos usam os mesmos significados visuais.

### FE36 · P1 · Tipografia de leitura em movimento

**Prompt:** “Defina hierarquia para nome da loja, instrução atual, distância e metadados. Use até duas famílias disponíveis/licenciadas, com fallback nativo; números de distância precisam ser estáveis e legíveis.” **Aceite:** próxima decisão é mais proeminente que detalhes administrativos.

### FE37 · P2 · Painel admin com ações orientadas a diagnóstico

**Prompt:** “Em `apps/admin`, organize validações da cena, bloqueios e histórico pela pergunta do operador: ‘O mapa está publicado?’, ‘Há rota acessível?’, ‘O que mudou?’. Mostre estado e ação corretiva sem esconder o detalhe técnico.” **Aceite:** operador encontra a causa de rota indisponível em poucos passos.

### FE38 · P2 · Evidência visual reproduzível

**Prompt:** “Depois de cada fatia de UI, capture estados sem rota, em rota, desvio, troca de piso e chegada em 320/390 px. Compare com a hierarquia esperada e registre problemas reais, sem substituir testes de interação por imagens.” **Aceite:** revisão consegue ver a evolução visual e reproduzir o estado.

## Ordem sugerida para executar os prompts

1. **Fundação da demonstração:** FE28, FE09, FE10, FE11, FE12. Esses itens dependem do motor e do estado previstos no plano.
2. **Tela principal mobile:** FE01, FE02, FE03, FE04, FE05, FE07, FE27. Fazer um fluxo completo antes de adicionar detalhes.
3. **Consulta e escolha:** FE06, FE19–FE26.
4. **Legibilidade e acessibilidade:** FE13–FE18, FE29–FE34.
5. **Acabamento e operação:** FE35–FE38.

Em cada prompt, preservar a regra do projeto: rotas e disponibilidade vêm da API; posições físicas vêm do catálogo publicado. Executar typecheck e builds relevantes, testes de jornada e inspeção mobile. O resultado esperado é uma interface que ajuda a pessoa a se localizar enquanto caminha, sem elementos decorativos que disputem atenção com o mapa.
