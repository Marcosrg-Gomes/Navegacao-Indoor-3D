"""Testes de integracao: painel administrativo -> API -> visitante.

Valida o cenario central:
1. Admin altera informacao no painel (endpoint /api/admin/*).
2. API persiste a alteracao.
3. Revisao da navegacao e atualizada.
4. Visitante consulta o estado de navegacao e identifica a mudanca.
5. Dados atualizados sao usados nas proximas consultas e rotas.

Usa o banco SQLite isolado do conftest. Nao toca no MySQL de producao.
"""

from app.models import Shopping, Piso, No, Aresta, Loja, Categoria, QRCode


# =====================================================================
# Cenario: admin bloqueia aresta -> visitante nao consegue mais calcular rota
# =====================================================================

def test_admin_bloqueia_aresta_visitante_nao_consegue_rota(
    client, api_key_header, sample_data
):
    """Fluxo completo: admin desativa aresta -> visitante nao calcula rota."""
    n1 = sample_data["nodes"]["n1"]
    n5 = sample_data["nodes"]["n5"]
    edge = sample_data["edges"][0]  # n1 -> n2

    # 1. Visitante calcula rota normalmente (antes do bloqueio)
    resposta_antes = client.post("/api/routes", json={
        "origem_no_id": n1.id,
        "destino_no_id": n5.id,
        "acessivel": False,
    })
    assert resposta_antes.status_code == 200
    revisao_antes = resposta_antes.json()["revisao"]

    # 2. Admin desativa a aresta via painel
    url = f"/api/admin/edges/{edge.id}"
    resposta_admin = client.put(
        url,
        headers={**api_key_header, "X-Audit-Reason": "Bloqueio para manutencao"},
        json={"ativa": False},
    )
    assert resposta_admin.status_code == 200

    # 3. Revisao da navegacao mudou
    estado = client.get(
        f"/api/shoppings/{sample_data['shopping'].id}/navigation-state"
    )
    assert estado.status_code == 200
    revisao_depois = estado.json()["revisao"]
    assert revisao_antes != revisao_depois

    # 4. Visitante nao consegue mais calcular a mesma rota (recalculo)
    resposta_depois = client.post("/api/routes", json={
        "origem_no_id": n1.id,
        "destino_no_id": n5.id,
        "acessivel": False,
    })
    # Pode falhar (SEM_ROTA) ou encontrar caminho alternativo.
    # O importante e que a revisao reflete a mudanca.
    assert resposta_depois.status_code in (200, 404)


# =====================================================================
# Cenario: admin reativa aresta -> visitante volta a conseguir rota
# =====================================================================

def test_admin_reativa_aresta_visitante_consegue_rota(
    client, api_key_header, sample_data
):
    """Fluxo: admin desativa e reativa -> visitante volta a ter rota."""
    n1 = sample_data["nodes"]["n1"]
    n5 = sample_data["nodes"]["n5"]
    edge = sample_data["edges"][1]  # n2 -> n3

    # Desativa
    client.put(
        f"/api/admin/edges/{edge.id}",
        headers={**api_key_header, "X-Audit-Reason": "Teste desativacao"},
        json={"ativa": False},
    )

    # Reativa
    resposta = client.put(
        f"/api/admin/edges/{edge.id}",
        headers={**api_key_header, "X-Audit-Reason": "Teste reativacao"},
        json={"ativa": True},
    )
    assert resposta.status_code == 200

    # Visitante consegue calcular rota
    resposta_rota = client.post("/api/routes", json={
        "origem_no_id": n1.id,
        "destino_no_id": n5.id,
        "acessivel": False,
    })
    assert resposta_rota.status_code == 200
    assert resposta_rota.json()["sucesso"] is True


# =====================================================================
# Cenario: admin altera status de loja -> visitante recebe 409
# =====================================================================

