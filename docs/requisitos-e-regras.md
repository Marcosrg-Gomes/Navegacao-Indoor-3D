# Requisitos e regras de negócio

Esta matriz reúne as melhorias solicitadas. “Implementado” descreve o comportamento
do código; a validação em aparelhos e no shopping segue o roteiro físico e não é
substituída por testes de navegador. A API continua sendo a fonte da navegação e o
catálogo Blender continua sendo a fonte da geometria publicada.

## Requisitos funcionais implementados

| ID | Comportamento e critério de aceite |
| --- | --- |
| RF01 | Localização exibe ponto, piso, origem da informação e horário de atualização. |
| RF02 | Chegada verifica a revisão do mapa; destino válido vira origem e muda o piso. Natura → Anacapri parte da Natura após a chegada. |
| RF03 | Uma instrução principal por vez; avançar ou voltar instruções não move a pessoa. |
| RF04 | Trocas de piso identificam acesso e pisos, com instruções estruturadas por etapa. |
| RF05 | Recálculo mantém o trajeto anterior legível; falha bloqueia chegada e permite repetir sem perder origem/destino. |
| RF06 | Explorar busca nome, categoria e tipo; filtra piso, categoria, funcionamento e percurso sem escadas; ordena nome, categoria, piso atual ou distância do grafo. Inclui serviços sem loja. |
| RF07 | Favoritos e destinos recentes por shopping; retorno à entrada da sessão, com alternativa ativa se ela desaparecer. |
| RF08 | Aberto, fechado e manutenção têm estados próprios; indisponíveis exigem confirmação; horário não cadastrado não é inventado. |
| RF09 | Revisão da API detecta bloqueios/desbloqueios e alterações do cadastro; rota ativa é recalculada automaticamente. Falhas de rede, destino indisponível e ausência de rota têm mensagens distintas. |
| RF10 | Ajuda inicial pode ser dispensada, lembra a escolha e pode ser reaberta; explica acessibilidade, localização e pisos. |
| RF11 | Scanner oferece código manual, seleção manual da origem, orientações de permissão e nova tentativa da câmera. |
| RF12 | Cancelar preserva a origem; mapas mantêm a exploração manual e a troca 2D/3D não recria o 3D carregado. Reabrir a sessão exige nova confirmação de localização. |

## Regras de negócio implementadas

| ID | Regra |
| --- | --- |
| RN01 | Caminho, distância, disponibilidade e bloqueios são determinados pela API, nunca por distância em linha reta no cliente. |
| RN02 | A origem muda somente por QR válido, escolha manual validada ou chegada confirmada. |
| RN03 | Chegada encerra o trajeto e estabelece a origem da próxima navegação. |
| RN04 | Origem e destino pertencem ao mesmo shopping; a troca de shopping limpa a navegação e a entrada lembrada. |
| RN05 | Conexões entre pisos usam conectores do mesmo tipo; pares incompatíveis são rejeitados no cadastro e ignorados no grafo. |
| RN06 | Percurso acessível exclui escadas, escadas rolantes e trechos não acessíveis; pode ser maior ou inexistente. Não é certificação do estabelecimento. |
| RN07 | Arestas inativas não entram no próximo cálculo. A tela detecta revisões a cada dois segundos enquanto ativa, mais latência da rede. |
| RN08 | Falha ou mudança relevante torna a rota anterior desatualizada: legível, sem permitir chegada até nova validação. |
| RN09 | Hierarquia pública exige shopping, piso e nó ativos; origens inativas são rejeitadas pela API. |
| RN10 | Fechado/manutenção permite trajeto somente com confirmação; inativo continua indisponível. |
| RN11 | Voltar à entrada usa a entrada ativa lembrada na sessão ou outra entrada ativa do shopping. |
| RN12 | Distâncias respeitam direção, bloqueios e preferência de acesso. Sem caminho é diferente de distância ainda não consultada. |
| RN13 | Preferências usam códigos estáveis, com limite de 100 favoritos e 8 recentes por shopping. A posição não é persistida. |
| RN14 | QR ativo requer token único e nó em hierarquia ativa. Placa movida exige alteração do vínculo; o sistema não detecta deslocamentos físicos. |
| RN15 | Publicação de cena valida contrato, vínculos e conectividade. GLB, catálogo e banco incompatíveis impedem uso/publicação da cena; mudanças na revisão revalidam a cena aberta e ativam fallback 2D se houver divergência. |
| RN16 | Escritas administrativas registram identificação autenticada, UTC, motivo e antes/depois de forma atômica. Edições podem ser restauradas se não houver conflito; exclusões são reconstruídas pelo cadastro e tokens são omitidos. |

## Requisitos não funcionais

- Metas de rota em até 1 segundo e mapa utilizável em até 3 segundos são avaliadas
  em cenários controlados, inclusive cinco visitantes simultâneos. Não são uma
  garantia para qualquer conexão, aparelho ou tamanho de shopping.
