# Relatório Lote 2B — Arquitetura da Biblioteca Compartilhada de Agent Skills

> Modo: somente leitura e planejamento.
> Não criar diretórios. Não copiar, instalar, mover, remover ou modificar Skills.
> Não alterar configurações, MCPs, arquivos do TCC nem Git.
> Preservar integralmente as duas cópias existentes de `alethe`.
> Não integrar Craft Anything.
> Não presumir suporte nativo a Skills em agentes sem evidência.
> Base: `RELATORIO_LOTE1_PARTE2.md` e `RELATORIO_LOTE2A_VALIDACAO.md`.

---

## 0. Resumo executivo

Proposta de biblioteca central compartilhada de Agent Skills, fora do repositório TCC, com fonte de verdade única e estratégias de integração específicas por agente. Nenhuma implementação será executada nesta etapa.

---

## 1. Arquitetura central

### 1.1 Opções de localização (fora do repositório TCC)

| Opção | Caminho | Vantagens | Desvantagens |
|-------|---------|-----------|--------------|
| A | `~/.agents/skills/` (Alethe Desktop) | Já existe no ambiente; diretório de descoberta do Alethe Desktop; `.skill-lock.json` já registrado | Vinculado ao Alethe Desktop; não evidenciado como descoberta nativa de OpenCode/Codex/Claude |
| B | `~/.config/opencode/skills/` (OpenCode) | Já existe; 43 Skills instaladas; diretório de descoberta do OpenCode | Vinculado ao OpenCode; não evidenciado como descoberta nativa de outros agentes |
| C | Novo diretório neutro | Ex: `~/.agent-skills/shared/` ou `~/.local/share/agent-skills/` | Não existe; requer criação (não executada nesta tarefa); nenhum agente evidenciado como descobridor automático |

### 1.2 Recomendação de fonte de verdade

**Fonte de verdade única:** um diretório neutro fora do TCC, ainda a ser definido pelo usuário (opção C), com as 26 Skills aprovadas no Lote 2A como catálogo inicial.

**Raciocínio:** nenhuma das localizações existentes (`~/.agents/skills/`, `~/.config/opencode/skills/`) é evidenciada como diretório de descoberta nativo de todos os sete agentes. Adotar uma delas como central implicaria acoplamento a um agente específico e risco de sobrescrever Skills nativas. Um diretório neutro preserva a autonomia de cada agente e permite adaptadores específicos por agente.

**Regra:** as duas cópias existentes de `alethe` no repositório TCC (`.agents/skills/alethe/` e `skills/alethe/`, idênticas por SHA-256) permanecem inalteradas — não são movidas nem copiadas para a biblioteca central neste plano.

---

## 2. Integração por agente

Classificação:
- **Nativa confirmada:** agente possui diretório de descoberta de Skills com SKILL.md válido, evidenciado por leitura direta.
- **Adaptador possível:** agente lê arquivos Markdown/instruções, mas não há evidência de diretório de Skills nem suporte documentado ao padrão SKILL.md.
- **Não suportada / não confirmada:** agente usa plugins/extensões, não tem diretório de Skills, ou não há evidência.

| Agente | Diretório de descoberta evidenciado | Suporte a SKILL.md | Instalação global | Instalação por projeto | Classificação de integração | Estratégia proposta |
|--------|-------------------------------------|--------------------|-------------------|------------------------|-----------------------------|---------------------|
| OpenCode | `~/.config/opencode/skills/` | Sim (frontmatter `name`/`description`) | Confirmada (43 Skills) | Não confirmada | Nativa confirmada | Apontar para a biblioteca central via leitura direta dos SKILL.md; manter cópia local apenas se o agente exigir |
| Codex | `~/.codex/skills/` | Sim (frontmatter + `metadata`) | Confirmada (8 + `.system/`) | Não confirmada | Nativa confirmada | Idem OpenCode |
| Alethe Desktop | `~/.agents/skills/` | Sim (frontmatter `name`/`description`) | Confirmada (3 Skills) | Não confirmada | Nativa confirmada | Idem OpenCode; `.skill-lock.json` pode ser referência de versões |
| Claude Code | `~/.claude/skills/` (vazio) | Não confirmada (não instalado) | Não confirmada | Não confirmada | Não confirmada | Adaptador possível apenas se o agente ler instruções de arquivos Markdown; sem evidência de diretório de Skills |
| GitHub Copilot CLI | Nenhum (usa `installed-plugins/` vazio) | Não confirmada | Não suportada (plugins, não Skills) | Não suportada | Não suportada | Não integrar como Skill; usar apenas como consumidor de resultados |
| Kimi Code | Nenhum diretório `skills/` | Não confirmada | Não confirmada | Não confirmada | Não confirmada | Adaptador possível apenas com evidência futura |
| Antigravity / Antigravity IDE | Nenhum (extensões VS Code + `argv.json`) | Não confirmada | Não suportada (extensões) | Não suportada | Não suportada | Não integrar como Skill |