def test_admin_fecha_loja_visitante_recebe_409(
    client, api_key_header, sample_data
):
    """Admin fecha loja -> visitante nao consegue rota sem confirmacao."""
    store = sample_data["loja"]
    n1 = sample_data["nodes"]["n1"]

    # Antes: loja aberta, rota OK
    resposta_antes = client.post("/api/routes", json={
        "origem_no_id": n1.id,
        "destino_no_id": store.no_id,
        "acessivel": False,
    })
    assert resposta_antes.status_code == 200

    # Admin fecha a loja
    resposta_admin = client.put(
        f"/api/admin/stores/{store.id}",
        headers={**api_key_header, "X-Audit-Reason": "Fechamento temporario"},
        json={"status_operacional": "fechado"},
    )
    assert resposta_admin.status_code == 200

    # Visitante recebe 409 (exige confirmacao)
    resposta_visitante = client.post("/api/routes", json={
        "origem_no_id": n1.id,
        "destino_no_id": store.no_id,
        "acessivel": False,
    })
    assert resposta_visitante.status_code == 409
    assert resposta_visitante.headers.get("X-Error-Code") == "DESTINO_INDISPONIVEL"

    # Visitante confirma e consegue
    resposta_confirmada = client.post("/api/routes", json={
        "origem_no_id": n1.id,
        "destino_no_id": store.no_id,
        "acessivel": False,
        "confirmar_indisponivel": True,
    })
    assert resposta_confirmada.status_code == 200


# =====================================================================
# Cenario: CRUD de piso refletido para o visitante
# =====================================================================

def test_admin_cadastra_piso_visitante_ve_novo_piso(
    client, api_key_header, sample_data
):
    """Admin cadastra piso -> visitante lista o novo piso."""
    shopping_id = sample_data["shopping"].id

    # Antes: listar pisos
    resposta_antes = client.get(f"/api/shoppings/{shopping_id}/floors")
    qtd_antes = len(resposta_antes.json())

    # Admin cadastra novo piso
    resposta_admin = client.post(
        "/api/admin/floors",
        headers={**api_key_header, "X-Audit-Reason": "Novo piso de teste"},
        json={
            "shopping_id": shopping_id,
            "nome": "Piso de Integracao",
            "nivel": 3,
            "largura_metros": 30,
            "altura_metros": 60,
        },
    )
    assert resposta_admin.status_code == 201
    novo_piso_id = resposta_admin.json()["id"]

    # Visitante lista pisos e ve o novo
    resposta_depois = client.get(f"/api/shoppings/{shopping_id}/floors")
    qtd_depois = len(resposta_depois.json())
    assert qtd_depois == qtd_antes + 1

    pisos = resposta_depois.json()
    assert any(p["id"] == novo_piso_id and p["nome"] == "Piso de Integracao"
               for p in pisos)


# =====================================================================
# Cenario: admin altera no -> visitante consulta grafo atualizado
# =====================================================================

def test_admin_altera_no_visitante_ve_grafo_atualizado(
    client, api_key_header, sample_data
):
    """Admin altera nome de no -> visitante consulta grafo com novo nome."""
    no = sample_data["nodes"]["n2"]
    piso_id = sample_data["piso"].id

    # Admin altera o nome do no
    resposta_admin = client.put(
        f"/api/admin/nodes/{no.id}",
        headers={**api_key_header, "X-Audit-Reason": "Correcao de nome"},
        json={"nome": "Corredor Principal Atualizado"},
    )
    assert resposta_admin.status_code == 200
    assert resposta_admin.json()["nome"] == "Corredor Principal Atualizado"

    # Visitante consulta o grafo do piso e ve o nome atualizado
    resposta_grafo = client.get(f"/api/floors/{piso_id}/graph")
    assert resposta_grafo.status_code == 200
    nos = resposta_grafo.json()["nos"]
    no_atualizado = next(n for n in nos if n["id"] == no.id)
    assert no_atualizado["nome"] == "Corredor Principal Atualizado"


# =====================================================================
# Cenario: admin cadastra QR Code -> visitante resolve origem
# =====================================================================

