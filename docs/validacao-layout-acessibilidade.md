# Layout, usabilidade e acessibilidade do visitante

Revisão local em 27/09/2026, no Chromium/Windows, com o Mini Shopping e banco
SQLite temporário. Esta revisão cobre as 12 melhorias propostas para a interface.

## Implementação

| Melhoria | Resultado |
| --- | --- |
| 1. Identidade de guia de shopping | Azul escuro, amarelo de sinalização, tipografia direta e pictogramas próprios. |
| 2. Redução de cartões genéricos | Explorar usa linhas separadas por bordas, sem sombras, com hierarquia pelo nome e pela ação. |
| 3. Identidade dos estabelecimentos | `logo_url` na lista e nos detalhes; iniciais ou pictogramas quando não há imagem ou ela falha. |
| 4. Cabeçalho compacto | Nome do shopping no topo, um título principal por tela e localização em uma linha adaptável. |
| 5. Resultados mais próximos da busca | Quatro atalhos principais; demais opções em Filtros; uma coluna no celular e duas no desktop. |
| 6. Comparação dos destinos | Nome, categoria, piso, estado e distância da API; título abre detalhes e botão separado traça a rota. |
| 7. Filtros compreensíveis | Critérios ativos visíveis, remoção individual e limpeza de filtros/ordenação. Favoritos e recentes disponíveis no diálogo. |
| 8. Acessibilidade do percurso | Explicação de escadas, elevadores, bloqueios e diferença entre caminho cadastrado e interior da loja. |
| 9. Estrutura semântica | Regiões principais, títulos, rótulos, alertas de erro, contagem anunciada e anúncios nativos de resultados. |
| 10. Informação além da cor | Texto e símbolo para funcionamento; origem circular e destino quadrado/cúbico nos mapas; legenda correspondente. |
| 11. Diálogos operáveis por teclado | Foco inicial no título, ciclo de Tab, Escape e retorno ao acionador; componente compartilhado por filtros, detalhes, ajuda e origem. |
| 12. Texto ampliado e celular | Controles com altura mínima de 44/48, quebra de linhas, conteúdo rolável, rodapé de ações nos diálogos e movimento reduzido. |

Não foi acrescentado um acervo de fotos: as imagens precisam existir no cadastro
e ter autorização de uso. O componente está preparado para exibi-las, sem criar
fachadas ou marcas fictícias.

## Validação automatizada e visual

- `npm run typecheck --prefix apps/visitor`: aprovado.
- `npm run build:web --prefix apps/visitor`: aprovado; conteúdo servido gerado
  pelo Expo, sem edição manual do build.
- `npm run build:native --prefix apps/visitor`: exportações Android/iOS aprovadas,
  incluindo isolamento de Three.js e componentes web.
- `layout-accessibility.spec.ts`: cinco casos aprovados para título único,
  resultados visíveis, foco/Tab/Escape, filtros removíveis, texto ampliado,
  imagem válida/fallback e contraste de textos selecionados (mínimo 4,5:1).
- `visitor-experience.spec.ts`: sete casos aprovados, incluindo favoritos,
  recentes, ajuda, serviços, ordenação por percurso e recuperação de erros.
- Regressão de chegada, regras de negócio e mapas: os cenários cobrem origem
  após chegada, troca de piso, bloqueios, câmera 3D, arraste/pinça, zoom e fallback.
- Inspeção das capturas em 1280 e 360 px, além de texto do conteúdo ampliado
  para 200% em 360 px, sem rolagem horizontal e com ação de rota disponível.

Relatórios: `evidence/layout-regression-tests.json`,
`evidence/layout-final-tests.json`, `evidence/layout-map-final-tests.json` e
`evidence/layout-accessibility-final-tests.json` (nome acessível dos diálogos).
São 34 cenários distintos aprovados considerando as execuções de regressão e
as repetições finais dos cenários afetados.
O primeiro registra uma corrida no teste de favoritos: a página era recarregada
antes do término da navegação. O teste passou a aguardar a URL de destino; a suíte
de experiência completa passou novamente no relatório final.

Capturas finais: `evidence/layout-final-artifacts/` (desktop, celular e texto
ampliado). Os cinco testes de layout foram incluídos no fluxo de integração do CI.

## Limites da verificação

A ampliação automatizada altera o texto do conteúdo web; não substitui o zoom de
todos os navegadores nem o tamanho de fonte do sistema operacional. O contraste
foi medido em amostras dos resultados e da ação principal, não em cada pixel do GLB.
Não há certificação integral de conformidade WCAG.

TalkBack/VoiceOver, câmera real, foco nativo, fonte ampliada no sistema e leitura
dos mapas dentro do shopping ainda precisam do
[roteiro em aparelhos físicos](teste-fisico-visitante.md). A exportação nativa
valida a compilação, não a experiência de leitores de tela em aparelhos reais.