**Matriz de integração (resumo):**

| Agente | Classificação | Ação no plano |
|--------|--------------|---------------|
| OpenCode | Nativa confirmada | Leitura direta dos SKILL.md da biblioteca central |
| Codex | Nativa confirmada | Leitura direta dos SKILL.md da biblioteca central |
| Alethe Desktop | Nativa confirmada | Leitura direta + `.skill-lock.json` como referência de versão |
| Claude Code | Não confirmada | Adaptador possível (pendente de evidência) |
| GitHub Copilot CLI | Não suportada | Não integrar |
| Kimi Code | Não confirmada | Adaptador possível (pendente de evidência) |
| Antigravity | Não suportada | Não integrar |

---

## 3. Estrutura da biblioteca

### 3.1 Organização por domínio (não duplicar Skills para categorização)

Cada Skill existe **uma única vez** na biblioteca central. A categorização é feita por metadados (arquivo `catalog.yaml` ou similar na raiz da biblioteca), não por cópia em múltiplas pastas.

```
<biblioteca-central>/          (caminho a definir pelo usuário; fora do TCC)
├── catalog.yaml               # Índice único: nome, domínio, origem, licença, versão, agente-compatível, dependências, riscos
├── versions.lock              # Trava de versões aprovadas (análogo a skills-lock.json)
├── orchestrator/              # alethe (referência, não copiada do TCC), using-agent-skills, context-engineering, context7-mcp, find-skills
├── design/                    # frontend-design, frontend-ui-engineering, design-taste-frontend, design-workflow
├── development/               # software-development, api-and-interface-design, software-architecture, code-simplification
├── quality/                   # code-review-and-quality, test-driven-development, testing-qa, playwright-cli, debugging-and-error-recovery
├── security/                  # security-and-hardening
├── data/                      # database-engineering
├── devops/                    # ci-cd-and-automation, git-workflow-and-versioning
├── docs/                      # documentation-and-adrs, planning-and-task-breakdown, spec-driven-development
└── optional/                  # reverse-engineer-anything
```

### 3.2 Metadados por Skill (exemplo de campos do `catalog.yaml`)

```yaml
skills:
  - name: alethe
    domain: orchestrator
    source: Kc1t/alethe-orchestrate-skill
    sourceType: github
    skillPath: alethe/SKILL.md
    license: não declarada
    version: "24"  # conforme frontmatter
    compatibleAgents: [alethe-desktop]
    dependencies: [python>=3.9 opcional, scripts/orchestrate.py]
    risks: ["execução de workers CLI", "acesso a worktrees"]
    notes: "duas cópias idênticas preservadas no TCC; não copiar para central"
```

Cada Skill mantém sua estrutura interna original (`SKILL.md`, `scripts/`, `references/`, `assets/`, `LICENSE`, `agents/openai.yaml` quando existir).

### 3.3 Controle de origem e licença

- Origem: informada apenas quando verificável por leitura direta (ex: `skills-lock.json`, frontmatter, `UPSTREAM.md`, comentários de cabeçalho).
- Licença: declarada apenas quando lida diretamente (ex: MIT, Apache-2.0). Quando não declarada, registrar "não declarada".
- Versão: do campo `metadata.version` do frontmatter ou do `skills-lock.json`.

