import pytest
from app.config import get_settings
from app.models import Auditoria, Diagnostico, No, Piso
from sqlalchemy import event


def test_mutacao_exige_motivo_e_identifica_credencial(client, sample_data, monkeypatch):
    key = "chave-nomeada-para-teste"
    monkeypatch.setattr(get_settings(), "ADMIN_API_KEYS", {"operador_teste": key})
    url = f"/api/admin/edges/{sample_data['edges'][0].id}"
    headers = {"X-API-Key": key}
    assert client.put(url, headers=headers, json={"ativa": False}).status_code == 422
    assert client.get("/api/admin/audit", headers=headers).json() == []
    headers["X-Audit-Reason"] = "Interdicao para manutencao"
    assert client.put(url, headers=headers, json={"ativa": False}).status_code == 200
    entry, = client.get("/api/admin/audit", headers=headers).json()
    assert entry["usuario"] == "operador_teste"
    assert entry["motivo"] == headers["X-Audit-Reason"]
    assert entry["antes"]["ativa"] is True
    assert entry["depois"]["ativa"] is False
    assert entry["criado_em"].endswith("+00:00")
    assert key not in str(entry)
    assert client.get("/api/admin/session", headers=headers).json()["usuario"] == "operador_teste"


def test_historico_restaura_e_recusa_conflito(client, api_key_header, sample_data):
    edge = sample_data["edges"][0]
    url = f"/api/admin/edges/{edge.id}"
    assert client.put(url, headers=api_key_header, json={"ativa": False}).status_code == 200
    entry = client.get("/api/admin/audit", headers=api_key_header).json()[0]
    assert client.post(f"/api/admin/audit/{entry['id']}/restore", headers=api_key_header).status_code == 200
    assert client.get(url, headers=api_key_header).json()["ativa"] is True
    log = client.get("/api/admin/audit", headers=api_key_header).json()
    assert log[0]["acao"] == "restaurar"
    assert client.post(f"/api/admin/audit/{entry['id']}/restore", headers=api_key_header).status_code == 409


def test_auditoria_atomica_com_mutacao(client, db_session, api_key_header, sample_data):
    original = sample_data["edges"][0].id

    def fail_audit(mapper, connection, target):
        raise RuntimeError("Falha simulada na auditoria")

    event.listen(Auditoria, "before_insert", fail_audit)
    try:
        with pytest.raises(RuntimeError, match="Falha simulada"):
            client.put(f"/api/admin/edges/{original}", headers=api_key_header, json={"ativa": False})
    finally:
        event.remove(Auditoria, "before_insert", fail_audit)
        db_session.rollback()
    assert db_session.get(type(sample_data["edges"][0]), original).ativa is True
    assert db_session.query(Auditoria).count() == 0


def test_qr_token_nao_vaza_no_historico(client, api_key_header, sample_data):
    qr = sample_data["qr"]
    assert client.put(f"/api/admin/qr-codes/{qr.id}", headers=api_key_header, json={"token": "TOKEN-ALTERADO"}).status_code == 200
    log = client.get("/api/admin/audit", headers=api_key_header).text
    assert "TOKEN-ALTERADO" not in log
    assert "QR-TEST-ENTRADA" not in log


def test_revisao_muda_ao_bloquear_inclusive_fora_do_painel(client, db_session, sample_data):
    path = f"/api/shoppings/{sample_data['shopping'].id}/navigation-state"
    original = client.get(path).json()
    body = {"origem_no_id": sample_data["nodes"]["n1"].id, "destino_no_id": sample_data["nodes"]["n5"].id}
    assert client.post("/api/routes", json=body).json()["revisao"] == original["revisao"]
    sample_data["edges"][0].ativa = False
    db_session.commit()
    assert client.get(path).json()["revisao"] != original["revisao"]
    assert client.post("/api/routes", json=body).headers["X-Error-Code"] == "SEM_ROTA"


def test_destino_indisponivel_exige_confirmacao(client, api_key_header, sample_data):
    store = sample_data["loja"]
    body = {"origem_no_id": sample_data["nodes"]["n1"].id, "destino_no_id": store.no_id}
    assert client.put(f"/api/admin/stores/{store.id}", headers=api_key_header, json={"status_operacional": "fechado"}).status_code == 200
    assert client.post("/api/routes", json=body).status_code == 409
    assert client.post("/api/routes", json={**body, "confirmar_indisponivel": True}).status_code == 200
    assert client.put(f"/api/admin/stores/{store.id}", headers=api_key_header, json={"ativo": False}).status_code == 200
    assert client.post("/api/routes", json={**body, "confirmar_indisponivel": True}).status_code == 409


def test_qr_ativo_precisa_hierarquia_ativa(client, db_session, api_key_header, sample_data):
    sample_data["piso"].ativo = False
    db_session.commit()
    assert client.post("/api/admin/qr-codes", headers=api_key_header, json={"no_id": sample_data["nodes"]["n2"].id}).status_code == 400
    assert client.get("/api/qr-codes/QR-TEST-ENTRADA").status_code == 404


def test_conectores_entre_pisos_precisam_ser_compativeis(client, db_session, api_key_header, sample_data):
    floor = Piso(shopping_id=sample_data["shopping"].id, nome="Superior", nivel=2, largura_metros=100, altura_metros=60, ativo=True)
    db_session.add(floor)
    db_session.flush()
    source = sample_data["nodes"]["n2"]
    source.tipo = "escada"
    target = No(piso_id=floor.id, coord_x=.3, coord_y=.5, tipo="elevador", ativo=True)
    db_session.add(target)
    db_session.commit()
    response = client.post("/api/admin/edges", headers=api_key_header, json={"no_origem_id": source.id, "no_destino_id": target.id, "distancia": 5})
    assert response.status_code == 400


def test_diagnosticos_agregados_sem_dados_do_visitante(client, db_session, api_key_header):
    event = {"tipo": "mapa_3d", "codigo": "timeout"}
    for _ in range(2):
        assert client.post("/api/diagnostics/events", json=event).status_code == 204
    assert client.post("/api/diagnostics/events", json={**event, "token": "SEGREDO"}).status_code == 422
    assert client.post("/api/diagnostics/events", json={"tipo": "inventado", "codigo": "timeout"}).status_code == 422
    assert db_session.query(Diagnostico).count() == 1
    assert client.get("/api/admin/diagnostics").status_code == 403
    row, = client.get("/api/admin/diagnostics", headers=api_key_header).json()
    assert row["ocorrencias"] == 2
    assert set(row) == {"tipo", "codigo", "ocorrencias", "atualizado_em"}