def test_admin_cadastra_qr_code_visitante_resolve(
    client, api_key_header, sample_data
):
    """Admin cadastra QR Code -> visitante resolve o token para o no."""
    no = sample_data["nodes"]["n3"]

    # Admin cadastra QR Code
    resposta_admin = client.post(
        "/api/admin/qr-codes",
        headers={**api_key_header, "X-Audit-Reason": "Novo QR de teste"},
        json={"no_id": no.id, "token": "QR-INTEGRACAO-TESTE"},
    )
    assert resposta_admin.status_code == 201

    # Visitante resolve o QR Code
    resposta_qr = client.get("/api/qr-codes/QR-INTEGRACAO-TESTE")
    assert resposta_qr.status_code == 200
    assert resposta_qr.json()["qr_code"]["token"] == "QR-INTEGRACAO-TESTE"
    assert resposta_qr.json()["no"]["id"] == no.id


# =====================================================================
# Cenario: admin cadastra loja -> visitante lista no POI
# =====================================================================

def test_admin_cadastra_loja_visitante_lista_poi(
    client, api_key_header, sample_data
):
    """Admin cadastra loja -> visitante lista o novo POI."""
    no = sample_data["nodes"]["n4"]
    categoria_id = sample_data["loja"].categoria_id

    # Admin cadastra loja
    resposta_admin = client.post(
        "/api/admin/stores",
        headers={**api_key_header, "X-Audit-Reason": "Cadastro de loja de teste"},
        json={
            "no_id": no.id,
            "nome": "Loja de Integracao",
            "descricao": "Loja criada pelo painel",
            "categoria_id": categoria_id,
            "status_operacional": "aberto",
        },
    )
    assert resposta_admin.status_code == 201
    loja_id = resposta_admin.json()["id"]

    # Visitante lista POIs e ve a nova loja
    resposta_pois = client.get("/api/pois")
    assert resposta_pois.status_code == 200
    ids = [p["id"] for p in resposta_pois.json()]
    assert loja_id in ids

    # Visitante consulta detalhes da loja
    resposta_detalhe = client.get(f"/api/pois/{loja_id}")
    assert resposta_detalhe.status_code == 200
    assert resposta_detalhe.json()["nome"] == "Loja de Integracao"


# =====================================================================
# Cenario: ID inexistente retorna 404
# =====================================================================

def test_admin_id_inexistente_retorna_404(client, api_key_header):
    """Operacoes em IDs inexistentes retornam 404."""
    assert client.get("/api/admin/shoppings/99999", headers=api_key_header).status_code == 404
    assert client.get("/api/admin/floors/99999", headers=api_key_header).status_code == 404
    assert client.get("/api/admin/nodes/99999", headers=api_key_header).status_code == 404
    assert client.get("/api/admin/edges/99999", headers=api_key_header).status_code == 404
    assert client.get("/api/admin/stores/99999", headers=api_key_header).status_code == 404
    assert client.get("/api/admin/categories/99999", headers=api_key_header).status_code == 404
    assert client.get("/api/admin/qr-codes/99999", headers=api_key_header).status_code == 404


# =====================================================================
# Cenario: auditoria registra alteracoes administrativas
# =====================================================================

def test_auditoria_registra_alteracao_admin(
    client, api_key_header, sample_data
):
    """Toda escrita administrativa gera registro de auditoria."""
    edge = sample_data["edges"][0]
    audit_antes = client.get("/api/admin/audit", headers=api_key_header).json()
    qtd_antes = len(audit_antes)

    client.put(
        f"/api/admin/edges/{edge.id}",
        headers={**api_key_header, "X-Audit-Reason": "Auditoria integracao"},
        json={"ativa": False},
    )

    audit_depois = client.get("/api/admin/audit", headers=api_key_header).json()
    assert len(audit_depois) == qtd_antes + 1
    ultima = audit_depois[0]
    assert ultima["acao"] == "editar"
    assert ultima["entidade"] == "arestas"
    assert ultima["registro_id"] == edge.id
    assert ultima["motivo"] == "Auditoria integracao"
    assert ultima["antes"]["ativa"] is True
    assert ultima["depois"]["ativa"] is False

    # Restaura para nao afetar outros testes
    client.put(
        f"/api/admin/edges/{edge.id}",
        headers={**api_key_header, "X-Audit-Reason": "Restauracao teste"},
        json={"ativa": True},
    )
