#!/usr/bin/env python3
"""
Alethe Orchestrate - Valida e executa planos de workers multi-agente.
Uso:
  python orchestrate.py validate <plano.json>
  python orchestrate.py execute <plano.json>
"""

import json
import sys
import os
import subprocess
import uuid
from datetime import datetime
from pathlib import Path


def load_plan(plan_path):
    """Carrega e valida a estrutura basica do plano JSON."""
    with open(plan_path, 'r', encoding='utf-8') as f:
        plan = json.load(f)

    errors = []

    if 'version' not in plan:
        errors.append("Campo 'version' ausente no plano")
    if 'workers' not in plan:
        errors.append("Campo 'workers' ausente no plano")
    elif not isinstance(plan['workers'], list) or len(plan['workers']) == 0:
        errors.append("Campo 'workers' deve ser uma lista nao vazia")
    else:
        for i, w in enumerate(plan['workers']):
            wid = w.get('id', f'worker[{i}]')
            if 'command' not in w:
                errors.append(f"Worker '{wid}': campo 'command' ausente")
            if 'task' not in w:
                errors.append(f"Worker '{wid}': campo 'task' ausente")
            if 'args' not in w:
                errors.append(f"Worker '{wid}': campo 'args' ausente")

    return plan, errors


def validate(plan_path):
    """Valida um plano sem executar."""
    plan, errors = load_plan(plan_path)

    if errors:
        print(f"VALIDACAO FALHOU para: {plan_path}")
        for e in errors:
            print(f"  - {e}")
        return False

    print(f"VALIDACAO OK para: {plan_path}")
    print(f"  Workers: {len(plan['workers'])}")
    for w in plan['workers']:
        print(f"  - {w.get('id', 'sem-id')}: {w.get('command', 'sem-comando')} {' '.join(w.get('args', []))[:80]}...")
    return True


def build_command(worker):
    """Construi a lista de argumentos para subprocess."""
    cmd = [worker['command']]
    cmd.extend(worker.get('args', []))
    # O task e passado como argumento posicional (message... do opencode run)
    cmd.append(worker['task'])
    return cmd


def execute(plan_path):
    """Executa todos os workers do plano."""
    plan, errors = load_plan(plan_path)

    if errors:
        print(f"EXECUCAO BLOQUEADA - erros de validacao:")
        for e in errors:
            print(f"  - {e}")
        return False

    max_concurrent = plan.get('maxConcurrent', 1)
    timeout = plan.get('budget', {}).get('maxWallSeconds', 600)

    print(f"EXECUTANDO plano: {plan_path}")
    print(f"  Workers: {len(plan['workers'])}")
    print(f"  Max concorrente: {max_concurrent}")
    print(f"  Timeout: {timeout}s")
    print()

    results = []

    for worker in plan['workers']:
        wid = worker.get('id', 'sem-id')
        cmd = build_command(worker)
        wtimeout = worker.get('timeoutSeconds', 180)

        print(f"=== Iniciando worker: {wid} ===")
        # Mostrar comando sem o prompt (muito longo)
        display_cmd = [c for c in cmd if c != worker['task'] and c != '--prompt']
        print(f"  Comando: {' '.join(display_cmd)} --prompt \"{worker['task'][:60]}...\"")
        print(f"  Timeout: {wtimeout}s")
        print()

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=wtimeout,
                encoding='utf-8',
                errors='replace'
            )

            if result.returncode == 0:
                print(f"  SUCESSO: {wid}")
                # Extrair texto da saida JSONL
                if result.stdout:
                    lines = result.stdout.strip().split('\n')
                    text_parts = []
                    for line in lines:
                        try:
                            obj = json.loads(line)
                            if obj.get('type') == 'text' and 'part' in obj:
                                text_parts.append(obj['part'].get('text', ''))
                        except:
                            pass
                    full_text = ''.join(text_parts)
                    if full_text:
                        print(f"  Resposta: {full_text[:500]}")
            else:
                print(f"  FALHA: {wid} (codigo {result.returncode})")
                if result.stderr:
                    print(f"  Erro: {result.stderr[:500]}")
                if result.stdout:
                    print(f"  Saida: {result.stdout[:500]}")

            results.append({
                'worker': wid,
                'returncode': result.returncode,
                'stdout': result.stdout[:1000] if result.stdout else '',
                'stderr': result.stderr[:1000] if result.stderr else ''
            })

        except subprocess.TimeoutExpired:
            print(f"  TIMEOUT: {wid} excedeu {wtimeout}s")
            results.append({
                'worker': wid,
                'returncode': -1,
                'stdout': '',
                'stderr': f'Timeout após {wtimeout}s'
            })
        except Exception as e:
            print(f"  ERRO: {wid} - {str(e)}")
            results.append({
                'worker': wid,
                'returncode': -1,
                'stdout': '',
                'stderr': str(e)
            })

        print()

    # Salvar resultado
    run_id = str(uuid.uuid4())[:8]
    run_dir = Path("orchestrations") / f"run-{run_id}"
    run_dir.mkdir(parents=True, exist_ok=True)

    summary = {
        'run_id': run_id,
        'plan': plan_path,
        'executed_at': datetime.now().isoformat(),
        'results': results
    }

    with open(run_dir / 'summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print(f"RESULTADOS salvos em: {run_dir / 'summary.json'}")

    # Verificar se todos tiveram sucesso
    all_ok = all(r['returncode'] == 0 for r in results)
    return all_ok


def main():
    if len(sys.argv) < 3:
        print("Uso: python orchestrate.py <validate|execute> <plano.json>")
        sys.exit(1)

    action = sys.argv[1].lower()
    plan_path = sys.argv[2]

    if not os.path.exists(plan_path):
        print(f"Arquivo nao encontrado: {plan_path}")
        sys.exit(1)

    if action == 'validate':
        success = validate(plan_path)
        sys.exit(0 if success else 1)
    elif action == 'execute':
        success = execute(plan_path)
        sys.exit(0 if success else 1)
    else:
        print(f"Acao desconhecida: {action}. Use 'validate' ou 'execute'.")
        sys.exit(1)


if __name__ == '__main__':
    main()
