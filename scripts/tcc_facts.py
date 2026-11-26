"""Gera docs/TCC_SYNC.md e docs/tcc_facts.json a partir do estado atual do repositório.

Fatos coletados (sem inventar execução):
- URL do repositório, commit e data (git rev-parse / git log -1)
- Tabelas e campos dos modelos SQLAlchemy da API
- Lista de endpoints da API (path, métodos)
- Versões das dependências (requirements.txt e package.json)
- Tokens QR, contagem de POIs e pisos do seed (banco SQLite temporário)
- Contagem de testes por suíte da API (definidos estaticamente; aprovados/ignorados/falhos se pytest rodar)
- Data da última execução do script
"""
from __future__ import annotations

import json
import re
import sqlite3
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
API_DIR = REPO_ROOT / "services" / "api"
DOCS_DIR = REPO_ROOT / "docs"

sys.path.insert(0, str(API_DIR))


def _run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kwargs)


def _git(args: list[str]) -> str:
    res = _run(["git"] + args, cwd=str(REPO_ROOT))
    if res.returncode != 0:
        return ""
    return res.stdout.strip()


def repo_url() -> str:
    url = _git(["remote", "get-url", "origin"])
    if url.endswith(".git"):
        return url
    return url + ".git" if url else ""


def commit_info() -> dict[str, str]:
    short = _git(["rev-parse", "--short", "HEAD"])
    full = _git(["rev-parse", "HEAD"])
    date = _git(["log", "-1", "--format=%ci"])
    return {"short": short, "full": full, "date": date}


def _import_app():
    from app.main import app  # noqa: WPS433
    from app.database import Base  # noqa: WPS433
    return app, Base


def tabelas_e_campos() -> dict[str, list[dict[str, str]]]:
    _, Base = _import_app()
    resultado = {}
    for nome, tabela in Base.metadata.tables.items():
        colunas = []
        for coluna in tabela.columns:
            colunas.append(
                {
                    "nome": coluna.name,
                    "tipo": str(coluna.type),
                    "nullable": coluna.nullable,
                    "primary_key": bool(coluna.primary_key),
                }
            )
        resultado[nome] = colunas
    return resultado


def endpoints() -> list[dict[str, object]]:
    app, _ = _import_app()
    lista = []
    for rota in app.routes:
        path = getattr(rota, "path", None)
        if path is None:
            continue
        methods = sorted(getattr(rota, "methods", set()) or set())
        lista.append({"path": path, "methods": methods})
    lista.sort(key=lambda item: (item["path"], ",".join(item["methods"])))
    return lista


def versoes_dependencias() -> dict[str, dict[str, str]]:
    resultado: dict[str, dict[str, str]] = {}
    req = API_DIR / "requirements.txt"
    if req.exists():
        deps = {}
        for linha in req.read_text(encoding="utf-8").splitlines():
            linha = linha.strip()
            if not linha or linha.startswith("#"):
                continue
            partes = re.split(r"[<>!=~]+", linha, maxsplit=1)
            nome = partes[0].strip().split("[")[0].strip()
            versao = linha
            deps[nome] = versao
        resultado["services/api/requirements.txt"] = deps
    for nome_app in ("visitor", "admin"):
        pkg = REPO_ROOT / "apps" / nome_app / "package.json"
        if pkg.exists():
            try:
                dados = json.loads(pkg.read_text(encoding="utf-8"))
                deps = {}
                for secao in ("dependencies", "devDependencies"):
                    for chave, valor in (dados.get(secao) or {}).items():
                        deps[chave] = valor
                resultado[f"apps/{nome_app}/package.json"] = deps
            except json.JSONDecodeError:
                pass
    return resultado


def seed_fatos() -> dict[str, object]:
    """Conta POIs, pisos e coleta tokens QR usando um banco SQLite temporário."""
    from app.database import Base, engine as _module_engine  # noqa: WPS433
    from seed_mini_shopping import seed_mini_shopping  # noqa: WPS433
    from app.models import Loja, Piso, QRCode  # noqa: WPS433

    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    db_path = tmp.name
    engine_local = _module_engine  # reconfigurado abaixo
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        engine_local = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine_local)
        SessionLocal = sessionmaker(bind=engine_local, autocommit=False, autoflush=False)
        with SessionLocal() as db:
            seed_mini_shopping(db)
            db.commit()
            pisos = db.query(Piso).count()
            lojas = db.query(Loja).count()
            tokens = [row[0] for row in db.query(QRCode.token).order_by(QRCode.token).all()]
        return {
            "pisos": pisos,
            "pois_lojas": lojas,
            "tokens_qr": tokens,
            "banco_temporario": db_path,
        }
    except Exception as exc:  # noqa: BLE001
        return {"erro": str(exc), "banco_temporario": db_path}
    finally:
        try:
            engine_local.dispose()
        except Exception:  # noqa: BLE001
            pass
        try:
            Path(db_path).unlink(missing_ok=True)
        except Exception:  # noqa: BLE001
            pass


