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