---

## 4. Sincronização

### 4.1 Princípio

Manter versões consistentes **sem sobrescrever Skills nativas ou específicas dos agentes**. Cada agente continua a gerenciar seu próprio diretório; a biblioteca central é um catálogo de referência e origem para consultas, não um local de gravação automática nos agentes.

### 4.2 Estratégias comparadas (Windows)

| Estratégia | Descrição | Risco no Windows | Adequação |
|------------|-----------|------------------|-----------|
| Links simbólicos (`mklink /D`) | Aponta diretórios do agente para a central | Requer privilégios de administrador ou modo desenvolvedor; pode quebrar se o alvo for movido; agentes podem não seguir links em sandbox | Baixa adequação (risco de permissão e sandbox) |
| Junctions | Semelhante a links simbólicos para diretórios | Mesmo risco acima; NTFS-specific | Baixa adequação |
| Cópias controladas | Copiar SKILL.md (apenas leitura) para diretório do agente | Sobrescreve arquivos do agente; risco de divergência de versões; viola regra de não modificar agentes | Não adequada |
| Adaptador de leitura | Agente lê direto da central sem cópia | Sem modificação do agente; depende de suporte do agente a caminhos externos | Alta adequação para agentes com confirmação |
| Catálogo de referência + instalação manual | Central apenas documenta; instalação é ação explícita do usuário | Mais lento; não automatizado | Adequada como etapa inicial reversível |

### 4.3 Recomendação

**Adaptador de leitura + catálogo de referência:** a biblioteca central armazena os arquivos originais; cada agente, quando tiver suporte nativo confirmado, lê os SKILL.md diretamente da central. Não há cópia automática nos diretórios dos agentes. Qualquer instalação em diretório de agente é ação explícita e autorizada pelo usuário, em lotes reversíveis (Lote 2C, se autorizado).

### 4.4 Sincronização de versões

- `versions.lock` na central registra a versão aprovada de cada Skill (conforme frontmatter ou `skills-lock.json`).
- Alteração de versão requer revisão e atualização explícita do `versions.lock` + `catalog.yaml`, nunca sobrescrita automática.

---

## 5. Segurança

### 5.1 Revisão de conteúdo

Antes de adicionar qualquer Skill à central:
- Ler `SKILL.md` na íntegra (frontmatter + corpo).
- Verificar ausência de instruções perigosas (execução de comandos remotos, exfiltração, credenciais embutidas, bypass de sandbox).
- Verificar ausência de segredos, tokens, senhas ou chaves (regra do Lote 1).
- Confirmar licença quando declarada; registrar "não declarada" caso contrário.

### 5.2 Scripts e recursos auxiliares

- Scripts (`scripts/`) são lidos, não executados nesta etapa.
- Qualquer script futuro só seria executado com aprovação explícita do usuário e em ambiente isolado.
- Referências (`references/`) e assets (`assets/`) são tratados como dados, não como instruções executáveis.

### 5.3 Dependências

- Dependências declaradas no `catalog.yaml` são informativas (ex: `python>=3.9`, `npx skills`, `playwright-cli`).
- Nenhuma dependência é instalada automaticamente.
- Auditar origem (GitHub oficial vs fork desconhecido) antes de incluir no catálogo.

### 5.4 Permissões e procedência

- Procedência: GitHub URL verificável (`skills-lock.json`, `sourceUrl`, comentários de cabeçalho).
- Permissões de arquivo: apenas leitura; sem execução automática.
- Prevenção de execução automática de instruções perigosas: o catálogo é documento de referência; agentes não ingerem automaticamente o conteúdo da central sem ação explícita do usuário.

### 5.5 Isolamento do TCC

- A biblioteca central fica **fora** do repositório `Navegacao-Indoor-3D`.
- Nenhuma alteração nos arquivos do TCC, incluindo as duas cópias de `alethe`.

---

## 6. Plano de implantação (não executar nesta tarefa)

Dividido em lotes pequenos, reversíveis, com backup, validação e rollback.

