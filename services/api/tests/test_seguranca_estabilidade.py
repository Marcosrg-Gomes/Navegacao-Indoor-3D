"""Testes de seguranca e estabilidade da API.

Complementam os testes existentes sem repetir o que ja esta coberto.
Foco: rate limit dentro da cota, expiracao da janela, protecao admin com
chave incorreta, dados malformados, e auditoria sem registros falsos.
Usa banco SQLite isolado do conftest. Nao toca no MySQL de producao.
"""

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers import public
from app.schemas.rota import RotaRequest
from app import services
from app.services import diagnostics
from app.services.diagnostics import SlidingWindowRateLimiter
from fastapi import HTTPException


# =====================================================================
# 1. RATE LIMITING - dentro da cota nao bloqueia
# =====================================================================

def test_rate_limit_dentro_da_cota_nao_bloqueia(
    db_session, sample_data, monkeypatch
):
    """Requisicoes normais dentro da cota nao sao rejeitadas."""
    moments = iter((0, 0.1, 0.2, 0.3, 0.4))
    monkeypatch.setattr(diagnostics, "monotonic", lambda: next(moments))
    monkeypatch.setattr(public, "routes_rate_limiter", SlidingWindowRateLimiter(10, 60))

    req = RotaRequest(
        origem_no_id=sample_data["nodes"]["n1"].id,
        destino_no_id=sample_data["nodes"]["n5"].id,
    )
    for _ in range(5):
        resultado = public.calcular_rota(
            req, SimpleNamespace(client=SimpleNamespace(host="cliente-a")), db_session
        )
        assert resultado["sucesso"] is True


# =====================================================================
# 2. RATE LIMITING - expira apos janela de tempo
# =====================================================================

def test_rate_limit_expira_apos_janela(
    db_session, sample_data, monkeypatch
):
    """Limite expira quando a janela de tempo se encerra."""
    # Tempos: 0 (req 1), 0 (req 2 - cota esgotada), 59 (rejeitado, ainda na janela),
    # 60 (janela expirou, funciona novamente)
    moments = iter((0, 0, 59, 60))
    monkeypatch.setattr(diagnostics, "monotonic", lambda: next(moments))
    monkeypatch.setattr(public, "routes_rate_limiter", SlidingWindowRateLimiter(2, 60))

    req = RotaRequest(
        origem_no_id=sample_data["nodes"]["n1"].id,
        destino_no_id=sample_data["nodes"]["n5"].id,
    )
    # Esgota a cota
    public.calcular_rota(req, SimpleNamespace(client=SimpleNamespace(host="c")), db_session)
    public.calcular_rota(req, SimpleNamespace(client=SimpleNamespace(host="c")), db_session)
    with pytest.raises(HTTPException) as exc_info:
        public.calcular_rota(req, SimpleNamespace(client=SimpleNamespace(host="c")), db_session)
    assert exc_info.value.status_code == 429

    # Apos a janela expirar, volta a funcionar
    public.calcular_rota(req, SimpleNamespace(client=SimpleNamespace(host="c")), db_session)


# =====================================================================
# 3. PROTECAO ADMIN - chave incorreta para leitura e escrita
# =====================================================================

def test_admin_chave_incorreta_leitura_escrita(client):
    """Todas as operacoes admin exigem chave valida."""
    # Leitura
    assert client.get("/api/admin/shoppings", headers={"X-API-Key": "chave-erro"}).status_code == 403
    assert client.get("/api/admin/audit", headers={"X-API-Key": "chave-erro"}).status_code == 403
    assert client.get("/api/admin/diagnostics", headers={"X-API-Key": "chave-erro"}).status_code == 403
    # Escrita
    assert client.put("/api/admin/edges/1", headers={"X-API-Key": "chave-erro"},
                      json={"ativa": False}).status_code == 403
    assert client.post("/api/admin/nodes", headers={"X-API-Key": "chave-erro"},
                       json={"piso_id": 1, "coord_x": 0.5, "coord_y": 0.5, "tipo": "corredor"}).status_code == 403


# =====================================================================
# 4. PROTECAO ADMIN - sem chave alguma
# =====================================================================

