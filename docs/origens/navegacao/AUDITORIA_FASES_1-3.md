# Auditoria de completude — Fases 1–3

Consolidação: 12/09/2026 (America/Sao_Paulo). Base: commit `88f27d3`, repositório inicialmente limpo. A especificação permanece inalterada.

## Resultado e ponto de retomada

As Fases 1–3 estão implementadas, mas **não têm aceite integral**. Permanecem pendentes a homologação MySQL, execução nativa/leitura óptica em dispositivos, a matriz completa RNF08 e o teste RNF09. RNF03 tem evidência local em rede simulada, com os limites descritos abaixo. Fase 4 e recursos 3D estão fora desta entrega.

O último ponto concluído registrado em 10/09 foi a correção da releitura do scanner ao retornar à aba (`useIsFocused` em `mobile/app/(tabs)/scan.tsx`), seguida de **88 testes Python aprovados** e **26 E2E aprovados / 4 pulados / 0 falhas**. O README já indicava as ressalvas; esta auditoria ainda continha a síntese antiga de 87 testes e classificava RNF08 indevidamente como N/A.

Nesta retomada foram inspecionados os relatórios, seus anexos e o código correspondente, reproduzidos problemas do lançador de hooks e corrigida a documentação. Não foram repetidos builds, pytest, E2E ou RNF03; seus resultados abaixo são históricos, não novos testes da aplicação.

## Matriz de requisitos

“Verificado” significa evidência no cenário automatizado descrito, sem estender o resultado a dispositivos, bancos ou versões não testados.

| Requisitos | Estado e evidência | Limites / pendência |
|---|---|---|
| RF01–RF02, RN01 | Link/token QR, origem automática e fallback manual em `navigation.spec.ts`; unicidade e referências na API | Scanner óptico/câmera física e execução nativa pendentes; fixture do scanner é simulada |
| RF03, RF08 (2D) | Planta, mapa SVG, rota, zoom e troca de piso implementados; anexos e screenshots em `closure-*` | RF08 em 3D fora destas fases; screenshots não validam todos os gestos em dispositivo |
| RF05–RF06, RN02, RN06, RN09 | Busca parcial, categorias e status operacional verificados no E2E e `test_audit.py` | Cobertura de navegadores limitada à matriz abaixo |
| RF07, RN03–RN04 | Dijkstra, conectividade, erros e separação entre shoppings: código e testes da API/motor | Fixtures pequenas em SQLite; não são homologação de produção |
| RF10–RF11 | Detalhes do POI e aviso de chegada cobertos pelo fluxo E2E | Chegada confirmada pelo botão do visitante; não há posicionamento contínuo |
| RF12 | CRUD implementado; testes de API, autenticação, referências, upload e validação do grafo; painel com E2E de arestas/QR/refresh | E2E não cobre cada operação CRUD de todas as telas; persistência MySQL pendente |
| RF13, RN07, RN11 | Ciclo bloquear → rota alternativa → reativar em cinco alvos; nó intermediário inativo coberto em Python | Recálculo acionado por “Recalcular”; não há evidência de atualização automática por push |
| RN05 | Rota entre pisos na fixture, com transição por elevador; escada/elevador/acessibilidade testados na API | Não é demonstração presencial em edifício |
| RN10 | Fixture pequena compatível com o recorte MVP | A presença de dois pisos não dispensa RN05 |
| RNF01 | Base React Native compartilhada e exportações web/Android/iOS existentes | Bundle exportado não comprova instalação/execução Android e iOS |
| RNF02 | Layout sem overflow em 360×640 e 414×896; painel em 360/414 px | Viewports de desktop automatizados; não equivalem a aparelhos físicos |
| RNF03 | Verificado no perfil local simulado: mapa ≤ 3 s, rota < 1 s em cinco amostras | Não extrapolar para 4G real, outro hardware, carga simultânea ou MySQL |
| RNF04–RNF05 | Coordenadas 0–1 nos schemas/testes; separação entre frontend, backend e dados | Inspeção de implementação, sem alegação de ensaio adicional |
| RNF07 | Evidência parcial: perfil limitado de banda e recuperação de falha na busca | Depende da API; não comprova operação offline nem toda condição de conectividade |
| RNF08 | **PARCIAL / PENDENTE**, aplicável às Fases 1–3 | Faltam as duas últimas versões dos quatro navegadores exigidos; WebKit não é Safari |
| RNF09 | **PENDENTE**, nenhum resultado com usuários registrado | Exige cinco usuários sem treinamento e ausência de erros críticos, conforme definição de pronto |
| RF04, RF09, RNF06, RN08; parcela 3D de RF08 | Fora do escopo das Fases 1–3 | Não implementados nem homologados nesta entrega |

## RN05 — rota entre andares

`evidence/closure-browser-tests.json` contém anexos `multi-floor-360` e `multi-floor-414` nos cinco projetos, totalizando dez anexos. A rota é `[1, 3, 4, 5, 6, 23, 24, 26]`; a transição `23 → 24` conecta nós do tipo `elevador` nos pisos 1 e 2. O teste verifica a resposta da API, o aviso “Rota entre pisos” e a troca do mapa para “Piso superior”.

