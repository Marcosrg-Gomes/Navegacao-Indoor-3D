# Relatório Lote 2C — Especificação da Biblioteca Central de Agent Skills

> Modo obrigatório: somente leitura e planejamento.
> Não criar diretórios. Não criar, editar ou excluir arquivos (exceste este relatório autorizado).
> Não copiar, mover, instalar ou remover Skills.
> Não alterar configurações de agentes, MCPs ou ferramentas.
> Não executar scripts das Skills.
> Não modificar o projeto TCC.
> Não executar comandos Git de alteração, commit ou push.
> Não instalar dependências.
> Não iniciar sincronização ou integração entre agentes.
> Não modificar as duas cópias existentes de `alethe`.
> Craft Anything permanece expressamente excluído.

Base: `RELATORIO_LOTE1_PARTE2.md`, `RELATORIO_LOTE2A_VALIDACAO.md`, `RELATORIO_LOTE2B_ARQUITETURA.md`.

---

## 1. Resumo executivo

Este relatório especifica tecnicamente a futura biblioteca central compartilhada de Agent Skills, a ser implantada fora do repositório do TCC. A especificação cobre: estrutura de domínios e coleções, localização central, esquema do catálogo (`catalog.yaml`), esquema de controle de versões (`versions.lock`), matriz de compatibilidade dos sete agentes, política de segurança, critérios de validação e plano dos próximos lotes (2D e 2E). Nenhuma implementação foi executada. Nenhuma Skill foi instalada, copiada, movida ou modificada. As duas cópias de `alethe` permanecem preservadas.

---

## 2. Estrutura definitiva de domínios e coleções

### 2.1 Classificação adotada

São **sete domínios funcionais** e **duas coleções especiais**. `orchestrator` é uma coleção especial, não um domínio funcional.

**Sete domínios funcionais:**
1. `design`
2. `development`
3. `quality`
4. `security`
5. `data`
6. `devops`
7. `docs`

**Duas coleções especiais:**
1. `orchestrator` — orquestração e contexto
2. `optional` — domínio específico/opcional

### 2.2 Mapeamento das 26 Skills aprovadas

| Agrupamento | Nome do agrupamento | Skills |
|-------------|---------------------|--------|
| Coleção especial | `orchestrator` | alethe, using-agent-skills, context-engineering, context7-mcp, find-skills |
| Domínio funcional | `design` | frontend-design, frontend-ui-engineering, design-taste-frontend, design-workflow |
| Domínio funcional | `development` | software-development, api-and-interface-design, software-architecture, code-simplification |
| Domínio funcional | `quality` | code-review-and-quality, test-driven-development, testing-qa, playwright-cli, debugging-and-error-recovery |
| Domínio funcional | `security` | security-and-hardening |
| Domínio funcional | `data` | database-engineering |
| Domínio funcional | `devops` | ci-cd-and-automation, git-workflow-and-versioning |
| Domínio funcional | `docs` | documentation-and-adrs, planning-and-task-breakdown, spec-driven-development |
| Coleção especial | `optional` | reverse-engineer-anything |

Total: 9 agrupamentos (7 domínios funcionais + 2 coleções especiais), 26 Skills, cada uma em exatamente um agrupamento. Não há Skill duplicada entre agrupamentos.

---

## 3. Recomendação de localização central

### 3.1 Opções comparadas

