# Configuração local dos workers

Este documento descreve somente configuração estática. Nenhum plano deve ser executado sem uma autorização específica para iniciar uma wave.

| Papel | Executor | Integração | Isolamento | Seleção |
| --- | --- | --- | --- | --- |
| Planner/lead | Codex CLI | nativo | não aplicável | política local |
| Implementação | OpenCode | `custom` | `mode: write`, `isolate: true` | `--model` obrigatório no plano |
| Auxiliar | Kimi Code | nativo | `mode: write`, `isolate: true` | modelo padrão já autenticado, preservado |
| Implementação adicional | GitHub Copilot CLI | `custom` existente | `mode: write`, `isolate: true` | adaptador preservado |
| Análise/revisão | NVIDIA Nemotron | OpenCode `custom` | `mode: write`, `isolate: true` | modelo NVIDIA fixado, sem fallback |

## Política local

`.alethe/alethe-orchestrate.json` limita `maxWorkers` e `maxConcurrent` a `2`, mantém `providerOrder` como `codex, kimi`, bloqueia troca automática com `providerSwitch: never` e preserva `trust.allowUnsafe: false`.

O Alethe possui adaptadores nativos somente para Codex, Claude, Agy e Kimi. Por isso OpenCode e Copilot usam `provider: custom`. Adaptadores customizados não podem reivindicar execução somente leitura; todo uso de escrita deve ser isolado em worktree.

## OpenCode e Nemotron

O CLI instalado aceita `opencode run --model <provider/model> --format json <prompt>`. Os planos usam a saída `jsonl`, pois o formato JSON do OpenCode é emitido como eventos por linha. `--archived` evita misturar uma futura execução com listas normais de sessões.

O OpenCode já contém a configuração NVIDIA para `https://integrate.api.nvidia.com/v1` e o modelo `nvidia/nemotron-3.5-super-vl-120b-a12b`. O plano `nvidia-nemotron-direct.json` fixa a seleção sem alterar o modelo padrão do OpenCode, o OpenRouter ou qualquer credencial. A disponibilidade, custo e quota NVIDIA não foram consultados; o plano não deve ser executado sem confirmação explícita de custo.

## Planos estáticos

- `opencode-implementation-template.json`: preencha um modelo aprovado e um brief delimitado.
- `kimi-auxiliary-template.json`: preencha apenas o brief; preserva a escolha de modelo já configurada no Kimi.
- `copilot-worker-template.json`: preserva o adaptador Copilot previamente validado e não o testa novamente.
- `nvidia-nemotron-direct.json`: perfil especializado de análise/revisão, pendente de validação funcional e custo.

Antes de iniciar uma wave, valide o plano localmente e confirme que duas tarefas escritoras não possuem caminhos sobrepostos. Não há fallback de provedor nem de modelo nos planos customizados.
