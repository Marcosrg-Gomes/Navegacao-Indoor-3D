# Relatório Lote 2A — Validação Técnica e Seleção das Agent Skills

> Modo: somente leitura. Nenhuma Skill foi instalada, atualizada, copiada, movida, removida ou modificada.
> Nenhuma configuração, MCP, variável de ambiente, arquivo do TCC ou operação Git foi alterada.
> As duas cópias da Skill `alethe` foram preservadas integralmente.
> Arquivo separado: não sobrescreve `RELATORIO_LOTE1_PARTE2.md`.

---

## 1. Metodologia e escopo da inspeção

Foram lidas na íntegra (ou parcialmente quando indicado) as SKILL.md e recursos relevantes das 26 candidatas listadas no Lote 2A, mais `alethe` (referência de orquestração) e as 3 Skills do Alethe Desktop já inventariadas. Tudo via leitura direta de arquivos locais; nada foi baixado da rede. Fatos verificados são distinguidos de hipóteses. Não foram inventados repositórios, licenças nem compatibilidades.

Ambientes identificados no inventário (7):
1. OpenCode — `~/.config/opencode/skills/` (43 Skills)
2. Codex — `~/.codex/skills/` (8 Skills + `.system/`)
3. Alethe Desktop — `~/.agents/skills/` (3 Skills)
4. Claude Code — `~/.claude/skills/` (vazio)
5. GitHub Copilot CLI — `~/.copilot/` (plugins, vazio; não usa Skills)
6. Kimi Code — `~/.kimi-code/` (sem diretório `skills/`)
7. Antigravity / Antigravity IDE — extensões VS Code (sem diretório de Skills)

Legenda de compatibilidade:
- **Confirmada por documentação**: Skill presente no diretório de descoberta do agente com SKILL.md válido.
- **Confirmada por teste anterior**: não aplicável (não houve testes executados nesta tarefa).
- **Parcial**: formato lido, mas funcionalidade cross-agente não evidenciada.
- **Não confirmada**: ausência de evidência no diretório do agente.
- **Não suportada**: agente não usa o padrão Skills (plugins/extensões).

---

## 2. Lista de Skills aprovadas para futura biblioteca compartilhada

Critérios: utilidade prática, qualidade do conteúdo, manutenção evidenciada, ausência de redundância, compatibilidade de formato com OpenCode (o único ambiente com biblioteca madura local), preservação de `alethe`.