| Opção | Caminho | Vantagens | Desvantagens |
|-------|---------|-----------|--------------|
| A | `%USERPROFILE%\.agent-skills\shared\` | Pasta oculta (padrão Windows), fora de OneDrive por padrão, nome explícito de Skills | Não existe; requer criação; não é padrão de nenhum agente |
| B | `%LOCALAPPDATA%\AgentSkills\` | Pasta de dados de aplicativo local (não sincronizada por OneDrive), permissões típicas de usuário | Não existe; requer criação; nome genérico |
| C | `%USERPROFILE%\.local\share\agent-skills\` | Padrão XDG-like, separado de configurações de agentes | Não é padrão nativo do Windows; requer criação; menos familiar para usuários Windows |

### 3.2 Recomendação principal e alternativa

**Principal:** Opção A — `%USERPROFILE%\.agent-skills\shared\`
- Por ser uma pasta oculta no perfil do usuário, fora da sincronização do OneDrive (que sincroniza `OneDrive\Documentos\` onde está o TCC), reduz risco de alterações acidentais no TCC.
- Nome explícito (`agent-skills`) facilita identificação e backup.

**Alternativa:** Opção B — `%LOCALAPPDATA%\AgentSkills\`
- Pasta de dados local padrão do Windows, não roaming, não sincronizada por OneDrive por padrão.

**Decisão do usuário:** A escolha final do caminho permanece sob responsabilidade do usuário. Este relatório apenas recomenda.

**Regras:**
- A biblioteca fica fora do repositório `C:\Users\marco\OneDrive\Documentos\ChatGPT\Navegacao-Indoor-3D`.
- As duas cópias de `alethe` no TCC (`.agents/skills/alethe/` e `skills/alethe/`) permanecem inalteradas; não são movidas nem copiadas para a central.

---

## 4. Árvore de diretórios proposta (especificação, não implementação)

```
%USERPROFILE%\.agent-skills\shared\               (caminho recomendado, a definir pelo usuário)
├── catalog.yaml                                   # Índice único de todas as Skills
├── versions.lock                                  # Trava de versões aprovadas
├── SECURITY.md                                    # Política de segurança da biblioteca
├── README.md                                      # Documentação de uso da biblioteca central
├── orchestrator/                                  # Coleção especial: orquestração e contexto
│   ├── alethe/                                    # DESTINO PLANEJADO, NAO MATERIALIZADO (referencia-externa-pendente)
│   │   ├── SKILL.md
│   │   ├── assets/
│   │   ├── references/
│   │   ├── schemas/
│   │   ├── scripts/
│   │   ├── playbooks.yaml
│   │   └── prices.json
│   ├── using-agent-skills/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── context-engineering/
│   │   └── SKILL.md
│   ├── context7-mcp/
│   │   └── SKILL.md
│   └── find-skills/
│       └── SKILL.md
├── design/
│   ├── frontend-design/
│   │   ├── SKILL.md
│   │   ├── assets/
│   │   ├── references/
│   │   └── LICENSE
│   ├── frontend-ui-engineering/
│   │   └── SKILL.md
│   ├── design-taste-frontend/
│   │   └── SKILL.md
│   └── design-workflow/
│       └── SKILL.md
├── development/
│   ├── software-development/
│   │   └── SKILL.md
│   ├── api-and-interface-design/
│   │   └── SKILL.md
│   ├── software-architecture/
│   │   └── SKILL.md
│   └── code-simplification/
│       └── SKILL.md
├── quality/
│   ├── code-review-and-quality/
│   │   └── SKILL.md
│   ├── test-driven-development/
│   │   └── SKILL.md
│   ├── testing-qa/
│   │   └── SKILL.md
│   ├── playwright-cli/
│   │   └── SKILL.md
│   └── debugging-and-error-recovery/
│       └── SKILL.md
├── security/
│   └── security-and-hardening/
│       └── SKILL.md
├── data/
│   └── database-engineering/
│       └── SKILL.md
├── devops/
│   ├── ci-cd-and-automation/
│   │   └── SKILL.md
│   └── git-workflow-and-versioning/
│       └── SKILL.md
├── docs/
│   ├── documentation-and-adrs/
│   │   └── SKILL.md
│   ├── planning-and-task-breakdown/
│   │   └── SKILL.md
│   └── spec-driven-development/
│       └── SKILL.md
└── optional/
    └── reverse-engineer-anything/
        ├── SKILL.md
        └── references/
