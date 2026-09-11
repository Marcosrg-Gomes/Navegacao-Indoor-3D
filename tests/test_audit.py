import io
import math
import statistics
import time

import pytest
from sqlalchemy import create_engine, text
from app.main import app
from app.models import Aresta, Categoria, Loja, No, Piso, QRCode, Shopping
from app.migrations import upgrade_schema
from app.services.navigation import NavigationEngine


def test_closed_maintenance_and_category_search(client, api_key_header, sample_data):
    store = sample_data["loja"]
    for status in ("fechado", "manutencao", "aberto"):
        response = client.put(f"/api/admin/stores/{store.id}", headers=api_key_header,
                              json={"status_operacional": status})
        assert response.status_code == 200
        public = client.get("/api/pois?q=vest&shopping_id=" + str(sample_data["shopping"].id)).json()
        assert len(public) == 1
        assert public[0]["status_operacional"] == status
        assert public[0]["categoria_nome"] == "Vestuário"


@pytest.mark.parametrize("field,value", [("nome", " "), ("categoria_id", None), ("status_operacional", None), ("status_operacional", "inexistente")])
def test_required_poi_fields(client, api_key_header, sample_data, field, value):
    body = {"nome": "Novo POI", "categoria_id": sample_data["loja"].categoria_id,
            "no_id": sample_data["nodes"]["n2"].id, "status_operacional": "aberto"}
    body[field] = value
    assert client.post("/api/admin/stores", headers=api_key_header, json=body).status_code == 422
    assert client.put(f"/api/admin/stores/{sample_data['loja'].id}", headers=api_key_header,
                      json={field: value}).status_code == 422


@pytest.mark.parametrize("value", [-0.000001, 1.000001, 500])
@pytest.mark.parametrize("coord", ["coord_x", "coord_y"])
def test_normalized_coordinates_create_update(client, api_key_header, sample_data, coord, value):
    data = {"piso_id": sample_data["piso"].id, "coord_x": .5, "coord_y": .5, "tipo": "corredor", coord: value}
    assert client.post("/api/admin/nodes", headers=api_key_header, json=data).status_code == 422
    assert client.put(f"/api/admin/nodes/{sample_data['nodes']['n2'].id}", headers=api_key_header,
                      json={coord: value}).status_code == 422


@pytest.mark.parametrize("path,field", [("nodes", "coord_x"), ("nodes", "tipo"), ("floors", "nome"),
                                       ("shoppings", "ativo"), ("edges", "ativa"), ("qr-codes", "no_id")])
def test_null_patches_never_corrupt_required_fields(client, api_key_header, path, field):
    assert client.put(f"/api/admin/{path}/1", headers=api_key_header, json={field: None}).status_code == 422


def test_block_reactivate_no_stale_graph(client, api_key_header, sample_data):
    request = {"origem_no_id": sample_data["nodes"]["n1"].id, "destino_no_id": sample_data["nodes"]["n5"].id}
    first = client.post("/api/routes", json=request).json()
    edge = sample_data["edges"][1]
    assert client.put(f"/api/admin/edges/{edge.id}", headers=api_key_header, json={"ativa": False}).status_code == 200
    blocked = client.post("/api/routes", json=request).json()
    assert first["nos"] != blocked["nos"]
    assert client.put(f"/api/admin/edges/{edge.id}", headers=api_key_header, json={"ativa": True}).status_code == 200
    assert client.post("/api/routes", json=request).json()["nos"] == first["nos"]


def test_inactive_intermediate_node_is_not_traversed(client, api_key_header, sample_data):
    request = {"origem_no_id": sample_data["nodes"]["n1"].id, "destino_no_id": sample_data["nodes"]["n5"].id}
    original = client.post("/api/routes", json=request)
    assert original.status_code == 200
    intermediate = original.json()["nos"][-2]["id"]
    url = f"/api/admin/nodes/{intermediate}"
    assert client.put(url, headers=api_key_header, json={"ativo": False}).status_code == 200
    alternative = client.post("/api/routes", json=request)
    assert alternative.status_code == 200
    assert intermediate not in [node["id"] for node in alternative.json()["nos"]]
    assert client.put(url, headers=api_key_header, json={"ativo": True}).status_code == 200
    assert client.post("/api/routes", json=request).json()["nos"] == original.json()["nos"]


