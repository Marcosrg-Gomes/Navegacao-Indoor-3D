def test_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_listar_shoppings(client, sample_data):
    response = client.get("/api/shoppings")
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_shopping_inexistente(client):
    response = client.get("/api/shoppings/9999")
    assert response.status_code == 404

def test_listar_pisos(client, sample_data):
    shopping_id = sample_data["shopping"].id
    response = client.get(f"/api/shoppings/{shopping_id}/floors")
    assert response.status_code == 200

def test_grafo_piso(client, sample_data):
    piso_id = sample_data["piso"].id
    response = client.get(f"/api/floors/{piso_id}/graph")
    assert response.status_code == 200
    data = response.json()
    assert "nos" in data
    assert "arestas" in data

def test_calcular_rota(client, sample_data):
    n1_id = sample_data["nodes"]["n1"].id
    n5_id = sample_data["nodes"]["n5"].id
    response = client.post("/api/routes", json={
        "origem_no_id": n1_id,
        "destino_no_id": n5_id,
        "acessivel": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["sucesso"] is True
    assert data["rota"]["distancia_total_metros"] > 0
    assert len(data["rota"]["nos"]) >= 2
    assert len(data["rota"]["instrucoes"]) >= 1

def test_rota_no_inexistente(client):
    response = client.post("/api/routes", json={
        "origem_no_id": 9999,
        "destino_no_id": 9998,
        "acessivel": False
    })
    assert response.status_code == 404

def test_admin_sem_api_key(client):
    response = client.get("/api/admin/shoppings")
    assert response.status_code == 403

def test_admin_com_api_key(client, api_key_header, sample_data):
    response = client.get("/api/admin/shoppings", headers=api_key_header)
    assert response.status_code == 200

def test_admin_criar_no(client, api_key_header, sample_data):
    piso_id = sample_data["piso"].id
    response = client.post("/api/admin/nodes", headers=api_key_header, json={
        "piso_id": piso_id,
        "coord_x": 0.5,
        "coord_y": 0.5,
        "tipo": "corredor",
        "nome": "Novo Corredor"
    })
    assert response.status_code == 201

def test_buscar_pois(client, sample_data):
    response = client.get("/api/pois")
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_resolver_qr_code(client, sample_data):
    token = sample_data["qr"].token
    response = client.get(f"/api/qr-codes/{token}")
    assert response.status_code == 200
    assert response.json()["token"] == token
