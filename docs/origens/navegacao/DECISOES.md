# Decisões Técnicas e Arquiteturais

1. **API Key vs JWT**: Optou-se pelo uso de API Key em vez de JWT para simplificar a proteção dos endpoints administrativos no MVP (Minimum Viable Product).

2. **Coordenadas Normalizadas**: Decidimos normalizar as coordenadas no intervalo de `0.0` a `1.0`. Isso garante que a renderização do mapa no front-end e mobile seja independente da resolução original.

3. **heapq para Dijkstra**: Utilizaremos a biblioteca padrão `heapq` do Python para implementar o algoritmo de Dijkstra (caminho mais curto). Isso evita dependências desnecessárias para cálculos de roteamento simples.

4. **Inativação e exclusão**: O bloqueio reversível usa `ativo` para entidades e `ativa` para arestas. No código atual, DELETE de shopping inativa o registro; DELETE de pisos, nós, arestas, lojas, categorias e QR Codes remove registros, com validações de referências onde aplicáveis. Não há garantia geral de preservação de histórico após exclusão.

5. **Auto-cálculo de distância**: Como temos coordenadas de nós e a dimensão do piso (largura e altura em metros), o sistema ou scripts de seed podem calcular a distância entre os nós automaticamente, em vez de dependerem de entrada manual.

6. **Expo for React Native**: O uso do Expo simplificará e agilizará o desenvolvimento da aplicação mobile, oferecendo testes mais fáceis durante a fase de prototipagem.

7. **Token QR Code**: Optamos por usar tokens baseados em UUIDs ou strings legíveis para humanos (como "ENTRADA-PRINCIPAL") em vez de guardar referências diretas de banco de dados nos QR codes. Isso melhora a resiliência caso os IDs de banco mudem.

8. **Expo Router e Abas**: Adoção de navegação baseada em arquivos (`app/(tabs)/`), estruturando o aplicativo em 3 abas principais: Mapa (`index.tsx`), Scanner QR (`scan.tsx`) e Explorar POIs (`explore.tsx`), envolvidos por `NavigationProvider` no layout raiz.

9. **Polyline SVG contínuo para Rota**: Em vez de gerar múltiplos elementos `<Line>` individuais, a rota calculada é renderizada com um único `<Polyline>` SVG contínuo com marcadores customizados de início (verde) e destino (vermelho), inspirado no QRNav porém otimizado para React Native SVG.

10. **Debounce de 300ms no SearchBar**: Implementado debounce na consulta `GET /api/pois?q=...` para poupar chamadas repetitivas de rede durante a digitação.

11. **CameraView com Fallback Manual**: Utilização da API moderna `CameraView` do `expo-camera` with `barcodeScannerSettings={ barcodeTypes: ["qr"] }`. Em caso de QR Code inválido ou recusa de permissão de câmera, o app oferece fallback imediato para seleção manual do nó de partida no grafo.

12. **Filtro por Categorias em Chips**: Na tela de exploração, chips horizontais disparam requisições filtradas por `categoria_id` ou exibem todas as lojas, com indicação em tempo real de status operacional (Aberto/Fechado).

13. **SPA React + Vite servido pelo FastAPI**: Configurado Vite com `base: "/admin/"` e diretório de build direcionado para `backend/app/static/admin/`, com montagem de estáticos via `StaticFiles(..., html=True)` no FastAPI em `/admin`. Isso viabiliza tanto o desenvolvimento desacoplado com proxy reverso quanto a distribuição unificada monólito/SPA a custo zero de hospedagem.

14. **Upload e Armazenamento Local de Plantas Baixas**: Implementado o endpoint `POST /api/admin/floors/{id}/upload-planta` no backend para receber arquivos de imagem (.png, .jpg, .svg, .webp), armazenando-os em `backend/app/static/plantas/` e atualizando o `imagem_planta_url`, mantendo compatibilidade com URLs externas.

15. **Editor Visual com Coordenadas Normalizadas (`Nodes.tsx`)**: O editor calcula as posições de clique e arraste sobre o contêiner da planta baixa normalizando as coordenadas no intervalo `0.0` a `1.0`. Isso desvincula o grafo da resolução ou redimensionamento da imagem e das proporções da tela.

16. **Geração Visual de QR Code Offline no Frontend**: Adotada a biblioteca `qrcode` para renderizar os códigos diretamente em `<canvas>` no navegador. Isso elimina a dependência de serviços de terceiros, garante operação offline e viabiliza a impressão imediata em lote de folhas de teste para a equipe de campo.

17. **Hooks Git e hooks do Codex são diagnósticos distintos**: Não há hook Git ativo na raiz nem `core.hooksPath` configurado. O `.pre-commit-config.yaml` de `indrz-be-main/backend` pertence à referência legada e está versionado no HEAD atual. A falta de `pre-commit` não demonstra a causa do aviso “Hook failed”. Foram reproduzidas falhas do lançador POSIX do Token Optimizer 5.13.12 em PowerShell (ParserError, exit 1) e do alias Bash do WSL sem distribuição (exit 1). O comando PreToolUse/Bash completo retorna 0 usando Git Bash explícito, mas sua reescrita `updatedInput` ainda é POSIX. O evento original e a correção pelo próprio Codex permanecem sem comprovação; nenhum hook foi removido ou desativado. Comandos e erros completos em `evidence/resume-hook-launcher.json` e limites na auditoria.

18. **Critério de aceite de navegadores (RNF08)**: Mantida a exigência de Chrome, Safari, Firefox e Edge nas duas últimas versões. Os cinco alvos Playwright executados no Windows são evidência parcial, não justificam N/A nem comprovam Safari. A matriz de versões efetivamente registradas está em `AUDITORIA_FASES_1-3.md`.

19. **Indisponibilidade e rotas entre pisos**: O visitante solicita novo cálculo pelo botão “Recalcular” após uma alteração administrativa. A evidência registra bloqueio da aresta 4, alternativa de 85 m e restauração da rota original de 61 m. Rotas entre pisos usam conexões verticais; a fixture E2E atravessa elevador, e a API testa escada/elevador e acessibilidade. Não se afirma recálculo automático em tempo real.

20. **Limites da validação de desempenho (RNF03/RNF07)**: O resultado de 08/09 usa Chromium local, SQLite e rede simulada de 9/1 Mbps com 80 ms, cinco amostras e cache frio. Máximos observados: mapa 2222 ms e rota 756 ms. Não comprova desempenho em 4G real, dispositivos, MySQL ou carga concorrente, nem operação offline. Foi conferido, não reexecutado nesta retomada.

21. **Usabilidade (RNF09)**: Permanece pendente até teste com cinco usuários sem treinamento. A definição de pronto exige ausência de erros críticos. O antigo critério de 4/5 conclusões e satisfação ≥ 4/5 não constava na especificação e não é adotado como substituto. Não há resultados de participantes neste repositório.

22. **Estado de entrega**: Fases 1–3 implementadas com evidências locais; aceite integral pendente de MySQL, dispositivos/câmera, RNF08 e RNF09. Exportações Android/iOS não equivalem a execução nativa. A correção de retorno à aba do scanner já consta no código e no E2E simulado de 10/09. Fase 4 e 3D não foram implementados nesta entrega. A auditoria consolidada em 12/09 distingue testes históricos, verificações atuais e pendências.
