# Validação das regras de negócio — 27/09/2026

Ambiente: Windows, Chromium, SQLite descartável, API local e builds de produção
do visitante e do painel. Nenhuma alteração foi publicada no Git nesta etapa.

## Resultados

| Verificação | Resultado |
| --- | --- |
| API completa, após as alterações finais | 129 aprovados, 1 ignorado (MySQL sem configuração) |
| Integração inicial: cena, mapas, jornada, experiência e novas regras | 28 aprovados |
| Verificação final das áreas alteradas: regras, mapas e experiência | 16 aprovados; inclui o novo cenário de divergência espacial |
| Regressão legada: navegação e scanner | 6 aprovados |
| Cadastro/edição/exclusão no painel, após atualizar a expectativa de destino fechado | 1 aprovado |
| Cinco visitantes simultâneos | 1 aprovado; mapas em 2,378–2,509 s e rotas em 0,508–0,684 s |
| TypeScript visitante e painel | Aprovados |
| Builds web visitante e painel | Aprovados |
| Exportação Android/iOS e isolamento dos módulos web | Aprovados; Three.js/Fiber ausentes dos bundles nativos |
| Ruff nos novos módulos Python e teste de regras | Aprovado |
| Verificação de whitespace no diff | Aprovada |

As contagens de navegador se sobrepõem: a verificação final repete áreas alteradas,
não deve ser somada à integração inicial. Os cenários únicos exercitados abrangem
as 29 verificações integradas e as 8 verificações legadas/de concorrência.
Os tempos se referem à fixture legada em localhost e não medem a caminhada nem
garantem esse desempenho em qualquer aparelho ou conexão.

## Ajustes revelados pela validação

- O teste antigo de CRUD esperava rota para loja fechada sem confirmação. Agora
  verifica a rejeição 409 e o cálculo autorizado com `confirmar_indisponivel`.
- A atualização automática pode recuperar uma consulta antes do clique de retry.
  O teste de retry espera a revisão inicial antes de simular a queda de rede.
- Uma gravação de screenshot falhou no diretório sincronizado. A evidência dos
  gestos passou a usar o diretório próprio do teste; a execução seguinte passou.
- `/admin` sem barra final caía na aplicação visitante. Foi adicionado
  redirecionamento explícito para `/admin/`, coberto pelo teste da API.

## Evidências

Os relatórios locais estão em `evidence/business-rules-tests.json`,
`business-rules-final-tests.json`, `business-rules-regression-tests.json`,
`business-rules-crud-tests.json` e `business-rules-performance-tests.json`.
O relatório de regressão conserva a primeira falha de expectativa do CRUD; o
relatório específico do CRUD registra sua aprovação após o ajuste.

## Limites de verificação

MySQL não foi executado localmente; o CI mantém a matriz SQLite/MySQL.
Persistem dois avisos de depreciação de dependências Python, sem falha de teste.
Câmera óptica, placas reais, caminhada, TalkBack/VoiceOver, desempenho móvel e
usabilidade presencial seguem pendentes no [roteiro físico](teste-fisico-visitante.md).
Não houve alteração/exportação do GLB ou do catálogo publicado nesta etapa.

A identificação individual no histórico depende da configuração de chaves
administrativas individuais. A chave compartilhada continua claramente rotulada
como tal. A implantação também precisa criar as tabelas aditivas na inicialização
e usar o cabeçalho de motivo nas integrações administrativas.
