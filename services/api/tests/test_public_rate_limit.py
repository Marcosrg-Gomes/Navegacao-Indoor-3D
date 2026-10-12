from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace

import pytest
from app.models import Diagnostico
from app.routers import public
from app.schemas.rota import RotaRequest
from app.services import diagnostics
from app.services.diagnostics import SlidingWindowRateLimiter
from fastapi import HTTPException


def route_request(sample_data):
    return RotaRequest(
        origem_no_id=sample_data["nodes"]["n1"].id,
        destino_no_id=sample_data["nodes"]["n5"].id,
    )


def connection_request(host="testclient", forwarded_for=None):
    headers = {} if forwarded_for is None else {"X-Forwarded-For": forwarded_for}
    return SimpleNamespace(client=SimpleNamespace(host=host), headers=headers)


def calculate_route(db_session, sample_data, request=None):
    return public.calcular_rota(
        route_request(sample_data), request or connection_request(), db_session
    )


def calculate_distances(db_session, sample_data, request=None):
    return public.distancias_da_origem(
        request or connection_request(), sample_data["nodes"]["n1"].id, False, db_session
    )


def test_rotas_aceitam_cota_e_rejeitam_excesso_com_retry_after(
    db_session, sample_data, monkeypatch
):
    moments = iter((0, 0, 0.1))
    monkeypatch.setattr(diagnostics, "monotonic", lambda: next(moments))
    monkeypatch.setattr(public, "routes_rate_limiter", SlidingWindowRateLimiter(2, 60))

    assert calculate_route(db_session, sample_data)["sucesso"] is True
    assert calculate_route(db_session, sample_data)["sucesso"] is True
    with pytest.raises(HTTPException) as exc_info:
        calculate_route(db_session, sample_data)

    assert exc_info.value.status_code == 429
    assert exc_info.value.headers["Retry-After"] == "60"


def test_http_rota_preserva_contrato_e_rejeicao_antecipa_processamento(
    client, db_session, sample_data, monkeypatch
):
    moments = iter((0, 0.1))
    monkeypatch.setattr(diagnostics, "monotonic", lambda: next(moments))
    monkeypatch.setattr(public, "routes_rate_limiter", SlidingWindowRateLimiter(1, 60))

    success = client.post(
        "/api/routes",
        json={
            "origem_no_id": sample_data["nodes"]["n1"].id,
            "destino_no_id": sample_data["nodes"]["n5"].id,
        },
    )

    assert success.status_code == 200
    assert {"sucesso", "nos", "distancia_total_metros", "instrucoes", "revisao"} <= set(
        success.json()
    )

    def should_not_run(*args, **kwargs):
        pytest.fail("processamento de rota não deveria executar após 429")

    monkeypatch.setattr(public, "NavigationEngine", should_not_run)
    monkeypatch.setattr(public, "navigation_state", should_not_run)
    monkeypatch.setattr(public, "record_failure", should_not_run)

    rejected = client.post(
        "/api/routes",
        json={
            "origem_no_id": sample_data["nodes"]["n1"].id,
            "destino_no_id": sample_data["nodes"]["n5"].id,
        },
    )

    assert rejected.status_code == 429
    assert rejected.headers["Retry-After"] == "60"
    assert db_session.query(Diagnostico).count() == 0


def test_http_distancias_possuem_bucket_independente(client, sample_data, monkeypatch):
    monkeypatch.setattr(diagnostics, "monotonic", lambda: 0)
    monkeypatch.setattr(public, "routes_rate_limiter", SlidingWindowRateLimiter(1, 60))
    monkeypatch.setattr(public, "route_distances_rate_limiter", SlidingWindowRateLimiter(1, 60))
    route = {
        "origem_no_id": sample_data["nodes"]["n1"].id,
        "destino_no_id": sample_data["nodes"]["n5"].id,
    }

    assert client.post("/api/routes", json=route).status_code == 200
    assert client.post("/api/routes", json=route).status_code == 429

    distances = client.get(
        "/api/routes/distances",
        params={"origem_no_id": sample_data["nodes"]["n1"].id},
    )
    rejected = client.get(
        "/api/routes/distances",
        params={"origem_no_id": sample_data["nodes"]["n1"].id},
    )

    assert distances.status_code == 200
    assert str(sample_data["nodes"]["n1"].id) in distances.json()
    assert rejected.status_code == 429
    assert rejected.headers["Retry-After"] == "60"