`test_two_floors_stairs_elevator_accessibility` também consta no XML aprovado: rota comum de 9 m via escada, acessível de 28 m via elevador, instrução de descida no retorno e rejeição de salto arbitrário entre lojas de pisos distintos.

## RF13 / RN07 / RN11 — indisponibilidade e restauração

Os cinco anexos `edge-cycle` registram a aresta 4 e o mesmo ciclo:

| Estado | Nós da rota | Distância |
|---|---|---|
| Original | 1 → 3 → 4 → 5 → 6 → 11 → 17 | 61 m |
| Bloqueada no painel e recalculada pelo visitante | 1 → 3 → 4 → 13 → 14 → 6 → 11 → 17 | 85 m |
| Reativada no painel e recalculada | 1 → 3 → 4 → 5 → 6 → 11 → 17 | 61 m |

O teste verifica os extremos da aresta, sua ausência na alternativa e o retorno da sequência/distância originais. A limpeza restaura o estado da aresta. `test_block_reactivate_no_stale_graph` e `test_inactive_intermediate_node_is_not_traversed` complementam a evidência pela API, inclusive para nó desabilitado.

## RNF03 — desempenho

Fonte: `evidence/browser-tests.json`, execução iniciada em **08/09/2026 23:03:33 -03:00**, e `evidence/performance-after.json`. Cinco contextos novos, cache desabilitado, Chromium, viewport 360×640, servidor local SQLite, perfil simulado de **9 Mbps download / 1 Mbps upload / 80 ms de latência**.

| Amostra | Mapa (ms) | Rota (ms) |
|---|---:|---:|
| 1 | 2218 | 756 |
| 2 | 2197 | 686 |
| 3 | 2222 | 656 |
| 4 | 2102 | 649 |
| 5 | 2200 | 672 |

Máximos: **2222 ms para mapa, 756 ms para rota**. `performance.spec.ts` mede desde o início da navegação até mapa/origem visíveis e decodificação da planta; rota mede clique até painel visível, incluindo UI/rede/API. Não é medição isolada de Dijkstra. Não usa redução de CPU nem aparelho físico. A versão do navegador não foi anotada nessa execução antiga; não atribuir a ela a versão registrada na rodada posterior.

`test_mvp_measured_latency` está aprovado no XML de 88 casos: 30 consultas de grafo e 30 rotas, fixture de 5 nós/6 arestas, limites de 3000/1000 ms. O XML não preserva os valores impressos de mediana/máximo: esses números **não estão comprovados**. A suíte de navegação de 10/09 não inclui `performance.spec.ts` e não renova o resultado de RNF03.

## RNF08 — matriz efetivamente executada

A especificação exige **Chrome, Safari, Firefox e Edge, últimas duas versões**. Relatório de 10/09 (`closure-browser-tests.json`, Windows):

| Alvo | Versão registrada | Navegação | Scanner simulado |
|---|---|---|---|
| Chromium do Playwright | 153.0.8010.12 | 5 aprovados | 1 aprovado |
| Firefox do Playwright | 155.0 | 5 aprovados | Pulado |
| WebKit do Playwright | 26.6 | 5 aprovados | Pulado |
| Chrome, canal instalado | 152.0.7977.83 | 5 aprovados | Pulado |
| Edge, canal instalado | 152.0.4191.66 | 5 aprovados | Pulado |

Há 26 aprovações e 4 skips, não 30 aprovações. Chromium não é uma segunda versão homologada do Chrome, Firefox do Playwright não comprova as duas versões comerciais e WebKit no Windows não comprova Safari em macOS/iOS. As versões acima são as anotadas no relatório, sem afirmação de que sejam as mais recentes hoje.

Para fechar RNF08: executar os fluxos no navegador real, registrar navegador/SO/versão/data, cobrir as duas versões requeridas de cada produto e testar os caminhos de câmera em plataformas compatíveis. Não classificar a ausência desse ambiente como N/A.

## RNF09 — usabilidade presencial

**PENDENTE.** Não foram recrutados participantes nem coletados tempos, satisfação ou resultados neste ambiente. A especificação pede cinco usuários sem treinamento; a definição de pronto exige ausência de erros críticos. O critério anterior “4/5 concluem e satisfação ≥ 4/5” não vem da especificação e foi removido como condição de aceite.

Roteiro proposto, ainda não executado: entregar QR de entrada, pedir localização de uma loja, observar busca e categoria, reação a QR inválido/local em manutenção e conclusão do trajeto. Registrar ajuda necessária, conclusão, tempos e erros de forma anonimizada. Classificar erros críticos e documentar correções/reteste antes do aceite. Salvar resultados reais em `evidence/rnf09-usabilidade.md` quando existirem; esse arquivo não foi preenchido com dados simulados.

## Hook failed with code 1

**Diagnóstico local reproduzido; vínculo com o evento original e correção integrada ainda pendentes.** Não existe hook Git ativo na raiz: `.git/hooks` contém apenas `.sample`, e `core.hooksPath` não está definido. O código 1 de `git config --get core.hooksPath`, sem saída, significa chave ausente nesse comando; não é execução de hook.

