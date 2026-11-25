# Alethe multiagente local

Esta configuração é exclusiva deste projeto. Ela não substitui a política global nem a configuração do OpenCode.

- Planner: Codex CLI.
- Worker Antigravity: adaptador nativo `agy`, com modelo explicitamente fixado por plano.
- Worker OpenCode: adaptador `custom`, sempre em worktree isolada porque o Alethe não consegue impor modo somente leitura a CLIs customizadas.
- Concorrência e chamadas: no máximo duas por onda; `providerSwitch=never`; `trust.allowUnsafe=false`.
- OpenRouter: use somente identificadores terminados em `:free`, sempre informados explicitamente em `--model`.
- NVIDIA direta: a configuração existente do OpenCode é reconhecida, mas não deve ser executada até haver confirmação de quota gratuita/sem cobrança; não existe fallback automático para ela.

O plano `.alethe/plans/nvidia-nemotron-direct.json` fixa o endpoint NVIDIA existente, mas é deliberadamente somente um template até essa confirmação. O plano `.alethe/plans/dual-worker-integration.json` é a prova integrada: ele só poderá iniciar quando a quota do Agy estiver abaixo do limite.

No PowerShell, defina a política local para uma execução:

```powershell
$env:ALETHE_ORCHESTRATE_POLICY = "$PWD/.alethe/alethe-orchestrate.json"
$env:ALETHE_ORCHESTRATE_HOME = "$PWD/.alethe/orchestrations"
python .agents/skills/alethe/scripts/orchestrate.py validate .alethe/plans/dual-worker-integration.json
```