def test_two_floors_stairs_elevator_accessibility(client, api_key_header, sample_data):
    def create(path, data):
        response = client.post("/api/admin/" + path, headers=api_key_header, json=data)
        assert response.status_code == 201, response.text
        return response.json()

    ground = sample_data["piso"].id
    upper = create("floors", {"shopping_id": sample_data["shopping"].id, "nome": "Piso superior", "nivel": 2})["id"]
    def node(floor, kind, x):
        return create("nodes", {"piso_id": floor, "tipo": kind, "coord_x": x, "coord_y": .2, "nome": kind})["id"]
    s0, s1 = node(ground, "escada", .8), node(upper, "escada", .8)
    e0, e1 = node(ground, "elevador", .9), node(upper, "elevador", .9)
    destination = node(upper, "loja", .5)
    start = sample_data["nodes"]["n1"].id
    for a, b, d in [(start, s0, 2), (s0, s1, 5), (s1, destination, 2),
                    (start, e0, 10), (e0, e1, 8), (e1, destination, 10)]:
        create("edges", {"no_origem_id": a, "no_destino_id": b, "distancia": d})
    request = {"origem_no_id": start, "destino_no_id": destination}
    regular = client.post("/api/routes", json=request).json()
    assert [n["id"] for n in regular["nos"]] == [start, s0, s1, destination]
    assert regular["distancia_total_metros"] == 9
    assert any("Piso superior" in step for step in regular["instrucoes"])
    accessible = client.post("/api/routes", json={**request, "acessivel": True}).json()
    assert [n["id"] for n in accessible["nos"]] == [start, e0, e1, destination]
    assert accessible["distancia_total_metros"] == 28
    reverse = client.post("/api/routes", json={"origem_no_id": destination, "destino_no_id": start}).json()
    assert any("Desça" in step for step in reverse["instrucoes"])
    validation = client.get(f"/api/admin/graph/validate?piso_id={upper}", headers=api_key_header).json()
    assert validation["valido"], validation
    # Arbitrary store-to-store cross-floor jumps are forbidden.
    assert client.post("/api/admin/edges", headers=api_key_header, json={"no_origem_id": start,
        "no_destino_id": destination, "distancia": 1}).status_code == 400


def test_distinct_malls_never_route(client, api_key_header, sample_data, db_session):
    mall = Shopping(nome="Outro shopping")
    db_session.add(mall); db_session.flush()
    floor = Piso(nome="Outro piso", shopping_id=mall.id, nivel=0)
    db_session.add(floor); db_session.flush()
    node = No(piso_id=floor.id, coord_x=.5, coord_y=.5, tipo="entrada")
    db_session.add(node); db_session.commit()
    source = sample_data["nodes"]["n1"].id
    request = {"origem_no_id": source, "destino_no_id": node.id}
    assert client.post("/api/routes", json=request).status_code == 400
    assert client.post("/api/admin/edges", headers=api_key_header,
        json={"no_origem_id": source, "no_destino_id": node.id, "distancia": 2}).status_code == 400


@pytest.mark.parametrize("hierarchy", ["shopping", "piso", "node"])
def test_inactive_hierarchy_not_public_or_navigable(client, db_session, sample_data, hierarchy):
    target = sample_data[hierarchy] if hierarchy != "node" else sample_data["nodes"]["n1"]
    target.ativo = False
    db_session.commit()
    assert client.get("/api/qr-codes/" + sample_data["qr"].token).status_code == 404
    assert client.post("/api/routes", json={"origem_no_id": sample_data["nodes"]["n1"].id,
        "destino_no_id": sample_data["nodes"]["n5"].id}).status_code == 404
    if hierarchy != "node":
        assert client.get(f"/api/floors/{sample_data['piso'].id}/graph").status_code == 404
        assert client.get("/api/pois").json() == []