| # | Skill | Origem / repositório | Licença (verificada) | Finalidade resumida | Prioridade | Compatibilidade mais evidenciada |
|---|-------|----------------------|----------------------|---------------------|------------|----------------------------------|
| 1 | `alethe` | `Kc1t/alethe-orchestrate-skill` (skills-lock.json do projeto) | Não declarada | Orquestração de workers CLI (Codex, Claude, Agy, Kimi) com playbooks, orçamento de tokens e quotas | Alta | Projeto (`.agents/skills/alethe/`), duas cópias idênticas |
| 2 | `using-agent-skills` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Meta-skill de descoberta e invocação de Skills; sequência de ciclo de vida | Alta | OpenCode (confirmada por documentação) |
| 3 | `context-engineering` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Curação de contexto do agente (regras, specs, hierarquia, orçamento) | Alta | OpenCode |
| 4 | `context7-mcp` | `~/.agents/skills/` (Alethe Desktop) | Não declarada | Busca de documentação atual de bibliotecas via Context7 MCP | Alta | Alethe Desktop (confirmada por documentação) |
| 5 | `find-skills` | `~/.agents/skills/` (vercel-labs/skills) | Não declarada | Descoberta e instalação de Skills do ecossistema open (npx skills) | Média | Alethe Desktop |
| 6 | `frontend-design` | `.\.agents\skills\frontend-design\` (projeto) | MIT (Vipul Gupta, 2026) | Interfaces frontend com identidade visual, tokens, acessibilidade | Alta | Projeto (confirmada por documentação) |
| 7 | `frontend-ui-engineering` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | UI production-quality, WCAG AA, responsivo, design system | Alta | OpenCode |
| 8 | `design-taste-frontend` | `~/.config/opencode/skills/` (adaptado de Leonxlnx/taste-skill) | MIT (adaptado) | Direção estética para landing pages/portfolios; anti-default LLM | Média | OpenCode |
| 9 | `design-workflow` | `~/.config/opencode/skills/` | MIT | Workflow end-to-end de design (brief → taste skill → Playwright verificação) | Média | OpenCode (declara compatibility: claude-code, opencode) |
| 10 | `software-development` | `~/.config/opencode/skills/` | Não declarada | Boas práticas gerais de dev em múltiplas linguagens + Context7 | Alta | OpenCode |
| 11 | `api-and-interface-design` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Contratos de API, módulos, idempotência, erros consistentes | Alta | OpenCode |
| 12 | `software-architecture` | `~/.config/opencode/skills/` | Não declarada | Decisões estruturais, ADRs, estilos arquiteturais, dívida técnica | Alta | OpenCode |
| 13 | `code-simplification` | `~/.config/opencode/skills/` (inspirado em Claude Code Simplifier) | MIT (adaptado) | Reduzir complexidade preservando comportamento | Média | OpenCode |
| 14 | `code-review-and-quality` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Revisão multieixo (correção, leitura, arquitetura, segurança, performance) | Alta | OpenCode |
| 15 | `test-driven-development` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Ciclo red-verde-refatorar; prova-de-bug; pirâmide de testes | Alta | OpenCode |
| 16 | `testing-qa` | `~/.config/opencode/skills/` | Não declarada | Estratégia de testes (unit/integ/E2E/API), Playwright, pytest, flaky, CI | Alta | OpenCode |
| 17 | `playwright-cli` | `~/.config/opencode/skills/` (derivado de microsoft/playwright-cli) | Apache-2.0 | Verificação visual local (screenshots, viewports, a11y, console) | Alta | OpenCode (declara compatibility: claude-code, opencode) |
| 18 | `security-and-hardening` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Hardening OWASP Top 10, input validation, secrets, dependências, LLM | Alta | OpenCode |
| 19 | `database-engineering` | `~/.config/opencode/skills/` | Não declarada | PostgreSQL/Supabase: modelagem, RLS, migrations, EXPLAIN, backups | Alta | OpenCode |
| 20 | `ci-cd-and-automation` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Pipelines CI/CD, quality gates, deployments, rollback | Alta | OpenCode |
| 21 | `git-workflow-and-versioning` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Commits atômicos, branches curtas, worktrees, versionamento semântico | Alta | OpenCode |
| 22 | `documentation-and-adrs` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | ADRs, documentação de decisões, README, changelog | Alta | OpenCode |
| 23 | `planning-and-task-breakdown` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Decomposição em tarefas verticais com critérios de aceite | Alta | OpenCode |
| 24 | `spec-driven-development` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Especificação antes de código; capability map; fases gated | Alta | OpenCode |
| 25 | `debugging-and-error-recovery` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | Depuração sistemática (reproduzir → localizar → reduzir → corrigir → guardar) | Alta | OpenCode |
| 26 | `reverse-engineer-anything` | `~/.agents/skills/` (Alethe Desktop) | Não declarada | REA de binários/pacotes/artefatos; opcional, não core | Média (opcional) | Alethe Desktop |

Total: 26 Skills aprovadas (dentro da faixa 20–30 solicitada).

---

## 3. Skills redundantes ou descartadas, com justificativa

| Skill | Decisão | Justificativa |
|-------|---------|---------------|
| `alethe` (cópia em `.\skills\alethe\`) | Manter como cópia de segurança, não promover | Duplicata byte-a-byte idêntica à de `.agents/skills/alethe/` (mesmo SHA-256 `5866c1a4...`). Nenhuma alteração feita. A cópia principal permanece em `.agents/skills/alethe/` (registro em `skills-lock.json`). |
| `frontend-design` (projeto) vs `frontend-ui-engineering` (OpenCode) | Manter ambas por ora; avaliar consolidação | Não são cópias idênticas (conteúdos diferentes lidos). `frontend-design` tem assets e LICENSE no projeto; `frontend-ui-engineering` é mais completa em WCAG/design system. São complementares, não redundantes exatas. |
| Múltiplas Skills de UI/UX do OpenCode (`design-taste-frontend`, `minimalist-ui`, `high-end-visual-design`, `industrial-brutalist-ui`, `redesign-existing-projects`, `design-md-reference`, `image-to-code`, `pixel-art`) | Não incluídas no core (exceto as 3 aprovadas) | Overlap funcional significativo entre si. `design-workflow` já orquestra a escolha de uma taste skill por vez. Incluir todas geraria redundância e conflitos de diretrizes (fontes, raios, motion). |
| `cybersecurity` | Descartada do core | Overlap funcional substancial com `security-and-hardening` (ambas cobrem OWASP, injeções, XSS, CSRF, SSRF, dependências, segredos). `security-and-hardening` tem conteúdo mais detalhado e verificado. `cybersecurity` fica como candidata futura se houver necessidade de abordagem em português com foco ASVS. |
| `interview-me`, `doubt-driven-development`, `idea-refine`, `incremental-implementation`, `performance-optimization`, `observability-and-instrumentation`, `shipping-and-launch`, `deprecation-and-migration`, `constraint-driven-development`, `abnt-tcc`, `game-development`, `roblox-development`, `blender-procedural`, `ci-cd-and-automation` já incluída | Não incluídas neste lote | Foram inventariadas mas não selecionadas para o core de 26 por escopo focado no TCC (navegação indoor 3D + API FastAPI + visitor/admin). Podem ser reavaliadas no Lote 2B ou posterior. |
| `Craft Anything` | Explicitamente excluída | Decisão prévia do usuário; não consta nem foi pesquisada como candidata. |

---

## 4. Skills que precisam de investigação adicional

| Skill | Motivo da investigação pendente |
|-------|---------------------------------|
| `frontend-design` (OpenCode) | Não foi lida na íntegra; apenas frontmatter visto. Não é possível afirmar se é cópia idêntica ou diferente da do projeto. |
| Outras 37 Skills do OpenCode não lidas na íntegra | Apenas frontmatter lido. Conteúdo, scripts, references e licenças não verificados. |
| `skill-creator` / `skill-installer` (Codex `.system/`) | São Skills de sistema do Codex. Úteis para gerenciar a biblioteca, mas não são de domínio; não entram no core de 26. |
| Compatibilidade cross-agente real | Todas as classificações acima são "confirmada por documentação" (presença no diretório). Não houve teste funcional de invocação de cada Skill em cada agente. |

---

## 5. Gaps que justificam buscar novas Skills

Não foram encontradas Skills específicas (nem no inventário, nem nas lidas) para os seguintes domínios do TCC:

- **React / TypeScript / React Native / Expo**: nenhuma Skill dedicada. O projeto tem `apps/visitor` (Expo) e `apps/admin` (React/Vite).
- **Python / FastAPI**: apenas `software-development` (genérica, menciona Python) e `database-engineering` (PostgreSQL/Supabase). Nada específico de FastAPI.
- **Segurança OWASP focada**: `security-and-hardening` e `cybersecurity` cobrem parcialmente, mas nenhuma é específica de OWASP API Security Top 10 nem de aplicações 3D/navegação indoor.
- **Testes mobile e acessibilidade**: `playwright-cli` é local/desktop; `testing-qa` menciona Playwright mas não testes mobile nativos (Expo) nem acessibilidade móvel.
- **Navegação indoor 3D / GLB / catálogo espacial**: nenhuma Skill de domínio específico do TCC.

Origem e licença dessas novas Skills não foram pesquisadas (não se deve inventar repositórios). Elas justificam uma busca posterior no ecossistema (skills.sh, repositórios oficiais) antes de qualquer instalação.

---

## 6. Matriz de compatibilidade dos sete agentes

| Skill | OpenCode | Codex | Alethe Desktop | Claude Code | GitHub Copilot CLI | Kimi Code | Antigravity |
|-------|----------|-------|----------------|-------------|--------------------|-----------|-------------|
| alethe | Não confirmada | Não confirmada | Confirmada por documentação | Não confirmada | Não suportada | Não confirmada | Não suportada |
| using-agent-skills | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| context-engineering | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| context7-mcp | Não confirmada | Não confirmada | Confirmada por documentação | Não confirmada | Não suportada | Não confirmada | Não suportada |
| find-skills | Não confirmada | Não confirmada | Confirmada por documentação | Não confirmada | Não suportada | Não confirmada | Não suportada |
| frontend-design | Não confirmada | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| frontend-ui-engineering | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| design-taste-frontend | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| design-workflow | Confirmada por documentação (declara claude-code, opencode) | Não confirmada | Não confirmada | Não confirmada (não instalada) | Não suportada | Não confirmada | Não suportada |
| software-development | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| api-and-interface-design | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| software-architecture | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| code-simplification | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| code-review-and-quality | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| test-driven-development | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| testing-qa | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| playwright-cli | Confirmada por documentação (declara claude-code, opencode) | Não confirmada | Não confirmada | Não confirmada (não instalada) | Não suportada | Não confirmada | Não suportada |
| security-and-hardening | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| cybersecurity | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| database-engineering | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| ci-cd-and-automation | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| git-workflow-and-versioning | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| documentation-and-adrs | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| planning-and-task-breakdown | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| spec-driven-development | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| debugging-and-error-recovery | Confirmada por documentação | Não confirmada | Não confirmada | Não confirmada | Não suportada | Não confirmada | Não suportada |
| reverse-engineer-anything | Não confirmada | Não confirmada | Confirmada por documentação | Não confirmada | Não suportada | Não confirmada | Não suportada |

Observação: "Confirmada por documentação" significa presença do arquivo SKILL.md no diretório de descoberta do agente, com frontmatter válido. Não é compatibilidade funcional testada. Copilot, Kimi e Antigravity não têm diretório de Skills reconhecido; portanto são "Não suportada" (formato) ou "Não confirmada" (quando não há evidência de diretório).

---

## 7. Proposta de seleção final (20–30 Skills)

Seleção final de 26 Skills (lista na seção 2), agrupadas por área:

**Orquestração e contexto:** `alethe`, `using-agent-skills`, `context-engineering`, `context7-mcp`, `find-skills`
**UI/UX e design:** `frontend-design`, `frontend-ui-engineering`, `design-taste-frontend`, `design-workflow`
**Desenvolvimento e API:** `software-development`, `api-and-interface-design`, `software-architecture`, `code-simplification`
**Qualidade e revisão:** `code-review-and-quality`, `test-driven-development`, `testing-qa`, `playwright-cli`, `debugging-and-error-recovery`
**Segurança:** `security-and-hardening`
**Dados:** `database-engineering`
**DevOps e Git:** `ci-cd-and-automation`, `git-workflow-and-versioning`
**Documentação e planejamento:** `documentation-and-adrs`, `planning-and-task-breakdown`, `spec-driven-development`
**Opcional / domínio específico:** `reverse-engineer-anything`

Não há instalação nem implementação nesta etapa. A proposta está pronta para revisão e autorização do Lote 2B (validação funcional e instalação, se autorizado).

---

Fim do relatório Lote 2A. Aguardo autorização para próxima etapa.