- Controles principais têm alvo de pelo menos 44 px, nomes acessíveis, navegação
  por teclado e adaptação do layout à escala de fonte. Leitores de tela reais e
  gestos em aparelhos precisam do teste físico.
- Falha de WebGL/modelo mantém mapa 2D e instruções. O mapa 2D também pode ser
  escolhido explicitamente.
- Preferências ficam no aparelho; nenhuma trilha de localização é persistida.
  Diagnóstico contém apenas contagens por classe de erro. Eventos offline são
  temporários na memória da sessão, com supressão de repetição por 30 segundos.
- Auditoria exige autenticação; chaves individuais opcionais permitem distinguir
  autores. A credencial legada é explicitamente identificada como compartilhada.

## Contratos adicionados

- `GET /api/shoppings/{id}/navigation-state`: `{revisao, ativo}`. A revisão é um
  hash dos dados de navegação e informações públicas do shopping, sem tokens QR.
  Inclui mudanças feitas diretamente no banco. Não representa a versão do GLB.
- `POST /api/routes`: recebe `confirmar_indisponivel` (padrão `false`) e devolve
  `revisao`; erros de negócio expõem `X-Error-Code`. Cliente só confirma chegada
  se a revisão atual corresponder à do trajeto.
- `POST /api/diagnostics/events`: aceita somente enums `tipo` e `codigo` definidos
  no schema; campos adicionais são rejeitados. Nenhum texto livre é registrado.
- `GET /api/admin/session`, `/audit`, `/diagnostics`: identidade e consultas
  autenticadas; auditoria tem paginação `before_id`, `limit` e filtro `entidade`.
- `POST /api/admin/audit/{id}/restore`: exige autenticação e motivo; reaplica a
  versão anterior pelos validadores dos cadastros e registra nova auditoria.
- Toda escrita `/api/admin/*` requer `X-Audit-Reason` codificado em URL, de 3 a
  240 caracteres. Não incluir dados pessoais, credenciais ou tokens nesse campo.

## Verificação

`services/api/tests/test_business_rules.py` cobre auditoria atômica, identificação,
restauração e conflitos, revisão, destino fechado, QR, conectores e diagnósticos.
As demais suítes preservam navegação, hierarquia, distâncias, publicação e contratos.
`apps/admin/tests/business-rules.spec.ts` cobre atualização automática, validação
antes da chegada, filtros, confirmação de destino fechado e histórico no painel.
As suítes de jornada, experiência, mapas, cena, scanner e CRUD cobrem as demais
regras. A execução e suas limitações são registradas na documentação de validação.

Pendentes de ambiente físico: câmera com placas reais, caminhada no shopping,
TalkBack/VoiceOver, rede móvel, desempenho no aparelho-alvo e homologação MySQL
quando não houver servidor configurado. Consulte `teste-fisico-visitante.md`.

## Rastreabilidade — IDs do TCC vs IDs do repositório

A tabela abaixo relaciona os IDs do TCC (memorial) aos IDs implementados no
repositório (`docs/requisitos-e-regras.md`). A correspondência é feita por
semântica do comportamento; os IDs do repositório são a fonte de verdade do
código.

| ID do TCC | Requisito do TCC (memorial) | ID do repositório | Comportamento implementado no repositório |
|-----------|-----------------------------|-------------------|-------------------------------------------|
| RF01 | Localização exibe ponto, piso, origem e horário | RF01 | Localização exibe ponto, piso, origem da informação e horário de atualização. |
| RF02 | Chegada valida revisão e muda origem/destino | RF02 | Chegada verifica a revisão do mapa; destino válido vira origem e muda o piso. |
| RF03 | Uma instrução principal por vez | RF03 | Uma instrução principal por vez; avançar/voltar não move a pessoa. |
| RF04 | Trocas de piso identificam acesso e pisos | RF04 | Trocas de piso identificam acesso e pisos, com instruções estruturadas por etapa. |
| RF05 | Recálculo mantém trajeto legível | RF05 | Recálculo mantém o trajeto anterior legível; falha bloqueia chegada. |
| RF06 | Explorar busca e filtra percurso | RF06 | Explorar busca nome, categoria e tipo; filtra piso, categoria, funcionamento e percurso sem escadas. |
| RF07 | Favoritos e recentes por shopping | RF07 | Favoritos e destinos recentes por shopping; retorno à entrada da sessão. |
| RNF01 | Metas de desempenho de rota/mapa | — (RNF) | Rota em até 1 s e mapa em até 3 s, avaliados em cenários controlados. |
| RNF02 | Acessibilidade de controles | — (RNF) | Alvos ≥ 44 px, nomes acessíveis, teclado, adaptação à escala de fonte. |
| RNF03 | Falha WebGL/modelo mantém 2D | — (RNF) | Falha de WebGL/modelo mantém mapa 2D e instruções. |
| RNF04 | Preferências no aparelho, sem rastreio | — (RNF) | Preferências ficam no aparelho; nenhuma trilha de localização é persistida. |
| RNF05 | Auditoria autenticada | — (RNF) | Auditoria exige autenticação; chaves individuais opcionais. |
| RNF06 | Diagnóstico sem dados pessoais | — (RNF) | Diagnóstico contém apenas contagens por classe de erro. |
| RN01 | Caminho/distância/bloqueios pela API | RN01 | Caminho, distância, disponibilidade e bloqueios são determinados pela API. |
| RN02 | Origem muda por QR/escolha/chegada | RN02 | A origem muda somente por QR válido, escolha manual validada ou chegada confirmada. |
| RN03 | Chegada encerra trajeto e define origem | RN03 | Chegada encerra o trajeto e estabelece a origem da próxima navegação. |
| RN04 | Origem/destino mesmo shopping | RN04 | Origem e destino pertencem ao mesmo shopping; troca de shopping limpa a navegação. |
| RN05 | Conectores entre pisos por tipo | RN05 | Conexões entre pisos usam conectores do mesmo tipo; pares incompatíveis são rejeitados. |