def test_reference_deletions_and_qr_uniqueness(client, api_key_header, sample_data):
    n = sample_data["nodes"]["n1"].id
    assert client.delete(f"/api/admin/nodes/{n}", headers=api_key_header).status_code == 400
    assert client.delete(f"/api/admin/floors/{sample_data['piso'].id}", headers=api_key_header).status_code == 400
    assert client.delete(f"/api/admin/categories/{sample_data['loja'].categoria_id}", headers=api_key_header).status_code == 400
    assert client.post("/api/admin/qr-codes", headers=api_key_header, json={"no_id": n}).status_code == 409
    response = client.post("/api/admin/qr-codes", headers=api_key_header,
        json={"no_id": sample_data["nodes"]["n2"].id, "token": sample_data["qr"].token})
    assert response.status_code == 409


ADMIN_OPERATIONS = [(method, route.path.replace("{id}", "1")) for route in app.routes
                    if route.path.startswith("/api/admin/") for method in route.methods]


@pytest.mark.parametrize("method,path", ADMIN_OPERATIONS)
def test_every_admin_operation_requires_key(client, method, path):
    assert client.request(method, path).status_code == 403
    assert client.request(method, path, headers={"X-API-Key": "wrong"}).status_code == 403


def test_upload_malformed_and_script_rejected(client, api_key_header, sample_data):
    url = f"/api/admin/floors/{sample_data['piso'].id}/upload-planta"
    for name, data, mime in [("fake.png", b"not a PNG", "image/png"),
        ("script.svg", b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "image/svg+xml"),
        ("bad.svg", b"<invalid>", "image/svg+xml")]:
        assert client.post(url, headers=api_key_header, files={"file": (name, data, mime)}).status_code == 400


def test_spa_refresh_cors_and_static_remote_host(client, sample_data, api_key_header):
    for path in ("/admin/", "/admin/arestas", "/admin/nos"):
        response = client.get(path, headers={"Host": "192.168.1.10:8000"})
        assert response.status_code == 200
        assert 'id="root"' in response.text
    assert client.get("/admin/assets/missing.js").status_code == 404
    response = client.options("/api/admin/floors/1/upload-planta", headers={
        "Origin": "http://192.168.1.20:8081", "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "x-api-key,content-type"})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "*"
    assert client.get("/static/plantas/demo.svg", headers={"Host": "192.168.1.10:8000"}).status_code == 200


def test_upgrade_preserves_legacy_records():
    legacy = create_engine("sqlite:///:memory:")
    with legacy.begin() as connection:
        connection.execute(text("CREATE TABLE categorias (id INTEGER PRIMARY KEY, nome VARCHAR(100))"))
        connection.execute(text("CREATE TABLE lojas (id INTEGER PRIMARY KEY, nome TEXT, categoria_id INTEGER, ativo BOOLEAN)"))
        connection.execute(text("INSERT INTO lojas VALUES (1, 'Preservada', NULL, false)"))
    upgrade_schema(legacy)
    upgrade_schema(legacy)
    with legacy.connect() as connection:
        row = connection.execute(text("SELECT nome, categoria_id, status_operacional FROM lojas")).one()
        assert row.nome == "Preservada" and row.categoria_id is not None and row.status_operacional == "fechado"
        assert connection.execute(text("SELECT COUNT(*) FROM lojas")).scalar() == 1


def test_mvp_measured_latency(client, sample_data):
    route_times, graph_times = [], []
    for _ in range(30):
        start = time.perf_counter()
        graph = client.get(f"/api/floors/{sample_data['piso'].id}/graph")
        graph_times.append((time.perf_counter() - start) * 1000)
        assert graph.status_code == 200
        start = time.perf_counter()
        response = client.post("/api/routes", json={"origem_no_id": sample_data["nodes"]["n1"].id,
            "destino_no_id": sample_data["nodes"]["n5"].id})
        route_times.append((time.perf_counter() - start) * 1000)
        assert response.status_code == 200
    print(f"LATENCY graph_ms median={statistics.median(graph_times):.2f} max={max(graph_times):.2f}; "
          f"route_ms median={statistics.median(route_times):.2f} max={max(route_times):.2f}; 5 nodes/6 edges/30 requests")
    assert max(route_times) < 1000
    assert max(graph_times) < 3000