def _contar_testes_estaticos() -> dict[str, int]:
    """Conta funções `def test_`/`async def test_` por arquivo de suíte da API."""
    testes_dir = API_DIR / "tests"
    padrao = re.compile(r"^\s*(async\s+)?def\s+(test_\w+)\b", re.MULTILINE)
    resultado = {}
    if testes_dir.exists():
        for arquivo in sorted(testes_dir.glob("test_*.py")):
            texto = arquivo.read_text(encoding="utf-8")
            resultado[arquivo.name] = len(padrao.findall(texto))
    return resultado


def executar_pytest() -> dict[str, object] | None:
    """Tenta rodar a suíte da API e retorna contagens. Retorna None se não puder."""
    if not (API_DIR / "tests").exists():
        return None
    res = _run(
        [
            sys.executable,
            "-m",
            "pytest",
            "services/api/tests",
            "-q",
        ],
        cwd=str(REPO_ROOT),
    )
    saida = res.stdout + res.stderr
    m = re.search(r"(\d+) passed(?:, (\d+) skipped)?(?:, (\d+) failed)?", saida)
    if not m:
        return None
    aprovados = int(m.group(1))
    ignorados = int(m.group(2) or 0)
    falhos = int(m.group(3) or 0)
    return {
        "aprovados": aprovados,
        "ignorados": ignorados,
        "falhos": falhos,
        "executado": True,
        "codigo_saida": res.returncode,
    }


def gerar() -> None:
    commit = commit_info()
    seed = seed_fatos()
    testes_estaticos = _contar_testes_estaticos()
    pytest_resultado = executar_pytest()

    suites = {}
    for nome, definido in testes_estaticos.items():
        suites[nome] = {"definidos": definido}
    if pytest_resultado:
        suites["_total_pytest"] = {
            "aprovados": pytest_resultado["aprovados"],
            "ignorados": pytest_resultado["ignorados"],
            "falhos": pytest_resultado["falhos"],
            "executado": True,
        }
    else:
        suites["_total_pytest"] = {
            "definidos": sum(testes_estaticos.values()),
            "executado": False,
            "motivo": "pytest não executado neste script",
        }

    facts = {
        "repositorio": {
            "url": repo_url(),
            "commit": commit,
            "branch_atual": _git(["branch", "--show-current"]),
        },
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "api": {
            "tabelas": tabelas_e_campos(),
            "endpoints": endpoints(),
            "versoes_dependencias": versoes_dependencias(),
        },
        "seed": seed,
        "testes": suites,
    }

    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    json_path = DOCS_DIR / "tcc_facts.json"
    json_path.write_text(json.dumps(facts, indent=2, ensure_ascii=False), encoding="utf-8")

    md_path = DOCS_DIR / "TCC_SYNC.md"
    linhas = [
        "# Sincronização do TCC",
        "",
        f"- Repositório: {facts['repositorio']['url']}",
        f"- Commit: {commit['full']} ({commit['short']})",
        f"- Data do commit: {commit['date'] or 'não disponível'}",
        f"- Gerado em: {facts['gerado_em']}",
        f"- Branch: {facts['repositorio']['branch_atual'] or 'não disponível'}",
        "",
        "## Tabelas e campos da API",
        "",
    ]
    for tabela, colunas in facts["api"]["tabelas"].items():
        linhas.append(f"### {tabela}")
        for coluna in colunas:
            pk = " (PK)" if coluna["primary_key"] else ""
            nulo = "nullable" if coluna["nullable"] else "NOT NULL"
            linhas.append(f"- {coluna['nome']}: {coluna['tipo']} {nulo}{pk}")
        linhas.append("")
    linhas.append("## Endpoints da API")
    linhas.append("")
    for ep in facts["api"]["endpoints"]:
        linhas.append(f"- {', '.join(ep['methods'])} {ep['path']}")
    linhas.append("")
    linhas.append("## Seed (Mini Shopping)")
    linhas.append("")
    linhas.append(f"- Pisos: {seed.get('pisos')}")
    linhas.append(f"- POIs/lojas: {seed.get('pois_lojas')}")
    linhas.append(f"- Tokens QR: {len(seed.get('tokens_qr') or [])}")
    linhas.append("")
    linhas.append("## Testes da API por suíte")
    linhas.append("")
    for suite, dados in suites.items():
        if suite == "_total_pytest":
            continue
        linhas.append(f"- {suite}: {dados['definidos']} teste(s) definido(s)")
    if "_total_pytest" in suites:
        total = suites["_total_pytest"]
        linhas.append("")
        if total.get("executado"):
            linhas.append(f"- Total pytest: {total['aprovados']} aprovados, {total['ignorados']} ignorados, {total['falhos']} falhos")
        else:
            linhas.append(f"- Total pytest: {total.get('definidos', 0)} definido(s); executado: {total.get('executado')} ({total.get('motivo')})")
    md_path.write_text("\n".join(linhas) + "\n", encoding="utf-8")


if __name__ == "__main__":
    gerar()