def test_limite_de_rota_expira_e_fluxo_normal_de_distancias_permanece_compativel(
    db_session, sample_data, monkeypatch
):
    moments = iter((0, 60, 60))
    monkeypatch.setattr(diagnostics, "monotonic", lambda: next(moments))
    monkeypatch.setattr(public, "routes_rate_limiter", SlidingWindowRateLimiter(1, 60))
    monkeypatch.setattr(public, "route_distances_rate_limiter", SlidingWindowRateLimiter(1, 60))

    assert calculate_route(db_session, sample_data)["sucesso"] is True
    assert calculate_route(db_session, sample_data)["sucesso"] is True
    response = calculate_distances(db_session, sample_data)

    assert sample_data["nodes"]["n1"].id in response


def test_limites_de_rota_e_distancias_sao_independentes(
    db_session, sample_data, monkeypatch
):
    monkeypatch.setattr(diagnostics, "monotonic", lambda: 0)
    monkeypatch.setattr(public, "routes_rate_limiter", SlidingWindowRateLimiter(1, 60))
    monkeypatch.setattr(public, "route_distances_rate_limiter", SlidingWindowRateLimiter(1, 60))

    assert calculate_route(db_session, sample_data)["sucesso"] is True
    with pytest.raises(HTTPException, match="Limite de requisições"):
        calculate_route(db_session, sample_data)
    assert sample_data["nodes"]["n1"].id in calculate_distances(db_session, sample_data)


def test_ip_da_conexao_isola_cota_e_cabecalho_encaminhado_nao_a_contorna(monkeypatch):
    monkeypatch.setattr(diagnostics, "monotonic", lambda: 0)
    limiter = SlidingWindowRateLimiter(1, 60)
    first_request = connection_request("198.51.100.10", "203.0.113.1")
    forwarded_changed = connection_request("198.51.100.10", "203.0.113.2")
    other_client = connection_request("198.51.100.11", "203.0.113.1")

    assert public.enforce_rate_limit(first_request, limiter) is None
    with pytest.raises(HTTPException) as exc_info:
        public.enforce_rate_limit(forwarded_changed, limiter)
    assert exc_info.value.status_code == 429
    assert public.enforce_rate_limit(other_client, limiter) is None


def test_limitador_nao_ultrapassa_cota_em_requisicoes_simultaneas(monkeypatch):
    monkeypatch.setattr(diagnostics, "monotonic", lambda: 0)
    limiter = SlidingWindowRateLimiter(5, 60)

    with ThreadPoolExecutor(max_workers=20) as executor:
        accepted = list(executor.map(lambda _: limiter.allow("cliente"), range(20)))

    assert sum(accepted) == 5


def test_rota_recusada_nao_calcula_nem_grava_no_banco(
    db_session, sample_data, monkeypatch
):
    monkeypatch.setattr(diagnostics, "monotonic", lambda: 0)
    monkeypatch.setattr(public, "routes_rate_limiter", SlidingWindowRateLimiter(1, 60))

    assert calculate_route(db_session, sample_data)["sucesso"] is True

    def should_not_run(*args, **kwargs):
        pytest.fail("processamento de rota não deveria executar após 429")

    monkeypatch.setattr(public, "NavigationEngine", should_not_run)
    monkeypatch.setattr(public, "navigation_state", should_not_run)
    monkeypatch.setattr(public, "record_failure", should_not_run)

    with pytest.raises(HTTPException) as exc_info:
        calculate_route(db_session, sample_data)

    assert exc_info.value.status_code == 429
    assert db_session.query(Diagnostico).count() == 0


def test_distancias_recusadas_nao_instanciam_motor_nem_gravam_no_banco(
    db_session, sample_data, monkeypatch
):
    monkeypatch.setattr(diagnostics, "monotonic", lambda: 0)
    monkeypatch.setattr(
        public, "route_distances_rate_limiter", SlidingWindowRateLimiter(1, 60)
    )

    assert sample_data["nodes"]["n1"].id in calculate_distances(db_session, sample_data)

    def should_not_run(*args, **kwargs):
        pytest.fail("motor de navegação não deveria executar após 429")

    monkeypatch.setattr(public, "NavigationEngine", should_not_run)

    with pytest.raises(HTTPException) as exc_info:
        calculate_distances(db_session, sample_data)

    assert exc_info.value.status_code == 429
    assert db_session.query(Diagnostico).count() == 0
