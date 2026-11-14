# Validação em dispositivos físicos — app visitante (Android/iOS)

Este documento separa o que **já foi implementado e verificado automaticamente**
do que **ainda precisa ser testado em aparelho**. Nada aqui foi marcado como
validado em dispositivo físico sem execução real.

Ambiente usado na última rodada automática: Windows 10, Node 24, Chrome 1366×860
e viewports de 320, 390 e 520 px. **Não havia** Android SDK/emulador nem macOS
(simulador iOS) disponíveis.

## 1. Situação por plataforma

| Verificação | Web (Chrome) | Emulador Android | Simulador iOS | Aparelho físico |
|---|---|---|---|---|
| Typecheck (`npm run typecheck`) | ✅ | — | — | — |
| Bundle Android + iOS (`npm run build:native`) | — | ✅ bundle Hermes gerado | ✅ bundle Hermes gerado | ⏳ |
| Isolamento nativo (sem Three.js/Fiber/componentes web) | — | ✅ `check-native-bundle.cjs` | ✅ | — |
| Regra 0°/180°, seta para cima (unitário) | ✅ 14/14 | — | — | ⏳ |
| Planta legível a 180° (unitário + screenshot) | ✅ | — | — | ⏳ |
| Pesos IBM Plex Sans (unitário) | ✅ | — | — | ⏳ |
| Fluxo QR → destino → navegação → chegada (E2E) | ✅ | ⏳ | ⏳ | ⏳ |
| TalkBack / VoiceOver | — | ⏳ | ⏳ | ⏳ |

Legenda: ✅ executado e aprovado · ⏳ pendente · — não se aplica.

## 2. O que foi implementado para o mobile nativo

- **Fonte IBM Plex Sans nativa.** Os quatro pesos (400, 500, 600, 700) são
  carregados com `expo-font` antes da primeira renderização; a splash fica
  visível até o fim do carregamento (`app/_layout.tsx`), então a interface não
  aparece com outra fonte. Se o carregamento falhar, o app continua com a fonte
  do sistema. Android/iOS não escolhem arquivo de fonte por `fontWeight`, por
  isso todo texto usa `components/AppText.tsx`, que converte o peso na família
  correta (`constants/typography.ts`). Apenas os 4 arquivos usados entram no
  bundle (`constants/fontAssets.ts`).
- **Planta 2D legível a 180°.** A planta SVG é renderizada como camada própria
  (`SvgXml`); a 180° cada texto gravado na planta recebe rotação de 180° em
  torno do próprio centro (`components/planOrientation.ts`). A geometria, a
  rota, a seta e a regra 0°/180° não mudam.
- **Correção para o nativo:** `FloorMap` usava o elemento DOM `<g>` dentro do
  `react-native-svg`, o que só funciona no web; trocado por `<G>`.
- **Setas de sentido da rota:** o atributo `d` das setas não tinha comando `M`
  e elas não eram desenhadas (erro no console do web). Corrigido.
- **Câmera/QR:** após um QR inválido, a leitura é liberada novamente em 1,5 s
  (antes ficava travada até sair da aba). Com permissão negada
  definitivamente, o botão **Abrir configurações** chama `Linking.openSettings()`.
  O erro de leitura é anunciado ao leitor de tela.
- **Leitura das instruções:** no iOS, cada nova instrução e a chegada são
  enviadas ao VoiceOver (`AccessibilityInfo.announceForAccessibility`); no
  Android, o banner usa `accessibilityLiveRegion="polite"`.
- **Toque:** ação principal com 52 px de altura; botões de mapa, bússola,
  zoom e "Sem escadas" com no mínimo 44–52 px; o chip "Sem escadas" exibe ícone
  e rótulo curto (só ícone abaixo de 360 px), mantendo o rótulo acessível
  completo e o estado `checked`.
- **Safe areas:** topo do mapa, cabeçalho e barra de abas já usam
  `useSafeAreaInsets`; a splash usa a cor da marca (`#14332e`).
- **Servidor de demonstração na rede local:** `mini_server.py --host 0.0.0.0`.

## 3. Decisão de arquitetura: mapa 3D

O app nativo usa somente o **mapa 2D** (`components/SceneMap.native.tsx`). O 3D
(Three.js + GLB + Draco) roda na versão web, inclusive em navegador móvel. O
bundle nativo é verificado para não conter Three.js. Levar o 3D ao nativo
exige `expo-gl`, decodificação Draco sem WebAssembly (Hermes) e testes de memória
em aparelho — fica registrado como evolução, não como pendência de correção.