```

> Esta árvore é uma especificação. Nenhum diretório será criado nesta tarefa.

---

## 5. Esquema do catálogo (`catalog.yaml`)

O arquivo `catalog.yaml` é o índice único da biblioteca. Cada Skill aparece exatamente uma vez. Não há duplicação de Skill para categorização múltipla.

### 5.1 Formato geral

```yaml
catalogVersion: 1
generatedAt: "YYYY-MM-DDTHH:MM:SSZ"   # data/hora da última geração do catálogo (exemplo)
skills:
  - id: alethe
    name: alethe
    domain: orchestrator
    description: >
      Orchestrate bounded Codex, Claude Code, Agy, Kimi, or custom CLI workers
      to finish work with the least lead context and provider usage.
    source: Kc1t/alethe-orchestrate-skill
    sourceUrl: "https://github.com/Kc1t/alethe-orchestrate-skill"  # string YAML, nao link Markdown
    sourceType: github                       # github | local | outro
    author: nao declarada                    # autor/organização, quando verificável
    license: nao declarada                   # MIT | Apache-2.0 | nao declarada
    version: "24"                            # conforme frontmatter do SKILL.md ou skills-lock.json
    sha256: "5866c1a4af0ad4b71e50cfb9867c763b3752e04c09baacf3f6eb99f1772b0b7e"  # hash verificado nas duas copias do TCC
    relativePath: orchestrator/alethe/       # destino planejado, nao materializado (referencia-externa-pendente)
    agents:
      - agent: opencode
        compatibility: confirmado
        evidence: diretorio ~/.config/opencode/skills/ lido; SKILL.md valido
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: codex
        compatibility: confirmado
        evidence: diretorio ~/.codex/skills/ lido; SKILL.md valido
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: alethe-desktop
        compatibility: confirmado
        evidence: diretorio ~/.agents/skills/ lido; SKILL.md valido
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: claude-code
        compatibility: nao-confirmado
        evidence: ~/.claude/skills/ vazio
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: github-copilot-cli
        compatibility: nao-suportado-nativamente
        evidence: usa installed-plugins, nao diretorio de Skills identificado
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: kimi-code
        compatibility: nao-confirmado
        evidence: nao ha diretorio skills/
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: antigravity
        compatibility: nao-suportado-nativamente
        evidence: extensoes VS Code, nao diretorio de Skills identificado
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
    dependencies:
      - python>=3.9 opcional
      - scripts/orchestrate.py
    scriptsAndResources:
      - assets/
      - references/
      - schemas/
      - scripts/
      - playbooks.yaml
      - prices.json
    risks:
      - execucao de workers CLI
      - acesso a worktrees
    lastReviewed: "YYYY-MM-DD"               # exemplo: data da ultima revisao
    notes: >
      Skill alethe mantida como referencia-externa-pendente.
      Duas copias identicas preservadas no TCC (.agents/skills/alethe/ e skills/alethe/), inalteradas.
      Nao copiar para central. Nao presumir autorizacao para incorporacao fisica.
      Eventual inclusao física depende de decisão e autorização posterior do usuário.
      Craft Anything excluído.
```

### 5.2 Regras de preenchimento

- **id:** identificador único, igual ao nome da pasta da Skill.
- **name:** nome da Skill, conforme frontmatter `name` do `SKILL.md`.
- **domain:** um dos 7 domínios funcionais ou 2 coleções especiais da seção 2.1. Uma Skill pertence a exatamente um agrupamento.
- **description:** resumo da finalidade, conforme frontmatter `description` ou leitura do corpo do `SKILL.md`.
- **source / sourceUrl / sourceType:** apenas quando verificáveis por leitura direta (ex: `skills-lock.json`, comentário de cabeçalho, `UPSTREAM.md`). Caso contrário: `nao declarada`. URLs devem ser strings YAML válidas (com aspas quando necessário), nunca links Markdown dentro do valor.
- **author:** autor/organização apenas quando verificável. Caso contrário: `nao declarada`.
- **license:** apenas quando lida diretamente (ex: MIT, Apache-2.0). Caso contrário: `nao declarada`.
- **version:** do campo `metadata.version` do frontmatter ou do `skills-lock.json`.
- **sha256:** hash SHA-256 do conteúdo da Skill, calculado por leitura direta. Exemplo conhecido: `alethe` = `5866c1a4af0ad4b71e50cfb9867c763b3752e04c09baacf3f6eb99f1772b0b7e` (ambas cópias do TCC). Para as demais: `nao verificado`.
- **relativePath:** caminho relativo dentro da biblioteca central (ex: `orchestrator/alethe/`). Para `alethe`, este caminho é destino planejado, não materializado.
- **agents.compatibilidade:** `confirmado` | `nao-confirmado` | `nao-testado` | `nao-suportado-nativamente`. Nunca inventar compatibilidade funcional sem evidência.
- **agents.leituraExterna:** `confirmado` | `nao-confirmado` | `nao-testado`. Indica se o agente consegue ler arquivos externos da biblioteca central.
- **agents.utilizacaoFuncional:** `confirmado` | `nao-confirmado` | `nao-testado`. Indica se o agente consegue utilizar a Skill em uma tarefa real.
- **agents.evidence:** descrição curta da evidência de leitura direta.
- **dependencies:** apenas dependências declaradas ou verificáveis por leitura (ex: `python>=3.9`, `playwright-cli`, `npx skills`). Nunca inventar.
- **scriptsAndResources:** listas de pastas/arquivos verificados na Skill (ex: `assets/`, `references/`, `scripts/`).
- **risks:** riscos identificados na leitura (ex: execução de workers CLI, acesso a worktrees, downloads de rede).
- **lastReviewed:** data da última revisão do catálogo para aquela Skill.
- **notes:** observações livres, sem inventar fatos.

### 5.3 Exemplo ilustrativo para `frontend-design` (projeto)

```yaml
  - id: frontend-design
    name: frontend-design
    domain: design
    description: >
      Create distinctive, production-grade frontend interfaces with high design quality.
    source: nao declarada
    sourceUrl: nao declarada
    sourceType: local
    author: Vipul Gupta (conforme LICENSE)
    license: MIT
    version: nao declarada
    sha256: nao verificado
    relativePath: design/frontend-design/
    agents:
      - agent: opencode
        compatibility: nao-confirmado
        evidence: SKILL.md lido no projeto, nao em ~/.config/opencode/skills/
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: codex
        compatibility: nao-confirmado
        evidence: SKILL.md lido no projeto, nao em ~/.codex/skills/
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: alethe-desktop
        compatibility: confirmado
        evidence: diretorio .agents/skills/frontend-design/ lido no TCC
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: claude-code
        compatibility: nao-confirmado
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: github-copilot-cli
        compatibility: nao-suportado-nativamente
        evidence: usa installed-plugins, nao diretorio de Skills identificado
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: kimi-code
        compatibility: nao-confirmado
        evidence: nao ha diretorio skills/
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
      - agent: antigravity
        compatibility: nao-suportado-nativamente
        evidence: extensoes VS Code, nao diretorio de Skills identificado
        leituraExterna: nao-testado
        utilizacaoFuncional: nao-testado
    dependencies: []
    scriptsAndResources:
      - assets/
      - references/
      - LICENSE
    risks: []
    lastReviewed: "YYYY-MM-DD"
    notes: Licence MIT (Vipul Gupta, 2026) verificada no arquivo LICENSE da Skill no projeto.
