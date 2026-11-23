"""Fixtures compartilhados para os testes da API.

Fornece ``db_session`` (SQLite em arquivo temporario isolado POR TESTE),
``client`` (TestClient do FastAPI que injeta a mesma sessao),
``sample_data`` (grafo minimo para rate limit) e ``api_key_header``
(cabecalho de autenticacao admin), que sao usados por varios arquivos
de teste mas nao estavam definidos em nenhum conftest do projeto.

Cada teste recebe seu proprio arquivo SQLite temporario, garantindo
isolamento completo entre testes sem depender do temp do Windows
(que costuma rejeitar acesso com PermissionError).
"""
import os
import tempfile
from pathlib import Path

# Variaveis de ambiente devem ser definidas ANTES de importar a app,
# pois get_settings() usa @lru_cache e o engine e criado no modulo.
# Usamos um caminho placeholder; o engine real e recriado por teste.
os.environ["DATABASE_URL"] = "sqlite:///:placeholder:"
os.environ["ADMIN_API_KEY"] = "audit-local-admin-key-with-32-characters"
os.environ["SECRET_KEY"] = "audit-local-only-secret-key-32-chars"
os.environ["ADMIN_API_KEYS"] = "{}"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


def _make_test_engine():
    """Cria um engine SQLite em arquivo temporario unico."""
    tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp_db.close()
    engine = create_engine(
        f"sqlite:///{tmp_db.name}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    return engine, tmp_db.name


@pytest.fixture
def db_session():
    """Sessao SQLite isolada por teste (banco temporario proprio)."""
    engine, db_path = _make_test_engine()
    SessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()
        Path(db_path).unlink(missing_ok=True)


@pytest.fixture
def client(db_session):
    """TestClient que injeta a mesma sessao do banco usada pelo teste."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def api_key_header():
    """Cabecalho de autenticacao admin com motivo da alteracao (X-Audit-Reason)."""
    return {
        "X-API-Key": os.environ["ADMIN_API_KEY"],
        "X-Audit-Reason": "teste automatizado de API",
    }


@pytest.fixture
def sample_data(db_session):
    """Grafo minimo com 2 pisos, nos e arestas para testes de rate limit."""
    from app.models import Shopping, Piso, No, QRCode, Loja

    from seed_mini_shopping import seed_mini_shopping

    seed_mini_shopping(db_session)
    db_session.commit()

    shopping = (
        db_session.query(Shopping).filter_by(codigo="MINI_SHOPPING").one()
    )

    pisos = db_session.query(Piso).filter_by(shopping_id=shopping.id).all()
    piso = pisos[0]

    # Nos por codigo de anchor (ex: n1 = entrada, n5 = primeira loja)
    nodes_by_code = {
        n.codigo: n
        for n in db_session.query(No).filter(
            No.piso_id.in_([p.id for p in pisos])
        ).all()
    }

    # Mapear nomes genericos para nos reais
    entrada = nodes_by_code.get("T_ENTRADA")
    corredores = [n for n in nodes_by_code.values() if n.tipo == "corredor"]
    primeira_loja = next(
        (n for n in nodes_by_code.values() if n.tipo == "loja"), None
    )

    # Um QR code e uma loja para os testes de API
    qr = db_session.query(QRCode).first()
    loja = db_session.query(Loja).first()

    # Arestas para testes de auditoria
    from app.models import Aresta
    arestas = db_session.query(Aresta).all()

    return {
        "shopping": shopping,
        "piso": piso,
        "nodes": {
            "n1": entrada,
            "n2": corredores[0] if len(corredores) > 0 else entrada,
            "n3": corredores[1] if len(corredores) > 1 else entrada,
            "n4": corredores[2] if len(corredores) > 2 else entrada,
            "n5": primeira_loja,
        },
        "qr": qr,
        "loja": loja,
        "edges": arestas,
    }