## 4. Roteiro de teste em aparelho

### Preparação
1. API acessível pela rede Wi-Fi (no PC):
   `.\.venv\Scripts\python.exe services/api/mini_server.py --port 8000 --host 0.0.0.0`
   (libere a porta 8000 no firewall do Windows somente na rede privada).
2. App: `npm start --prefix apps/visitor` e ler o QR do Expo com o **Expo Go**.
   O projeto usa **Expo SDK 52**; se a versão do Expo Go da loja não abrir
   projetos SDK 52, gere um build de desenvolvimento
   (`npx expo run:android` com Android Studio, `npx expo run:ios` no macOS com
   Xcode, ou EAS Build). O app encontra a API em `http://<IP do PC>:8000`
   automaticamente; se não encontrar, defina
   `EXPO_PUBLIC_API_URL=http://<IP do PC>:8000` antes do `npm start`.
3. QR de teste: gere no painel (`/admin/qr`) ou use o código `MINI-ENTRADA-PRINCIPAL`
   no campo "Código ou link do QR".

### Casos (marcar ✅/❌, aparelho, versão do sistema)

| # | Caso | Esperado | Android | iOS |
|---|---|---|---|---|
| 1 | Abrir o app | Splash verde até carregar; textos em IBM Plex Sans desde a primeira tela | | |
| 2 | Ler QR físico com a câmera | Permissão pedida uma vez; origem definida; abre o mapa | | |
| 3 | Negar câmera definitivamente | Mensagem + botão **Abrir configurações** funciona | | |
| 4 | QR inválido e depois QR válido | Erro anunciado; segundo QR lido sem sair da aba | | |
| 5 | Buscar NATURA e traçar rota | Banner com ícone de manobra; distância e tempo | | |
| 6 | Iniciar navegação | Seta aponta para cima; mapa em 0° ou 180°; não gira nas curvas | | |
| 7 | Planta a 180° | Nomes das lojas da planta legíveis (não invertidos) | | |
| 8 | Pinça e arrasto no mapa | Zoom/pan fluidos; toque em loja abre detalhes | | |
| 9 | "Sem escadas" | Rota recalculada sem escadas; aviso claro se não existir | | |
| 10 | "Estou fora da rota" / recalcular | Mantém destino e "Sem escadas" | | |
| 11 | Trocar de piso | Seletor de piso alcançável; mapa correto | | |
| 12 | Chegada | Mensagem "Você chegou"; nova rota parte do destino | | |
| 13 | Teclado no campo de busca/QR | Campo e botão visíveis acima do teclado | | |
| 14 | Aparelho com notch e gesto de navegação | Nada atrás das barras do sistema | | |
| 15 | Tela pequena (≤ 360 dp) | Botões não quebram; nada cortado | | |

### Acessibilidade (TalkBack / VoiceOver)

| # | Caso | Esperado | TalkBack | VoiceOver |
|---|---|---|---|---|
| A1 | Percorrer a tela do mapa com gestos | Ordem: busca, ajuda, modo/piso, mapa, painel, abas | | |
| A2 | Instruções durante a navegação | Cada nova instrução é lida automaticamente | | |
| A3 | Chegada | "Você chegou a …" é lido | | |
| A4 | Botão "Sem escadas" | Lido como interruptor com estado ligado/desligado | | |
| A5 | Ícones (bússola, zoom, minha posição) | Todos com nome falado | | |
| A6 | Texto ampliado (200%) | Banner, painel e abas sem sobreposição; textos completos | | |
| A7 | Contraste ao sol/brilho baixo | Rota azul e seta legíveis sobre a planta | | |

### Desempenho
- Tempo até o mapa aparecer após o QR (meta: < 3 s em Wi-Fi).
- Navegação simulada por 2 min sem travamentos; memória estável
  (Android Studio Profiler / Xcode Instruments).
- Alternar pisos 10 vezes sem crescimento contínuo de memória.

## 5. Pendências que dependem de aparelho
- Execução dos casos 1–15, A1–A7 e de desempenho acima.
- Confirmação de que `react-native-svg` renderiza os textos SVG da planta e da
  seta com IBM Plex Sans no Android (a família é registrada pelo `expo-font`).
- Confirmação do comportamento do VoiceOver com anúncios frequentes durante a
  simulação (pode exigir limitar a frequência de leitura).
