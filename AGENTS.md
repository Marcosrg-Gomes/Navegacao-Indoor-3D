# AGENTS.md

## Projeto

Monorepo do TCC de navegação indoor: `services/api` (FastAPI), `apps/visitor` (Expo), `apps/admin` (React/Vite), `packages/shopping-3d` (Blender) e `packages/scene-contract` (contrato espacial).

A API é a fonte de verdade da navegação; posições físicas vêm do catálogo gerado pelo Blender.

Preserve as validações Blender e API. Não edite os builds em `services/api/app/static/visitor` e `admin`; gere-os pelos respectivos comandos. GLB e catálogo são publicados pelo exportador/publicador, com release explícito.

Leia o README e a documentação de integração quando a tarefa envolver arquitetura, contratos ou funcionamento relacionado.

## Diretrizes de trabalho

- Priorize implementação e entrega de funcionalidades.
- Trabalhe em lotes funcionais completos, evitando fragmentação excessiva.
- Consulte somente os arquivos e documentos necessários à tarefa atual.
- Não faça auditorias gerais sem solicitação explícita.
- Não repita análises ou diagnósticos já realizados sem motivo concreto.
- Mantenha as alterações relacionadas ao objetivo do lote.
- Preserve funcionalidades existentes, evidências e decisões arquiteturais.
- Não sobrescreva nem reverta mudanças do usuário sem autorização explícita.
- Evite dependências, serviços externos e variáveis de ambiente desnecessários.
- Não interrompa a implementação por problemas secundários fora do escopo.

## Autonomia dos agentes

- Tome decisões técnicas coerentes com a arquitetura existente.
- Resolva diretamente problemas encontrados dentro do escopo.
- Evite solicitar confirmações para decisões reversíveis e de baixo risco.
- Não amplie o escopo sem necessidade.
- Não duplique trabalho já realizado por outro agente.
- Não entregue apenas recomendações quando a tarefa solicitar implementação.
- Priorize concluir o lote atual antes de iniciar tarefas secundárias.
- Respeite as alterações realizadas por outros agentes.

## Qualidade e validação

- Execute testes, verificações de tipo, lint e builds relevantes às alterações.
- Não repita suítes completas já aprovadas sem justificativa técnica.
- Reutilize resultados recentes de testes quando o código relacionado não tiver mudado.
- Corrija problemas introduzidos pelas próprias alterações.
- Informe limitações reais de validação, sem transformar isso em auditoria adicional.

## Documentação

- Atualize o README quando houver mudanças em instalação, execução, arquitetura, configuração ou uso.
- Nunca inclua segredos, tokens, senhas ou arquivos `.env` no repositório.
- Documente novas variáveis de ambiente em arquivos de exemplo, quando existirem, sem valores sensíveis.

## Git e proteção do projeto

- Não faça commits, pushes, merges, resets ou operações destrutivas sem pedido explícito.
- Preserve o histórico e as alterações locais.
- Não descarte alterações de outros agentes.
- Verifique o estado do Git antes de operações que possam afetar mudanças existentes.

## Formato de entrega

Ao concluir cada lote, apresente objetivamente:

1. Funcionalidades implementadas.
2. Arquivos modificados.
3. Testes executados e resultados.
4. Pendências reais, se houver.

Não produza relatórios extensos ou auditorias não solicitadas.

**Regra principal: implementar, validar e entregar. Evitar análises repetitivas, retrabalho e desperdício de utilização.**