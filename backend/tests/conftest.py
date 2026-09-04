import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from app.main import app
from app.database import Base, get_db
from app.config import get_settings
from app.models import Shopping, Piso, No, Aresta, PontoInteresse, QRCode

# Use SQLite in-memory for tests
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
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def api_key_header():
    settings = get_settings()
    return {"X-API-Key": settings.ADMIN_API_KEY}

@pytest.fixture
def sample_data(db_session):
    shopping = Shopping(nome="Shopping Teste", logradouro="Rua Teste", numero="123", cidade="Teste", uf="TS")
    db_session.add(shopping)
    db_session.commit()
    
    piso = Piso(shopping_id=shopping.id, nome="Piso 1", nivel=1, planta_url="", largura_metros=100.0, comprimento_metros=60.0)
    db_session.add(piso)
    db_session.commit()
    
    n1 = No(piso_id=piso.id, coord_x=0.1, coord_y=0.5, tipo="entrada", nome="Entrada", ativo=True)
    n2 = No(piso_id=piso.id, coord_x=0.3, coord_y=0.5, tipo="corredor", nome="Corredor A", ativo=True)
    n3 = No(piso_id=piso.id, coord_x=0.5, coord_y=0.3, tipo="corredor", nome="Corredor Norte", ativo=True)
    n4 = No(piso_id=piso.id, coord_x=0.5, coord_y=0.7, tipo="corredor", nome="Corredor Sul", ativo=True)
    n5 = No(piso_id=piso.id, coord_x=0.7, coord_y=0.5, tipo="loja", nome="Loja Destino", ativo=True)
    
    db_session.add_all([n1, n2, n3, n4, n5])
    db_session.commit()
    
    poi = PontoInteresse(no_id=n5.id, nome="Loja Destino", descricao="Loja de roupas", categoria="Vestuário", palavras_chave="roupa, camisa", ativo=True)
    db_session.add(poi)
    
    token = str(uuid.uuid4())
    qr = QRCode(no_id=n1.id, token=token, descricao="QR Code Entrada", ativo=True)
    db_session.add(qr)
    db_session.commit()
    
    def calc_dist(a, b):
        dx = (a.coord_x - b.coord_x) * piso.largura_metros
        dy = (a.coord_y - b.coord_y) * piso.comprimento_metros
        return (dx**2 + dy**2)**0.5
        
    e1 = Aresta(origem_id=n1.id, destino_id=n2.id, distancia_metros=calc_dist(n1, n2), bidirecional=True, acessivel=True, ativo=True)
    e2 = Aresta(origem_id=n2.id, destino_id=n3.id, distancia_metros=calc_dist(n2, n3), bidirecional=True, acessivel=True, ativo=True)
    e3 = Aresta(origem_id=n2.id, destino_id=n4.id, distancia_metros=calc_dist(n2, n4), bidirecional=True, acessivel=False, ativo=True)
    e4 = Aresta(origem_id=n3.id, destino_id=n5.id, distancia_metros=calc_dist(n3, n5), bidirecional=True, acessivel=True, ativo=True)
    e5 = Aresta(origem_id=n4.id, destino_id=n5.id, distancia_metros=calc_dist(n4, n5), bidirecional=True, acessivel=True, ativo=True)
    e_inativa = Aresta(origem_id=n1.id, destino_id=n5.id, distancia_metros=calc_dist(n1, n5), bidirecional=True, acessivel=True, ativo=False)
    
    db_session.add_all([e1, e2, e3, e4, e5, e_inativa])
    db_session.commit()
    
    return {
        "shopping": shopping,
        "piso": piso,
        "nodes": {"n1": n1, "n2": n2, "n3": n3, "n4": n4, "n5": n5},
        "edges": [e1, e2, e3, e4, e5, e_inativa],
        "poi": poi,
        "qr": qr
    }