### Lote 2C — Preparação da central (planejamento apenas)

1. Definir com o usuário o caminho da biblioteca central (fora do TCC).
2. Criar `catalog.yaml` e `versions.lock` com as 26 Skills aprovadas no Lote 2A.
3. Validar frontmatter e licenças de cada SKILL.md já lida.
4. Backup do estado atual dos diretórios de Skills de OpenCode, Codex e Alethe Desktop (apenas leitura/anotação de caminhos e hashes).
5. Rollback: remover `catalog.yaml`/`versions.lock` se houver problema.

### Lote 2D — Validação de leitura por agente (planejamento apenas)

1. Confirmar que OpenCode, Codex e Alethe Desktop conseguem ler SKILL.md da central (sem cópia, sem gravação).
2. Validar que não há sobrescrita de Skills nativas.
3. Documentar agentes sem suporte (Claude, Copilot, Kimi, Antigravity) como "não confirmada/não suportada".
4. Rollback: reverter qualquer leitura temporária (não deixa rastros).

### Lote 2E — Instalação controlada (apenas se autorizado pelo usuário)

1. Instalar uma Skill por vez no diretório do agente, com aprovação explícita por Skill.
2. Validar funcionamento após cada instalação.
3. Rollback: remover a Skill instalada e restaurar estado anterior.

---

## 7. Diagrama da arquitetura proposta (texto)

```
[Usuário]
   |
   v
+---------------------+      leitura direta (SKILL.md)      +---------------------------+
| Biblioteca Central  | <---------------------------------- | OpenCode (nativa)         |
| (fora do TCC)       |                                     | Codex (nativa)            |
| - catalog.yaml      |                                     | Alethe Desktop (nativa)   |
| - versions.lock     |                                     +---------------------------+
| - /orchestrator     |                                       ^
| - /design           |                                       |
| - /development      |              não suportada /          |
| - /quality          |              não confirmada           |
| - /security         |                                       |
| - /data             |        +------------------+           |
| - /devops           |        | Claude Code      |           |
| - /docs             |        | Copilot CLI      |           |
| - /optional         |        | Kimi Code        |           |
|                     |        | Antigravity      |           |
| [SKILL.md de cada   |        | (adaptador       |           |
|  Skill, sem cópia   |        |  possível ou     |           |
|  no TCC)]           |        |  não suportada)  |           |
+---------------------+        +------------------+           ^
        |                                          |           |
        | referência de versão (.skill-lock.json)|           |
        v                                          |           |
[Duas cópias de alethe                      (não há diretório de
 preservadas no TCC,                       Skills evidenciado)
  inalteradas]
```

---

## 8. Riscos e medidas de proteção

| Risco | Medida de proteção |
|-------|--------------------|
| Sobrescrever Skills nativas dos agentes | Nunca copiar para diretórios de agentes sem autorização explícita; usar apenas leitura direta |
| Links simbólicos/junctions quebrados no Windows | Não usar links; adaptador de leitura direta sem cópia |
| Divergência de versões entre central e agentes | `versions.lock` como fonte de verdade; atualização apenas explícita e revisada |
| Execução automática de instruções perigosas | Central é catálogo de referência; nenhum agente ingere automaticamente sem ação do usuário |
| Falta de evidência de suporte em Claude/Copilot/Kimi/Antigravity | Classificar como não confirmada/não suportada; não integrar como Skill |
| Alteração acidental do TCC | Biblioteca central fora do TCC; cópias de `alethe` preservadas |

---

## 9. Resultado

- **Diagrama:** seção 7 (texto).
- **Matriz de integração dos sete agentes:** seção 2.
- **Estrutura de diretórios:** seção 3.1.
- **Estratégia de sincronização:** seção 4.
- **Riscos e medidas de proteção:** seção 8.
- **Plano de implantação ordenado:** seção 6 (Lotes 2C, 2D, 2E).

Nenhum dos lotes de implantação será executado nesta tarefa. Aguardo autorização explícita para iniciar o Lote 2C ou qualquer etapa de instalação.

---
Fim do relatório Lote 2B.