```

> Todos os blocos YAML acima são exemplos ilustrativos, não arquivos já criados.

---

## 6. Esquema do controle de versões (`versions.lock`)

O arquivo `versions.lock` é a trava de versões aprovadas da biblioteca central, análogo ao `skills-lock.json` já existente no TCC.

### 6.1 Formato geral

```yaml
lockVersion: 1
updatedAt: "YYYY-MM-DDTHH:MM:SSZ"   # exemplo
skills:
  - id: alethe
    version: "24"
    sha256: "5866c1a4af0ad4b71e50cfb9867c763b3752e04c09baacf3f6eb99f1772b0b7e"
    source: Kc1t/alethe-orchestrate-skill
    sourceRef: nao verificado          # commit ou referencia de origem, quando disponivel
    approvedAt: "YYYY-MM-DD"           # exemplo: data da aprovacao
    approvedBy: usuario                # exemplo: responsavel pela aprovacao
  - id: frontend-design
    version: nao declarada
    sha256: nao verificado
    source: nao declarada
    sourceRef: nao verificado
    approvedAt: "YYYY-MM-DD"
    approvedBy: usuario
```

### 6.2 Campos

| Campo | Descrição |
|-------|-----------|
| `lockVersion` | Versão do esquema do lock (ex: 1). |
| `updatedAt` | Data/hora da última atualização do lock. |
| `skills[].id` | Identificador da Skill (igual ao `id` do catálogo). |
| `skills[].version` | Versão aprovada (frontmatter `metadata.version` ou `skills-lock.json`). |
| `skills[].sha256` | Hash SHA-256 do conteúdo da Skill, para detecção de alterações. |
| `skills[].source` | Origem da Skill (GitHub, local, outro). |
| `skills[].sourceRef` | Commit, tag ou referência de origem, quando disponível por leitura direta. |
| `skills[].approvedAt` | Data de aprovação da versão. |
| `skills[].approvedBy` | Responsável pela aprovação. |

### 6.3 Detecção de alterações inesperadas

- Comparar o `sha256` registrado em `versions.lock` com o hash recalculado dos arquivos reais da Skill na biblioteca central. Divergência indica alteração não aprovada.
- Comparar `version` em `versions.lock` com o `metadata.version` do frontmatter do `SKILL.md`. Divergência indica versão não sincronizada.
- Comparar `relativePath` do catálogo com a estrutura real de pastas. Ausência ou caminho diferente indica Skill movida ou removida sem atualizar o catálogo.

> Este mecanismo é especificado, não implementado. Nenhum arquivo `versions.lock` será criado nesta tarefa.

---

## 7. Matriz de compatibilidade dos sete agentes

### 7.1 Definições

- **Suporte ao formato `SKILL.md`:** o agente lê e interpreta arquivos `SKILL.md` com frontmatter `name`/`description`.
- **Diretório nativo de descoberta:** o agente possui um diretório próprio onde instala Skills (ex: `~/.config/opencode/skills/`).
- **Descoberta automática de caminhos externos:** o agente escaneia ou importa Skills de caminhos externos sem intervenção manual.
- **Leitura manual de arquivos externos:** o agente pode ler um `SKILL.md` em caminho externo se apontado explicitamente.
- **Descoberta da Skill como recurso disponível:** o agente reconhece a Skill como um recurso que pode ser usado.
- **Utilização funcional comprovada:** evidência de que o agente realmente aplica as instruções da Skill em uma tarefa controlada.

### 7.2 Classificações utilizadas

- `confirmado`: evidência direta de leitura do diretório nativo e SKILL.md válido.
- `nao-confirmado`: não há evidência suficiente para afirmar suporte.
- `nao-testado`: não foi testado nesta tarefa (será validado no Lote 2D).
- `nao-suportado-nativamente`: não foi identificado suporte nativo ao padrão de Skills na inspeção realizada. Não significa incapacidade de ler Markdown; significa ausência de evidência de integração nativa.

### 7.3 Matriz por agente

| Agente | Diretório nativo identificado | Suporte SKILL.md | Descoberta externa automática | Leitura manual externa | Descoberta como recurso | Utilização funcional | Classificação geral |
|--------|------------------------------|------------------|-------------------------------|------------------------|-------------------------|----------------------|---------------------|
| OpenCode | `~/.config/opencode/skills/` (43 Skills) | confirmado | nao-testado | nao-testado | nao-testado | nao-testado | confirmado (formato nativo), leitura e uso externos nao-testados |
| Codex | `~/.codex/skills/` (8 + `.system/`) | confirmado | nao-testado | nao-testado | nao-testado | nao-testado | confirmado (formato nativo), leitura e uso externos nao-testados |
| Alethe Desktop | `~/.agents/skills/` (3 Skills) | confirmado | nao-testado | nao-testado | nao-testado | nao-testado | confirmado (formato nativo), leitura e uso externos nao-testados |
| Claude Code | `~/.claude/skills/` (vazio) | nao-confirmado | nao-testado | nao-testado | nao-testado | nao-testado | nao-confirmado |
| GitHub Copilot CLI | `installed-plugins/` (vazio) | nao-confirmado | nao-suportado-nativamente | nao-suportado-nativamente | nao-testado | nao-testado | nao-suportado-nativamente |
| Kimi Code | Nenhum `skills/` | nao-confirmado | nao-testado | nao-testado | nao-testado | nao-testado | nao-confirmado |
| Antigravity / Antigravity IDE | Extensões VS Code | nao-confirmado | nao-suportado-nativamente | nao-suportado-nativamente | nao-testado | nao-testado | nao-suportado-nativamente |

### 7.4 Regras de classificação

- A existência de um diretório nativo **não** é prova de que o agente lê diretamente uma biblioteca externa.
- Para OpenCode, Codex e Alethe Desktop, a leitura direta de caminhos externos permanece como **hipótese a validar no Lote 2D**.
- Para Claude Code e Kimi Code, **não se presume suporte**.
- GitHub Copilot CLI e Antigravity: não foi identificado suporte nativo ao padrão de Skills na inspeção realizada. Não afirmar que são incapazes de ler arquivos Markdown externos. Qualquer adaptador ou integração alternativa fica fora do escopo até que exista evidência e teste.

---

## 8. Política de segurança

### 8.1 Critérios objetivos para aprovação de uma Skill

Antes de incluir qualquer Skill na biblioteca central, deve ser verificado:

1. **Leitura integral do `SKILL.md`:** frontmatter e corpo lidos na íntegra.
2. **Inspeção de scripts e comandos:** pastas `scripts/` lidas; nenhum comando executado nesta etapa.
3. **Verificação de credenciais, tokens e segredos:** ausência confirmada de senhas, chaves, tokens ou arquivos `.env` com valores sensíveis.
4. **Identificação de comandos remotos e downloads:** comandos `curl`, `wget`, `npx`, `npm install`, `git clone` etc. identificados e avaliados.
5. **Identificação de instruções para contornar permissões ou sandboxes:** flags de bypass, desabilitação de sandbox, execução com privilégios elevados, etc.
6. **Verificação de origem e licença:** repositório/URL verificável por leitura direta; licença declarada ou registrada como `não declarada`.
7. **Registro de dependências:** dependências externas listadas no catálogo.
8. **Hash de integridade:** SHA-256 calculado e registrado.
9. **Aprovação humana:** nenhuma Skill é instalada ou executada sem aprovação explícita do usuário.

### 8.2 Princípio de confiança zero

Todo conteúdo de Skills é tratado como **não confiável até ser revisado**. Uma Skill não pode autorizar a si própria a executar comandos ou alterar configurações. A biblioteca central é um catálogo de referência; agentes não ingerem automaticamente seu conteúdo sem ação explícita do usuário.

### 8.3 Regras de execução

- Scripts (`scripts/`) são lidos, não executados nesta etapa.
- Qualquer execução futura requer aprovação explícita do usuário e ambiente isolado.
- Referências (`references/`) e assets (`assets/`) são tratados como dados, não como instruções executáveis.

---

## 9. Critérios de validação

### 9.1 Lote 2D — Validação técnica (futuro, não executado agora)

**Objetivo:** testar, em condições controladas, a capacidade real de cada agente de acessar e interpretar Skills externas, **sem instalar Skills nem sobrescrever diretórios nativos**.

Os testes são separados em quatro níveis independentes. Um agente não é aprovado integralmente apenas por conseguir abrir um arquivo.

#### Nível 1 — Acesso

**Critério:** o agente consegue abrir o arquivo `SKILL.md` externo (caminho fora do diretório nativo do agente).

- **Aprovado:** o agente lê o conteúdo do arquivo sem erro de caminho.
- **Reprovado:** o agente não reconhece o caminho ou não consegue abrir o arquivo.
- **Evidência:** saída do agente mostrando o conteúdo do `SKILL.md` lido.

#### Nível 2 — Interpretação

**Critério:** o agente interpreta corretamente o frontmatter (`name`, `description`, `metadata`) e o corpo do `SKILL.md`.

- **Aprovado:** o agente identifica corretamente o nome e a descrição da Skill.
- **Reprovado:** o agente ignora o frontmatter ou não carrega a Skill corretamente.
- **Evidência:** saída do agente demonstrando uso dos campos do frontmatter.

#### Nível 3 — Descoberta

**Critério:** o agente reconhece a Skill como um recurso disponível para uso.

- **Aprovado:** o agente lista ou referencia a Skill como opção aplicável à tarefa.
- **Reprovado:** o agente não reconhece a Skill como recurso disponível.
- **Evidência:** menção explícita do agente à Skill como recurso aplicável.

#### Nível 4 — Utilização

**Critério:** o agente consegue aplicar corretamente as instruções da Skill em uma tarefa controlada.

- **Aprovado:** o agente executa a tarefa seguindo as instruções da Skill.
- **Reprovado:** o agente não consegue aplicar as instruções ou não segue o fluxo da Skill.
- **Evidência:** resultado da tarefa controlada executada pelo agente.

**Um agente só é considerado totalmente compatível se for aprovado em todos os quatro níveis.**

#### Segurança dos testes

- Utilizar uma Skill de teste descartável, simples e sem scripts.
- Não começar os testes com a Skill `alethe`.
- Não executar comandos externos.
- Não instalar Skills reais.
- Não sobrescrever diretórios nativos.
- Não modificar configurações permanentes.
- Registrar possíveis logs, caches e sessões gerados.
- Não considerar ausência de alterações visíveis como prova de ausência de registros internos.

O Lote 2D continuará dependendo de autorização posterior.

### 9.2 Lote 2E — Implantação controlada (futuro, somente com autorização explícita)

- Backup do estado atual dos diretórios de Skills de OpenCode, Codex e Alethe Desktop.
- Instalação individual de cada Skill, com aprovação explícita por Skill.
- Validação de funcionamento após cada instalação.
- Registro de hashes SHA-256 após instalação.
- Rollback disponível: remover a Skill instalada e restaurar estado anterior.

> Nenhum desses lotes será executado nesta tarefa.

---

## 10. Plano dos Lotes 2D e 2E

| Lote | Objetivo | Execução nesta tarefa? |
|------|----------|------------------------|
| 2D | Validação técnica: testar capacidade real de cada agente de acessar e interpretar Skills externas, sem instalar nem sobrescrever | Não |
| 2E | Implantação controlada: backup, instalação individual, validação, registro de hashes, rollback — somente com autorização explícita posterior | Não |

**Sequência revisada:**
1. **Lote 2C** — Especificação (este relatório): planejamento, documentação e definição de padrões. Nenhuma alteração local.
2. **Lote 2D** — Validação técnica: testes controlados de leitura externa por agente.
3. **Lote 2E** — Implantação controlada: somente mediante autorização explícita do usuário.

---

## 11. Riscos, limitações e decisões pendentes

### 11.1 Riscos identificados

| Risco | Medida de proteção |
|-------|--------------------|
| Sobrescrever Skills nativas dos agentes | Nunca copiar para diretórios de agentes sem autorização explícita; usar apenas leitura direta |
| Links simbólicos/junctions quebrados no Windows | Não usar links; adaptador de leitura direta sem cópia |
| Divergência de versões entre central e agentes | `versions.lock` como fonte de verdade; atualização apenas explícita e revisada |
| Execução automática de instruções perigosas | Central é catálogo de referência; nenhum agente ingere automaticamente sem ação do usuário |
| Falta de evidência de suporte em Claude/Copilot/Kimi/Antigravity | Classificar como não confirmada/não suportada; não integrar como Skill |
| Alteração acidental do TCC | Biblioteca central fora do TCC; cópias de `alethe` preservadas |

### 11.2 Limitações técnicas

- Todas as classificações de compatibilidade são baseadas em presença de diretório e leitura de `SKILL.md`, não em teste funcional de invocação.
- Não houve execução de scripts nem instalação de qualquer Skill.
- Os hashes SHA-256 das Skills (exceto `alethe`) não foram calculados; constam como `não verificado`.
- O caminho final da biblioteca central depende de decisão do usuário.

### 11.3 Decisões pendentes do usuário

1. Caminho exato da biblioteca central (recomendação: `%USERPROFILE%\.agent-skills\shared\`; alternativa: `%LOCALAPPDATA%\AgentSkills\`).
2. Autorização para executar o Lote 2D (validação técnica de leitura externa).
3. Autorização para executar o Lote 2E (instalação controlada), somente após sucesso do Lote 2D.
4. Decisão sobre a cópia redundante de `alethe` em `skills/alethe/` (manter como backup ou remover, somente com autorização explícita).

---

## 12. Confirmações finais

- **Relatório criado com sucesso:** `RELATORIO_LOTE2C_ESPECIFICACAO.md`.
- **Caminho exato do arquivo:** `C:\Users\marco\OneDrive\Documentos\ChatGPT\Navegacao-Indoor-3D\RELATORIO_LOTE2C_ESPECIFICACAO.md`.
- **Estrutura de domínios recomendada:** 7 domínios funcionais (`design`, `development`, `quality`, `security`, `data`, `devops`, `docs`) + 2 coleções especiais (`orchestrator` para orquestração e contexto, `optional` para `reverse-engineer-anything`). Total: 9 agrupamentos, 26 Skills, nenhuma duplicada.
- **Caminho central recomendado:** `%USERPROFILE%\.agent-skills\shared\`. Alternativa: `%LOCALAPPDATA%\AgentSkills\`.
- **Decisões que dependem do usuário:** caminho final da central, autorização para Lote 2D e Lote 2E, destino da cópia redundante de `alethe`.
- **Limitações:** compatibilidade não testada funcionalmente; hashes não calculados (exceto `alethe`); caminho central não definido.
- **Confirmação explícita:** nenhuma Skill foi instalada, copiada, movida ou modificada.
- **Confirmação explícita:** nenhuma configuração, MCP ou arquivo do TCC foi alterado, exceto a criação deste relatório autorizado.
- **As duas cópias de `alethe` permanecem preservadas:** `.agents/skills/alethe/` e `skills/alethe/` inalteradas.
- **Craft Anything permanece excluído.**

Não iniciar o Lote 2D ou 2E automaticamente. Aguardar nova autorização explícita do usuário.

---
Fim do relatório Lote 2C.