def test_admin_sem_chave_todos_endpoints(client):
    """Endpoints admin sem X-API-Key retornam 403."""
    assert client.get("/api/admin/shoppings").status_code == 403
    assert client.get("/api/admin/floors").status_code == 403
    assert client.get("/api/admin/nodes").status_code == 403
    assert client.get("/api/admin/edges").status_code == 403
    assert client.get("/api/admin/stores").status_code == 403
    assert client.get("/api/admin/categories").status_code == 403
    assert client.get("/api/admin/qr-codes").status_code == 403


# =====================================================================
# 5. DADOS MALFORMADOS - JSON invalido no body
# =====================================================================

def test_body_json_invalido_retorna_erro(client, api_key_header):
    """Body com JSON invalido nao causa erro 500, retorna 422/400."""
    response = client.post(
        "/api/admin/nodes",
        headers={**api_key_header, "Content-Type": "application/json"},
        content=b"{json invalido",
    )
    assert response.status_code in (400, 422)


# =====================================================================
# 6. AUDITORIA - falha nao produz registros falsos de sucesso
# =====================================================================

def test_auditoria_falha_nao_deixa_registro_de_sucesso(
    client, db_session, api_key_header, sample_data, monkeypatch
):
    """Se auditoria falha, mutacao eh revertida e nao ha registro de sucesso."""
    from sqlalchemy import event
    from app.models import Auditoria

    edge = sample_data["edges"][0]
    edge_id = edge.id

    def falha_auditoria(mapper, connection, target):
        raise RuntimeError("Falha simulada na auditoria")

    event.listen(Auditoria, "before_insert", falha_auditoria)
    try:
        with pytest.raises(RuntimeError, match="Falha simulada"):
            client.put(
                f"/api/admin/edges/{edge_id}",
                headers=api_key_header,
                json={"ativa": False},
            )
    finally:
        event.remove(Auditoria, "before_insert", falha_auditoria)
        db_session.rollback()

    # Dados nao foram alterados
    assert db_session.get(type(edge), edge_id).ativa is True
    # Nenhum registro de auditoria foi criado (rollback)
    assert db_session.query(Auditoria).count() == 0


# =====================================================================
# 7. ID INEXISTENTE EM ENDPOINT PUBLICO
# =====================================================================

def test_endpoint_publico_id_inexistente_retorna_404(client):
    """Endpoints publicos com ID inexistente retornam 404, nao 500."""
    assert client.get("/api/shoppings/99999").status_code == 404
    assert client.get("/api/pois/99999").status_code == 404
    assert client.get("/api/qr-codes/TOKEN-INEEXISTENTE").status_code == 404


# =====================================================================
# 8. RATE LIMITING - buckets de rotas e distancias sao independentes
# =====================================================================

def test_rate_limit_rotas_e_distancias_independentes(
    db_session, sample_data, monkeypatch
):
    """Exceder cota de rotas nao afeta cota de distancias."""
    moments = iter((0, 0, 0))
    monkeypatch.setattr(diagnostics, "monotonic", lambda: next(moments))
    monkeypatch.setattr(public, "routes_rate_limiter", SlidingWindowRateLimiter(1, 60))
    monkeypatch.setattr(public, "route_distances_rate_limiter", SlidingWindowRateLimiter(10, 60))

    req = RotaRequest(
        origem_no_id=sample_data["nodes"]["n1"].id,
        destino_no_id=sample_data["nodes"]["n5"].id,
    )
    # Esgota cota de rotas
    public.calcular_rota(req, SimpleNamespace(client=SimpleNamespace(host="d")), db_session)
    with pytest.raises(HTTPException) as exc_info:
        public.calcular_rota(req, SimpleNamespace(client=SimpleNamespace(host="d")), db_session)
    assert exc_info.value.status_code == 429

    # Distancias ainda funciona (bucket independente)
    distancias = public.distancias_da_origem(
        SimpleNamespace(client=SimpleNamespace(host="d")),
        sample_data["nodes"]["n1"].id,
        False,
        db_session,
    )
    assert sample_data["nodes"]["n1"].id in distancias