## Casos de teste T01–T11 e cobertura concreta

Cada caso aponta para o teste (ou suíte) que o cobre. "Lacuna" indica que não há
teste automatizado para o caso.

| Caso | Descrição | Teste concreto que cobre |
|------|-----------|--------------------------|
| T01 | QR válido resolve origem | `services/api/tests/test_integracao_funcional.py::test_qr_valido_resolve_origem`; `services/api/tests/test_api.py::test_resolver_qr_code` |
| T02 | QR inválido não resolve | `services/api/tests/test_integracao_funcional.py::test_qr_invalido_nao_resolve`; `services/api/tests/test_api.py::test_estado_navegacao_shopping_inexistente` |
| T03 | Origem definida/inativa | `services/api/tests/test_navigation.py::test_distancias_rejeitam_origem_inativa`; `services/api/tests/test_integracao_funcional.py::test_origem_igual_destino_rejeitado` |
| T04 | Busca de POI por nome/categoria | `services/api/tests/test_api.py::test_buscar_pois`; `services/api/tests/test_audit.py::test_closed_maintenance_and_category_search` |
| T05 | Rota normal entre pisos | `services/api/tests/test_api.py::test_calcular_rota`; `services/api/tests/test_navigation.py::test_rota_valida`; `services/api/tests/test_integracao_funcional.py::test_rota_normal_entre_pisos` |
| T06 | Sem rota / sem caminho acessível | `services/api/tests/test_navigation.py::test_rota_sem_caminho`; `services/api/tests/test_integracao_funcional.py::test_sem_caminho_acessivel_quando_elevador_bloqueado` |
| T07 | Troca de piso e percurso sem escadas | `services/api/tests/test_navigation.py::test_etapas_identificam_troca_de_piso`; `services/api/tests/test_integracao_funcional.py::test_rota_acessivel_usa_elevador_nao_escada`; `services/api/tests/test_navigation.py::test_accessible_route_absent_is_reported_explicitly` |
| T08 | Chegada e revisão do mapa | `services/api/tests/test_business_rules.py::test_destino_indisponivel_exige_confirmacao`; `services/api/tests/test_api.py::test_estado_navegacao_revisao_muda_quando_dados_mudam`; fluxo de chegada coberto por `apps/admin/tests/business-rules.spec.ts` (validação antes da chegada) |
| T09 | Telas (mapa, detalhes, exploração) | `apps/admin/tests/scene.spec.ts`, `apps/admin/tests/map-interactions.spec.ts`, `apps/admin/tests/visitor-journey.spec.ts`, `apps/admin/tests/visitor-experience.spec.ts` |
| T10 | Compreensão (ajuda, instruções, acessibilidade) | `apps/admin/tests/visitor-experience.spec.ts`, `apps/admin/tests/visitor-journey.spec.ts`, `apps/admin/tests/layout-accessibility.spec.ts` |
| T11 | Permissões admin (chave inválida/ausente) | `services/api/tests/test_seguranca_estabilidade.py::test_admin_chave_incorreta_leitura_escrita`; `services/api/tests/test_seguranca_estabilidade.py::test_admin_sem_chave_todos_endpoints`; `services/api/tests/test_api.py::test_admin_sem_api_key`; `services/api/tests/test_audit.py::test_every_admin_operation_requires_key` |

Lacunas identificadas: nenhum caso T01–T11 ficou sem cobertura automatizada na API. Os casos de tela (T09) e compreensão (T10) dependem dos specs Playwright do CI, executados apenas no job `frontends` (não localmente por falta de infraestrutura de servidores e browsers).

Pendentes de ambiente físico: câmera com placas reais, caminhada no shopping,
TalkBack/VoiceOver, rede móvel, desempenho no aparelho-alvo e homologação MySQL
quando não houver servidor configurado. Consulte `teste-fisico-visitante.md`.
