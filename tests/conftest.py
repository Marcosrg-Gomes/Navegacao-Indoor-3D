import os

# The application lifespan also opens its configured engine. Never inherit a
# developer/production database URL when running the isolated test suite.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ADMIN_API_KEY"] = "test-api-key"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["DEBUG"] = "true"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings
from app.database import Base, get_db
from app.main import app
from app.models import Shopping, Piso, No, Aresta, Loja, Categoria, QRCode

get_settings.cache_clear()

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def api_key_header():
    settings = get_settings()
    return {"X-API-Key": settings.ADMIN_API_KEY}


@pytest.fixture
def sample_data(db_session):
    shopping = Shopping(
        nome="Shopping Teste",
        endereco="Rua Teste, 123",
        ativo=True,
    )
    db_session.add(shopping)
    db_session.commit()

    piso = Piso(
        shopping_id=shopping.id,
        nome="Piso 1",
        nivel=1,
        largura_metros=100.0,
        altura_metros=60.0,
        ativo=True,
    )
    db_session.add(piso)
    db_session.commit()

    n1 = No(piso_id=piso.id, coord_x=0.1, coord_y=0.5, tipo="entrada", nome="Entrada", ativo=True)
    n2 = No(piso_id=piso.id, coord_x=0.3, coord_y=0.5, tipo="corredor", nome="Corredor A", ativo=True)
    n3 = No(piso_id=piso.id, coord_x=0.5, coord_y=0.3, tipo="corredor", nome="Corredor Norte", ativo=True)
    n4 = No(piso_id=piso.id, coord_x=0.5, coord_y=0.7, tipo="corredor", nome="Corredor Sul", ativo=True)
    n5 = No(piso_id=piso.id, coord_x=0.7, coord_y=0.5, tipo="loja", nome="Loja Destino", ativo=True)

    db_session.add_all([n1, n2, n3, n4, n5])
    db_session.commit()

    categoria = Categoria(nome="Vestuário", icone="shirt")
    db_session.add(categoria)
    db_session.commit()

    loja = Loja(
        no_id=n5.id,
        nome="Loja Destino",
        descricao="Loja de roupas",
        categoria_id=categoria.id,
        ativo=True,
    )
    db_session.add(loja)

    qr = QRCode(no_id=n1.id, token="QR-TEST-ENTRADA", ativo=True)
    db_session.add(qr)
    db_session.commit()

    def calc_dist(a, b):
        dx = (float(a.coord_x) - float(b.coord_x)) * float(piso.largura_metros)
        dy = (float(a.coord_y) - float(b.coord_y)) * float(piso.altura_metros)
        return (dx**2 + dy**2) ** 0.5

    e1 = Aresta(no_origem_id=n1.id, no_destino_id=n2.id, distancia=calc_dist(n1, n2), bidirecional=True, acessivel=True, ativa=True)
    e2 = Aresta(no_origem_id=n2.id, no_destino_id=n3.id, distancia=calc_dist(n2, n3), bidirecional=True, acessivel=True, ativa=True)
    e3 = Aresta(no_origem_id=n2.id, no_destino_id=n4.id, distancia=calc_dist(n2, n4), bidirecional=True, acessivel=False, ativa=True)
    e4 = Aresta(no_origem_id=n3.id, no_destino_id=n5.id, distancia=calc_dist(n3, n5), bidirecional=True, acessivel=True, ativa=True)
    e5 = Aresta(no_origem_id=n4.id, no_destino_id=n5.id, distancia=calc_dist(n4, n5), bidirecional=True, acessivel=True, ativa=True)
    e_inativa = Aresta(no_origem_id=n1.id, no_destino_id=n5.id, distancia=calc_dist(n1, n5), bidirecional=True, acessivel=True, ativa=False)

    db_session.add_all([e1, e2, e3, e4, e5, e_inativa])
    db_session.commit()

    return {
        "shopping": shopping,
        "piso": piso,
        "nodes": {"n1": n1, "n2": n2, "n3": n3, "n4": n4, "n5": n5},
        "edges": [e1, e2, e3, e4, e5, e_inativa],
        "loja": loja,
        "qr": qr,
    }
