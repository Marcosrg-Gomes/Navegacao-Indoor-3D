# Relatório Lote 1 — Parte 2: Duplicações e Catálogo Priorizado

> Modo: somente leitura. Nenhuma Skill foi instalada, atualizada, removida, copiada ou movida.
> Nenhuma configuração, MCP, variável de ambiente ou arquivo do TCC foi alterado.
> Nenhuma operação Git foi executada.

---

## 1. Duplicações

### 1.1 `alethe` — duplicata exata (idem/idem)

| Local | Caminho | Conteúdo | SHA-256 do SKILL.md | Recursos |
|---|---|---|---|---|
| Projeto (`.agents/skills/`) | `.\.agents\skills\alethe\SKILL.md` | idêntico | `5866c1a4af0ad4b71e50cfb9867c763b3752e04c09baacf3f6eb99f1772b0b7e` | assets/, references/, schemas/, scripts/, playbooks.yaml, prices.json |
| Projeto (`skills/`) | `.\skills\alethe\SKILL.md` | idêntico | `5866c1a4af0ad4b71e50cfb9867c763b3752e04c09baacf3f6eb99f1772b0b7e` | assets/, references/, schemas/, scripts/, playbooks.yaml, prices.json |

**Conclusão:** são cópias byte-a-byte idênticas. Não há diferença de SKILL.md, instruções, scripts, referências ou licença.
**Candidata a versão principal:** `.\.agents\skills\alethe\` (localizada no diretório de descoberta do Alethe Desktop dentro do projeto; é o registro autoritativo em `skills-lock.json`). A cópia em `.\skills\alethe\` é redundante e deve ser mantida como está, sem alteração, até decisão explícita do usuário.

### 1.2 `frontend-design` (projeto) vs `frontend-design` / `frontend-ui-engineering` (OpenCode)

| Item | Projeto `.agents/skills/frontend-design/` | OpenCode `~/.config/opencode/skills/frontend-design/` | OpenCode `~/.config/opencode/skills/frontend-ui-engineering/` |
|---|---|---|---|
| SKILL.md | Sim (49 linhas) | Não verificado (presumido existir; não lido nesta inspeção) | Sim (licença Apache-2.0, compatibilidade: claude-code, opencode) |
| Licença | MIT (Vipul Gupta, 2026) | Não verificada | Apache-2.0 (derivado de microsoft/playwright-cli) — *apenas playwright-cli tem licença declarada* |
| Recursos extras | assets/, references/, LICENSE | Não verificado | Não verificado |

**Classificação:** nomes semelhantes, mas não é possível afirmar se são cópias idênticas nem diferentes, pois as versões OpenCode não foram lidas na íntegra (apenas frontmatter). Tratá-las como **potenciais duplicatas funcionais**, não como cópias confirmadas.

### 1.3 Overlaps funcionais (não são cópias idênticas, mas cobrem áreas semelhantes)

- `software-development` (OpenCode) e `software-architecture` (OpenCode): escopos distintos (geral vs arquitetura).
- `test-driven-development` (OpenCode) e `testing-qa` (OpenCode): escopos distintos (TDD vs QA abrangente).
- `code-review-and-quality` (OpenCode) e `security-and-hardening` (OpenCode): escopos distintos (revisão vs segurança).
- `context-engineering` (OpenCode) e `context7-mcp` (Alethe Desktop): escopos distintos (otimização de contexto vs documentação de bibliotecas).
- `skill-creator` (Codex, `.system/`) e `skill-installer` (Codex, `.system/`): criações distintas (criar vs instalar).
- `design-taste-frontend`, `design-workflow`, `design-md-reference`, `minimalist-ui`, `industrial-brutalist-ui`, `high-end-visual-design`, `frontend-design`, `frontend-ui-engineering` (OpenCode): múltiplas Skills de design com possíveis sobreposições; requerem análise detalhada antes de consolidar.

### 1.4 Cópias com nomes iguais mas conteúdos diferentes

Não foram identificadas cópias com nomes iguais e conteúdos diferentes. A única duplicata confirmada é `alethe` (conteúdo idêntico).

---

## 2. Catálogo Priorizado de Skills (25–35 candidatas)

> Repositórios e licenças são informados apenas quando verificáveis na inspeção. O restante é marcado como "não verificado" — não é hipotético, é simplesmente não confirmado por leitura direta.

### 2.1 Orquestração multiagente e engenharia de contexto

| # | Nome | Origem / repositório | Licença | Compatibilidade | Dependências | Equivalente existente | Prioridade | Recomendação |
|---|---|---|---|---|---|---|---|---|
| 1 | `alethe` | `Kc1t/alethe-orchestrate-skill` (skills-lock.json) | Não declarada | Confirmada (projeto) | Python ≥ 3.9 opcional, scripts/orchestrate.py | Já existe (2 cópias idênticas) | Alta | Manter |
| 2 | `using-agent-skills` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 3 | `context-engineering` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 4 | `context7-mcp` | `~/.agents/skills/` (Alethe Desktop) | Não declarada | Alethe Desktop (confirmada) | Context7 MCP | Não existe fora do Alethe | Alta | Aproveitar |
| 5 | `reverse-engineer-anything` | `~/.agents/skills/` (Alethe Desktop) | Não declarada | Alethe Desktop (confirmada) | REA MCP / npx -y rea-agents@6.4.0 | Não existe fora do Alethe | Média | Manter como opcional |
| 6 | `find-skills` | `~/.agents/skills/` (Alethe Desktop, vercel-labs/skills) | Não declarada | Alethe Desktop (confirmada) | npx skills | Não existe fora do Alethe | Média | Aproveitar |
| 7 | `interview-me` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Média | Avaliar |
| 8 | `doubt-driven-development` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Média | Avaliar |

### 2.2 Frontend, UI/UX e design

| # | Nome | Origem / repositório | Licença | Compatibilidade | Dependências | Equivalente existente | Prioridade | Recomendação |
|---|---|---|---|---|---|---|---|---|
| 9 | `frontend-design` | `.\.agents\skills\frontend-design\` (projeto) | MIT (Vipul Gupta, 2026) | Projeto (confirmada) | Nenhuma declarada | Não existe fora do projeto | Alta | Manter |
| 10 | `frontend-ui-engineering` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | OpenCode (confirmada) | Nenhuma declarada | `frontend-design` (projeto) | Alta | Avaliar (possível overlap) |
| 11 | `design-taste-frontend` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Média | Avaliar |
| 12 | `minimalist-ui` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Média | Avaliar |
| 13 | `high-end-visual-design` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Média | Avaliar |
| 14 | `industrial-brutalist-ui` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Baixa | Não incluir (overlap com outras de design) |
| 15 | `design-workflow` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Média | Avaliar |
| 16 | `design-md-reference` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Baixa | Não incluir |

### 2.3 React, TypeScript, React Native e Expo

| # | Nome | Origem / repositório | Licença | Compatibilidade | Dependências | Equivalente existente | Prioridade | Recomendação |
|---|---|---|---|---|---|---|---|---|
| 17 | `api-and-interface-design` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 18 | `software-development` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |

*(Nota: não foram encontradas Skills específicas de React/TypeScript/React Native/Expo na inspeção. São gaps.)*

### 2.4 Backend, Python, FastAPI e APIs

| # | Nome | Origem / repositório | Licença | Compatibilidade | Dependências | Equivalente existente | Prioridade | Recomendação |
|---|---|---|---|---|---|---|---|---|
| 19 | `software-development` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 20 | `database-engineering` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |

### 2.5 Arquitetura de software e refatoração

| # | Nome | Origem / repositório | Licença | Compatibilidade | Dependências | Equivalente existente | Prioridade | Recomendação |
|---|---|---|---|---|---|---|---|---|
| 21 | `software-architecture` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 22 | `code-simplification` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Média | Aproveitar |
| 23 | `code-review-and-quality` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |

### 2.6 QA, testes, TDD e Playwright

| # | Nome | Origem / repositório | Licença | Compatibilidade | Dependências | Equivalente existente | Prioridade | Recomendação |
|---|---|---|---|---|---|---|---|---|
| 24 | `test-driven-development` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 25 | `testing-qa` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 26 | `playwright-cli` | `~/.config/opencode/skills/` (derivado de microsoft/playwright-cli) | Apache-2.0 | OpenCode (confirmada: claude-code, opencode) | playwright-cli | Não existe fora do OpenCode | Alta | Aproveitar |

### 2.7 Segurança e análise de vulnerabilidades

| # | Nome | Origem / repositório | Licença | Compatibilidade | Dependências | Equivalente existente | Prioridade | Recomendação |
|---|---|---|---|---|---|---|---|---|
| 27 | `security-and-hardening` | `~/.config/opencode/skills/` (adaptado de addyosmani/agent-skills) | MIT (adaptado) | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 28 | `cybersecurity` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Média | Avaliar (overlap com security-and-hardening) |

### 2.8 Banco de dados e SQL

| # | Nome | Origem / repositório | Licença | Compatibilidade | Dependências | Equivalente existente | Prioridade | Recomendação |
|---|---|---|---|---|---|---|---|---|
| 29 | `database-engineering` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |

### 2.9 DevOps, Git, CI/CD e observabilidade

| # | Nome | Origem / repositório | Licença | Compatibilidade | Dependências | Equivalente existente | Prioridade | Recomendação |
|---|---|---|---|---|---|---|---|---|
| 30 | `ci-cd-and-automation` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 31 | `git-workflow-and-versioning` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 32 | `observability-and-instrumentation` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Média | Aproveitar |
| 33 | `deprecation-and-migration` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Média | Avaliar |

### 2.10 Documentação, requisitos e planejamento

| # | Nome | Origem / repositório | Licença | Compatibilidade | Dependências | Equivalente existente | Prioridade | Recomendação |
|---|---|---|---|---|---|---|---|---|
| 34 | `abnt-tcc` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar (contexto TCC) |
| 35 | `documentation-and-adrs` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 36 | `planning-and-task-breakdown` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 37 | `spec-driven-development` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |
| 38 | `debugging-and-error-recovery` | `~/.config/opencode/skills/` | Não declarada | OpenCode (confirmada) | Nenhuma declarada | Não existe fora do OpenCode | Alta | Aproveitar |

### 2.11 Skill de sistema do Codex (referência, não candidata principal)

- `skill-creator` (`~/.codex/skills/.system/skill-creator/`): cria/atualiza Skills do Codex. Licença não declarada. Compatibilidade: Codex (confirmada). É uma Skill de sistema, não de domínio.
- `skill-installer` (`~/.codex/skills/.system/skill-installer/`): instala Skills do Codex de `openai/skills`. Licença não declarada. Compatibilidade: Codex (confirmada). É uma Skill de sistema, não de domínio.

---

## 3. Critérios aplicados

- Qualidade, manutenção, segurança e utilidade prática foram priorizadas.
- Skills redundantes que fazem essencialmente a mesma coisa foram sinalizadas para avaliação (ex: múltiplas de UI/UX, `cybersecurity` vs `security-and-hardening`).
- Não foram inventados repositórios, licenças ou compatibilidades.
- Fatos verificados (SHA-256, frontmatter lidos, licenças declaradas) são distinguidos de hipóteses (áreas não lidas na íntegra).
- A Skill `alethe` e suas duas cópias idênticas foram preservadas.
- `reverse-engineer-anything` foi mantida como candidata opcional.
- **Craft Anything** não foi incluída, conforme decisão explícita.

---

## 4. Conclusão

### 4.1 Skills que realmente faltam (gaps identificados)

- Nenhuma Skill específica de **React / TypeScript / React Native / Expo** foi encontrada em nenhum agente inspecionado.
- Nenhuma Skill específica de **FastAPI / Python backend** além da genérica `software-development`.
- Nenhuma Skill de **mobile nativo** (além da ausência de React Native).
- Nenhuma Skill de **banco de dados específica** além da genérica `database-engineering`.
- Nenhuma Skill de **segurança de aplicação / OWASP** específica além de `security-and-hardening` e `cybersecurity`.

### 4.2 Skills que já temos e devemos aproveitar

- `alethe` (2 cópias idênticas, preservar a principal em `.agents/skills/alethe/`).
- `frontend-design` (projeto, MIT, com assets e references).
- Todas as 43 Skills do OpenCode em `~/.config/opencode/skills/` (candidatas diretas para a biblioteca compartilhada).
- `find-skills`, `context7-mcp`, `reverse-engineer-anything` do Alethe Desktop.
- `skill-creator` e `skill-installer` do Codex (sistema, para gerenciar a biblioteca).

### 4.3 Skills redundantes

- Duplicata exata de `alethe` (2 cópias idênticas no projeto).
- Potenciais overlaps funcionais entre várias Skills de design UI/UX no OpenCode (`frontend-design`, `frontend-ui-engineering`, `design-taste-frontend`, `minimalist-ui`, `high-end-visual-design`, `industrial-brutalist-ui`, `design-workflow`, `design-md-reference`).
- `cybersecurity` vs `security-and-hardening` (overlap de escopo).
- `test-driven-development` vs `testing-qa` (complementares, não redundantes; manter ambas).

### 4.4 Proposta de biblioteca compartilhada (não implementada)

**Diretório central proposto:** fora do repositório TCC, em local de uso dos agentes (ex: `~/.agents/skills/` do Alethe Desktop ou `~/.config/opencode/skills/` do OpenCode), sem tocar no projeto `Navegacao-Indoor-3D`.

**Estrutura sugerida por área:**

```
shared-skills/
├── orchestracao/          alethe, using-agent-skills, context-engineering, context7-mcp, find-skills, reverse-engineer-anything
├── design/                frontend-design, frontend-ui-engineering, design-taste-frontend, minimalist-ui
├── frontend/              api-and-interface-design, software-development
├── backend/               software-development, database-engineering
├── arquitetura/           software-architecture, code-simplification, code-review-and-quality
├── qa/                    test-driven-development, testing-qa, playwright-cli
├── seguranca/             security-and-hardening, cybersecurity
├── devops/                ci-cd-and-automation, git-workflow-and-versioning, observability-and-instrumentation, deprecation-and-migration
├── documento/             abnt-tcc, documentation-and-adrs, planning-and-task-breakdown, spec-driven-development, debugging-and-error-recovery
└── sistema/               skill-creator, skill-installer (Codex)
```

**Próximos passos (Lote 2, sujeito a autorização):**
1. Validar compatibilidade cross-agente de cada candidata (testar SKILL.md em cada agente).
2. Resolver overlaps de design e segurança antes de consolidar.
3. Definir política de versionamento e lock da biblioteca compartilhada.
4. Instalar apenas após autorização explícita.

---

Fim da Parte 2. Aguardo autorização para a próxima etapa.