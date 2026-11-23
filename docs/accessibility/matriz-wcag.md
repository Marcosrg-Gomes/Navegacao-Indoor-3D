# Matriz WCAG 2.2 — Nível AA

## Princípio 1: Perceptível

| Critério | Descrição | Status | Evidência / Comentário |
|----------|-----------|--------|------------------------|
| 1.1.1 | Conteúdo não textual (alternativas textuais) | ✓ Conforme | Imagens têm `alt`; logotipos com fallback de código/símbolo; ícones decorativos têm `accessible={false}` |
| 1.2.1 | Áudio apenas e vídeo apenas (pré-gravado) | N/A | Não há áudio/vídeo pré-gravado no sistema |
| 1.2.2 | Legendas (pré-gravado) | N/A | Não há áudio/vídeo pré-gravado |
| 1.2.3 | Audiodescrição ou alternativa para mídia | N/A | Não há mídia pré-gravada |
| 1.2.4 | Legendas (ao vivo) | N/A | Não há conteúdo ao vivo |
| 1.2.5 | Audiodescrição (pré-gravado) | N/A | Não há mídia pré-gravada |
| 1.3.1 | Informação e relações | ✓ Conforme | HTML semântico; `<label>` associado a `<select>` via `htmlFor`/`id`; tabelas com cabeçalhos; ARIA roles apropriadas |
| 1.3.2 | Sequência significativa | ✓ Conforme | Ordem DOM segue a ordem visual; cabeçalhos hierárquicos |
| 1.3.3 | Características sensoriais | ✓ Conforme | Instruções não dependem apenas de cor, forma ou posição; texto e símbolo para funcionamento |
| 1.3.4 | Orientação | ✓ Conforme | O app funciona em retrato e paisagem |
| 1.3.5 | Identificar propósito do input | N/A | Não há campos de preenchimento automático de propósito |
| 1.4.1 | Uso da cor | ✓ Conforme | Informação não transmitida apenas por cor; texto e símbolo para status; origem circular e destino quadrado no mapa |
| 1.4.2 | Controle de áudio | N/A | Não há áudio que toca automaticamente |
| 1.4.3 | Contraste (mínimo) | ✓ Conforme | Texto e imagem de texto com contraste mínimo 4,5:1; cores de badge ajustadas (verde #0f763e, texto escuro em fundo soft) |
| 1.4.4 | Redimensionamento de texto | ✓ Conforme | Texto ampliado a 200% não causa perda de conteúdo ou funcionalidade; teste de texto ampliado aprovado |
| 1.4.5 | Imagens de texto | N/A | Não há imagens de texto usadas para informação |
| 1.4.10 | Refluo | ✓ Conforme | Sem rolagem horizontal em 320px CSS; teste em 360px aprovado |
| 1.4.11 | Contraste de não-textual | ✓ Conforme | Componentes de UI e objetos gráficos têm contraste adequado |
| 1.4.12 | Espaçamento de texto | N/A | O app não impede ajustes de espaçamento via CSS do usuário |
| 1.4.13 | Conteúdo ao passar o mouse | N/A | Não há conteúdo que apareça apenas ao passar o mouse |
| 1.4.14 | Espaçamento de linhas e parágrafos | N/A | Não há restrição de espaçamento |

## Princípio 2: Operável

| Critério | Descrição | Status | Evidência / Comentário |
|----------|-----------|--------|------------------------|
| 2.1.1 | Teclado | ✓ Conforme | Toda funcionalidade operável por teclado; teste de navegação Tab/Enter/Esc aprovado |
| 2.1.2 | Sem armadilha de teclado | ✓ Conforme | O foco pode ser movido para fora de todos os componentes; não há armadilhas |
| 2.1.4 | Atalhos de caractere | N/A | Não há atalhos de caractere de tecla única |
| 2.2.1 | Tempo ajustável | N/A | Não há limite de tempo para interações |
| 2.2.2 | Pausar, parar, ocultar | N/A | Não há conteúdo que se move, rola ou piscar automaticamente |
| 2.3.1 | Três flashes ou abaixo | N/A | Não há conteúdo que pisque |
| 2.4.1 | Blocos de passagem | N/A | Não há blocos repetidos que exijam mecanismo de passagem |
| 2.4.2 | Título da página | ✓ Conforme | Cada página tem título/heading único e descritivo |
| 2.4.3 | Ordem do foco | ✓ Conforme | Ordem de navegação sequencial preserva significado e operabilidade |
| 2.4.4 | Propósito do link (em contexto) | ✓ Conforme | Links têm propósito identificado pelo texto do link |
| 2.4.5 | Múltiplas formas | N/A | Site pequeno, não requer múltiplas formas de localizar páginas |
| 2.4.6 | Títulos e rótulos | ✓ Conforme | Títulos de seção e rótulos de form describe o tópico/propósito |
| 2.4.7 | Localização do foco visível | ✓ Conforme | Indicador de foco visível com outline de 3px em var(--accent) |
| 2.4.8 | Localização | N/A | Não há múltiplas páginas hierárquicas que exijam indicação de localização |
| 2.4.11 | Foco não obscuro (mínimo) | ✓ Conforme | O foco não fica obscuro por conteúdo autor |
| 2.5.1 | Gestos do ponteiro | N/A | Não há gestos complexos que exijam alternativa de um ponteiro |
| 2.5.2 | Cancelamento do ponteiro | ✓ Conforme | A ação é executada no evento `up`/`click`, podendo ser cancelada |
| 2.5.3 | Nome do rótulo | ✓ Conforme | Nomes acessíveis contêm o texto do rótulo visual |
| 2.5.4 | Ativação por movimento | N/A | Não há funcionalidade acionada por movimento do dispositivo |
| 2.5.7 | Arraste | ✓ Conforme | O arraste do mapa tem alternativa (botões de controle, teclado) |
| 2.5.8 | Alvo do apontador (mínimo) | ✓ Conforme | Controles principais têm alvo de pelo menos 44 px |

## Princípio 3: Compreensível

| Critério | Descrição | Status | Evidência / Comentário |
|----------|-----------|--------|------------------------|
| 3.1.1 | Idioma da página | ✓ Conforme | Páginas em português do Brasil (`lang="pt-BR"` implícito no conteúdo) |
| 3.1.2 | Idioma de partes | N/A | Não há mudanças de idioma no conteúdo |
| 3.2.1 | Em foco | ✓ Conforme | Componentes não mudam de contexto apenas ao receber foco |
| 3.2.2 | Com entrada | ✓ Conforme | Mudanças de contexto só ocorrem por solicitação do usuário |
| 3.2.3 | Navegação consistente | ✓ Conforme | Elementos de navegação aparecem de forma consistente |
| 3.2.4 | Identificação consistente | ✓ Conforme | Componentes com mesma função têm identificação consistente |
| 3.3.1 | Identificação de erro | ✓ Conforme | Erros são identificados e descritos em texto |
| 3.3.2 | Rotulos ou instruções | ✓ Conforme | Campos têm rótulos e instruções |
| 3.3.3 | Sugestão de erro | N/A | Não há sugestões de correção automática |
| 3.3.4 | Prevenção de erro (crítico) | N/A | Não há ações de consequência legal/financeira |
| 3.3.5 | Alteração de senha | N/A | Não há funcionalidade de alteração de senha |
| 3.3.6 | Prevenção de erro (todas) | N/A | Não há submissão de formulários críticos |

## Princípio 4: Robusto

| Critério | Descrição | Status | Evidência / Comentário |
|----------|-----------|--------|------------------------|
| 4.1.1 | Processamento | ✓ Conforme | HTML válido; elementos têm tags de abertura/fechamento completas |
| 4.1.2 | Nome, papel, valor | ✓ Conforme | ARIA roles apropriadas; estados de componentes (expanded, selected, checked, busy); `aria-label` em progressbars; `role="img"` em SVG `<g>` e canvas |
| 4.1.3 | Mensagens de status | ✓ Conforme | `aria-live="polite"` em toasts; anúncios para leitores de tela de rota, chegada, piso, origem, erro e instrução |

## Critérios AA adicionais (WCAG 2.2)

| Critério | Descrição | Status |
|----------|-----------|--------|
| 2.4.11 | Foco não obscuro (mínimo) | ✓ Conforme |
| 2.5.7 | Arraste | ✓ Conforme |
| 2.5.8 | Alvo do apontador (mínimo) | ✓ Conforme |
| 1.4.13 | Conteúdo ao passar o mouse | N/A |

## Observação

A conformidade total com WCAG 2.2 AA requer validação manual com leitores de tela (NVDA/VoiceOver/TalkBack) e em aparelhos físicos, conforme o [roteiro NVDA](roteiro-nvda.md) e o [roteiro físico](teste-fisico-visitante.md).
