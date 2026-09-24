# Validação da integração — 19/09/2026

## Atualização dos mapas — 23/09/2026

Correção do arraste 2D que voltava ao centro, com movimento permitido em 1×,
captura estável do gesto e pinça/roda ancoradas ao ponto explorado. O teste de
toque detectou a perda da captura implícita do SVG ao transferi-la ao contêiner;
o evento propagado agora não encerra o gesto. A câmera 3D permite pan, zoom,
rotação e vista superior sem se reposicionar em atualizações normais da interface.

Validação final: **11 testes integrados e de interação + 8 regressões existentes
passaram no Chromium**. Os novos casos cobrem arrastes sucessivos, atualização
de preferências, persistência do 2D entre modos, zoom no cursor, seleção de loja,
enquadramento da rota, retorno ao piso da origem e câmera 3D. Eventos multitoque
via CDP verificaram arraste/pinça a 414 px, sem rolagem da página, overflow ou
abertura acidental de detalhes. O clique real na geometria de uma loja continua
verificado, usando seu rótulo projetado como referência espacial.

A revisão visual incluiu zoom 2,25× no 2D e 1,5× no 3D. Rótulos 2D que colidem
são deslocados ou omitidos, priorizando origem, destino e acessos entre pisos.
Após esse ajuste de legibilidade, os três casos de seleção/gestos 2D e multitoque
foram repetidos e passaram novamente.

TypeScript e exportações Expo web/Android/iOS passaram. Os dois source maps
nativos foram inspecionados automaticamente: sem Three.js, Fiber, controles
de câmera, rótulos DOM ou a superfície de gestos web. As mudanças desta etapa
ficaram na apresentação; os contratos espaciais e artefatos Blender permanecem
os mesmos. Aparelhos físicos e outros navegadores não foram testados nesta etapa.

- [Relatório final dos mapas](../evidence/map-browser-tests.json)
- [Regressão existente](../evidence/map-regression-tests.json)
- [Verificação após ajuste de rótulos](../evidence/map-labels-tests.json)
- [Controles 3D](../evidence/map-controls-3d.png)
- [Controles 2D](../evidence/map-controls-2d.png)
- [Pinça 2D em tela móvel](../evidence/map-2d-mobile-pinch.png)
- [Pinça 3D em tela móvel](../evidence/map-3d-mobile-pinch.png)
- [Origem em destaque no 3D](../evidence/map-3d-location.png)

## Validação original da integração

Validação local em Windows, Python 3.12.14, Node.js 24.12, Chromium do Playwright
e Blender 4.5.14 LTS. O ambiente usa bancos SQLite temporários independentes para
o Mini Shopping e a regressão da demonstração anterior.

## Resultados

| Camada | Resultado observado |
|---|---|
| API | **112 testes passaram, 1 ignorado** por exigir MySQL |
| Blender/Python | **9 testes passaram**; lint, formatação e compilação aprovados |
| Geometria real | **1.149 amostras**, sem obstáculos nem falta de piso no grafo horizontal |
| Exportação headless | **1.909 objetos**, GLB de **3.488.904 bytes**, orçamento de 25 MiB |
| Reprodutibilidade GLB | Nova exportação em staging produziu o mesmo SHA-256 do artefato canônico |
| Visitante web | TypeScript e exportação Expo aprovados; Draco servido localmente |
| Android/iOS | Exportações Hermes aprovadas; dois source maps sem Three.js, Fiber ou componentes web |
| Painel | TypeScript e build Vite aprovados |
| E2E integrados | **7 testes Chromium passaram** |
| Regressão existente | **8 testes Chromium passaram** |

O inventário inclui dois pisos de 30 × 60 m, 22 lojas, quatro banheiros,
entrada principal e sete QR Codes. Os testes calculam rota comum e acessível
da entrada a cada um dos 27 destinos. As rotas acessíveis para o mezanino usam
elevador; o bloqueio desse acesso retorna indisponibilidade. As escadas rolantes
mantêm sentido único e instruções de subida/descida.

O publicador compara as entidades da API com o catálogo e verifica hash, tamanho,
cabeçalho e nomes dentro do GLB. Casos de catálogo inválido, POI ausente no GLB,
planta ausente e tentativa de alterar uma versão publicada são rejeitados sem
mudar a publicação anterior. A seed preserva registros e bloqueios existentes.