O arquivo `indrz-be-main/backend/.pre-commit-config.yaml` pertence à referência legada e **está versionado no HEAD atual**. Não há evidência de que ele dispare o aviso do Codex. Instalar `pre-commit` não é uma correção demonstrada para esse incidente.

Foram identificados hooks de eventos do Token Optimizer em `~/.codex/plugins/cache/alexgreensh-token-optimizer/token-optimizer/5.13.12/hooks/hooks.json`, com estados de confiança no `config.toml` local. O comando é um laço POSIX `for b in bash ...; do ...`, sem `commandWindows` nessa configuração. O registro anterior consultava a versão 5.13.10 e executava runners Python diretamente; isso não testava o lançador completo.

Reprodução atual em `evidence/resume-hook-launcher.json`:

- Comandos configurados de **PreToolUse/Bash, PostToolUse, UserPromptSubmit e Stop**, executados individualmente com PowerShell: **exit 1**, `ParserError / MissingOpenParenthesisAfterKeyword`, antes de entrar no Python.
- `bash.exe` resolvido pelo PATH do PowerShell aponta para `WindowsApps`: **exit 1**, “Subsistema do Windows para Linux não tem distribuições instaladas”.
- Git Bash explícito: versão consultada com **exit 0**. O comando completo de **PreToolUse/Bash**, sob Git Bash e PATH ajustado apenas no processo filho, retorna **exit 0**, sem stderr e com JSON `permissionDecision: allow`. Esse retorno ainda propõe um comando POSIX em `updatedInput`; não comprova compatibilidade dessa reescrita com PowerShell.

Essas são causas comprovadas das reproduções, não prova de qual evento/shell emitiu cada aviso histórico. Não foi encontrado registro que associe o aviso original a um ID de hook, shell e stderr. Nenhum hook, configuração global, confiança ou PATH persistente foi alterado. Não se declara o incidente resolvido.

Para fechar o incidente, capturar evento/ID/comando/shell/stderr do aviso real, corrigir o lançador e eventual `updatedInput` para esse shell e verificar a execução pelo próprio Codex. A documentação oficial admite override Windows `commandWindows`, mas sua adoção e a reescrita de comandos ainda exigem validação integrada: [Hooks](https://learn.chatgpt.com/docs/hooks).

## Inventário e comandos de evidência

| Evidência | Resultado registrado / uso nesta retomada |
|---|---|
| `closure-pytest.xml` (10/09) | 88 testes, 0 falhas/erros/skips, 3,849 s; consultado, não reexecutado |
| `final-pytest.xml` (08/09) | 88 testes; histórico anterior preservado |
| `closure-browser-tests.json` (10/09) | 26 aprovados, 4 pulados, 0 falhas/flaky; 95,195 s |
| `closure-scanner-before.json` | 1 falha anterior à correção do scanner, preservada; não é falha atual da rodada final |
| `final-browser-tests.json` (08/09) | 25 aprovações de navegação; histórico anterior preservado |
| `browser-tests.json` e `performance-after.json` (08/09) | 6 aprovações Chromium, incluindo RNF03; cinco amostras preservadas |
| `resume-evidence-verification.json` | Nova conferência dos anexos: cinco ciclos de aresta e dez rotas entre pisos; hashes SHA-256 das fontes e limites das amostras históricas |
| `resume-hook-launcher.json` | Novas reproduções manuais com comandos, stdout, stderr, exit codes e hash da configuração do plugin |

Comandos usados na retomada: `git status --short`, `git log -6 --oneline`, `git config --show-origin --get core.hooksPath`, `Get-ChildItem .git/hooks -Force`, `git ls-files '*pre-commit*'`, leitura dos quatro documentos prioritários, testes e configuração Playwright, decodificação Base64 dos anexos JSON e leitura dos XML via Python, `python evidence/verify_hook_launcher.py`. A consulta dos registros locais do Codex foi somente leitura; conteúdo de credenciais não foi copiado para as evidências.

Build/typecheck constavam como aprovados no registro anterior, e os bundles exportados existem. Não há novo log de build produzido nesta retomada. Os comandos de reprodução estão no README; executar novamente só quando necessário, com nomes novos de relatório para preservar o histórico.

## Condições de encerramento

- **Fase 1:** implementada e verificada nas fixtures SQLite; falta comprovar persistência/migração/CRUD/rotas em MySQL.
- **Fase 2:** implementada em web/mobile; faltam execução nativa/câmera física, RNF08 completo e RNF09. Desempenho comprovado somente no perfil simulado registrado.
- **Fase 3:** implementada, com evidências de API e fluxos administrativos; homologação completa de navegadores e ambiente final pendente.
- **Ambiente de desenvolvimento:** falhas do lançador reproduzidas, incidente original de hook ainda sem fechamento integrado.

É possível apresentar a implementação e as evidências locais das Fases 1–3. Não é correto declarar todos os requisitos concluídos ou congelar o MVP com aceite integral. Nenhuma implementação da Fase 4 foi realizada.
