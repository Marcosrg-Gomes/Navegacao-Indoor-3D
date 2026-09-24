# AGENTS.md

## Projeto

Monorepo do TCC de navegação indoor: `services/api` (FastAPI), `apps/visitor`
(Expo), `apps/admin` (React/Vite), `packages/shopping-3d` (Blender) e
`packages/scene-contract` (contrato espacial). Leia o README e a documentação
de integração antes de alterar contratos. A API é a fonte de verdade da
navegação; posições físicas vêm do catálogo gerado pelo Blender.

Preserve as validações Blender e API. Não edite os builds em
`services/api/app/static/visitor` e `admin`; gere-os pelos respectivos comandos.
GLB e catálogo são publicados pelo exportador/publicador, com release explícito.

## Diretrizes de trabalho

- Antes de alterar código, inspecione a estrutura do repositório e leia toda
  documentação relevante (`README.md`, arquivos de configuração e guias).
- Mantenha alterações pequenas e diretamente relacionadas à solicitação.
- Não sobrescreva nem reverta mudanças existentes do usuário sem autorização
  explícita.
- Prefira nomes claros em português ou inglês, mas mantenha consistência com o
  padrão já adotado no projeto.
- Evite adicionar dependências, serviços externos ou variáveis de ambiente sem
  necessidade e sem documentá-los.

## Qualidade e validação

- Execute os testes, verificações de tipo, lint e build disponíveis que forem
  relevantes às alterações realizadas.
- Se não houver automações configuradas, faça ao menos uma validação compatível
  com a tecnologia usada e informe o que não pôde ser verificado.
- Corrija problemas introduzidos pela própria alteração antes de finalizar.

## Documentação

- Atualize o `README.md` quando a alteração mudar instalação, execução,
  arquitetura, configuração ou uso do projeto.
- Nunca inclua segredos, tokens, senhas ou arquivos `.env` no repositório.
- Documente novas variáveis de ambiente em um arquivo de exemplo, quando ele
  existir, sem valores sensíveis.

## Git

- Não faça commits, pushes, merges, resets ou operações destrutivas sem pedido
  explícito.
- Preserve o histórico e as alterações locais que não fazem parte da tarefa.