## Fluxos verificados no navegador

- QR da entrada → busca ADIDAS → rota → GLB real retornado pela API → mesmos nós
  em 3D e na linha SVG → confirmação de chegada.
- QR da entrada → BURGER KING → rota acessível pelo elevador → troca para o
  mezanino → bloqueio → indisponibilidade clara → restauração da aresta.
- Falha do GLB → mapa 2D com destino e instruções → nova tentativa 3D bem-sucedida.
- WebGL indisponível → preservação da origem por QR e mapa 2D.
- GLB sem resposta → limite de 20 segundos → mapa 2D e opção de nova tentativa
  (teste completo em 20,5 s).
- Clique na geometria de ADIDAS → detalhes de ADIDAS, ignorando a loja no piso oculto.
- Painel autenticado → inventário e diagnóstico → links dos pisos.

Os testes anteriores cobrem CRUD administrativo, scanner com eventos simulados,
QR inválido, manutenção, recálculo após bloqueio, rede, cinco visitantes
simultâneos e telas de 360/414 px. O fluxo 3D entre pisos foi testado a 414 px;
isso é uma janela de navegador, não um telefone físico.

Na primeira regressão, a medição concorrente excedeu 3 s durante exportação
Blender. Sem essa carga, passou com os limites originais. Um seletor antigo do
teste de cadastro confundia o texto do rótulo com o das opções; foi corrigido
para buscar o combobox pelo nome acessível. Na inspeção 3D, foi corrigido o clique
que podia atingir geometria oculta do outro piso, e acrescentada sua regressão.

## Evidências

- [Relatório E2E integrado](../evidence/integration-browser-tests.json)
- [Relatório E2E de regressão](../evidence/regression-browser-tests.json)
- [Verificação geométrica](../evidence/navigation-geometry.json)
- [Rota no térreo](../evidence/visitor-ground-route.png)
- [Rota acessível no mezanino](../evidence/visitor-upper-accessible.png)
- [Validação no painel](../evidence/admin-scene-validation.png)
- [Render aéreo Blender regenerado](../packages/shopping-3d/renders/cam_aerea.png)
- [Render do mezanino regenerado](../packages/shopping-3d/renders/cam_mezanino.png)

SHA-256 do GLB v1:
`f2a7b21f514ddcf42e18e03885a3433d7613bc717b170bc500c3a51e2ed410b0`.

## Limites e validação externa pendente

- MySQL não foi executado localmente. A matriz SQLite/MySQL está configurada no CI.
- O workflow consolidado inclui os checks antigos, exportação Blender e os dois
  grupos E2E. Sua execução remota depende de envio ao repositório; não foi disparada.
- Android/iOS foram exportados, sem instalação em emulador ou aparelho físico.
  Leitura óptica dos QR Codes, câmera real e teste com visitantes continuam pendentes.
- Firefox, WebKit, Chrome instalado e Edge não foram executados nesta integração.
- A validação física verifica o centro dos trajetos e o suporte de piso; não
  certifica circulação ou acessibilidade normativa de uma construção real.
- Os renders conservam as câmeras originais: a vista aérea mostra a cobertura e
  a do mezanino tem o primeiro plano parcialmente obstruído. A inspeção da
  navegação usa o recorte por piso no navegador. Não houve inspeção no viewport
  nativo do Blender. Materiais procedurais não portáveis aparecem simplificados
  no GLB; a iluminação muito clara já existia no modelo original.
- A instalação npm informou vulnerabilidades nas cadeias já utilizadas (29 no
  visitante e 4 no painel). Não foi feita atualização ampla de Expo/Vite neste
  trabalho; o hardening das dependências deve preceder a implantação pública.
- A versão inicial está publicada nos estáticos da API local. Hospedagem,
  domínio e credenciais de produção não foram definidos.

Os históricos foram importados por subtree sem squash, com os commits de
migração autorizados. Os repositórios originais foram preservados. Os builds
importados foram retirados somente do índice Git e são gerados pelos comandos
das interfaces. A implementação da integração permanece no working tree para
revisão; não houve push.
