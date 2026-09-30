from datetime import datetime, timezone

from app.models import Aresta, No, Piso
from app.services.navigation import NavigationEngine
from app.services.opening_hours import opening_summary


def test_reference_uses_corridor_connection_not_proximity_through_wall(db_session, sample_data):
    corridor = sample_data["nodes"]["n2"]
    linked = No(piso_id=corridor.piso_id, coord_x=.31, coord_y=.5, tipo="loja", nome="Referência conectada", ativo=True)
    isolated = No(piso_id=corridor.piso_id, coord_x=.3, coord_y=.5, tipo="loja", nome="Atrás da parede", ativo=True)
    db_session.add_all([linked, isolated]); db_session.flush()
    edge = Aresta(no_origem_id=corridor.id, no_destino_id=linked.id, distancia=3, bidirecional=True, acessivel=True, ativa=True)
    db_session.add(edge); db_session.commit()
    engine = NavigationEngine(db_session)
    route = engine.calcular_rota(sample_data["nodes"]["n1"].id, sample_data["nodes"]["n5"].id)
    references = [step.get("referencia_no_id") for step in route["etapas"]]
    assert linked.id in references
    assert isolated.id not in references
    assert abs(sum(step["distancia_metros"] for step in route["etapas"]) - route["distancia_total_metros"]) < .2
    assert route["resumo"]["elevadores"] == 0
    assert route["resumo"]["escadas"] == 0
    edge.ativa = False; db_session.commit()
    changed = engine.calcular_rota(sample_data["nodes"]["n1"].id, sample_data["nodes"]["n5"].id)
    assert linked.id not in [step.get("referencia_no_id") for step in changed["etapas"]]


def test_daily_hours_respect_midnight_zone_and_manual_status():
    schedule = "Diariamente 10:00-22:00 [UTC]"
    assert opening_summary("aberto", schedule, datetime(2026, 9, 28, 21, 45, tzinfo=timezone.utc)) == "Fecha em 15 min"
    assert opening_summary("aberto", schedule, datetime(2026, 9, 28, 9, 0, tzinfo=timezone.utc)) == "Horário cadastrado: abre às 10:00"
    assert opening_summary("fechado", schedule) == "Fechado pelo estabelecimento"
    assert opening_summary("manutencao", schedule) == "Em manutenção"
    overnight = "Diariamente 22:00-02:00 [UTC]"
    assert opening_summary("aberto", overnight, datetime(2026, 9, 28, 1, 45, tzinfo=timezone.utc)) == "Fecha em 15 min"


def test_ambiguous_hours_and_invalid_zone_are_not_invented():
    for schedule in [None, "Seg a sex 10h às 22h", "10-22", "Diariamente 29:00-22:00 [UTC]", "Diariamente 10:00-22:00 [Not/AZone]"]:
        assert opening_summary("aberto", schedule) is None

def test_scheduled_closure_requires_confirmation(client, db_session, sample_data, monkeypatch):
    from app.services import opening_hours
    monkeypatch.setattr(opening_hours, "opening_summary", lambda *args: "Horário cadastrado: abre às 10:00")
    store = sample_data["loja"]
    store.horario_funcionamento = "Diariamente 10:00-22:00 [UTC]"
    db_session.commit()
    detail = client.get(f"/api/pois/{store.id}").json()
    assert detail["aberto_agora"] is False
    body = {"origem_no_id": sample_data["nodes"]["n1"].id, "destino_no_id": store.no_id}
    assert client.post("/api/routes", json=body).status_code == 409
    assert client.post("/api/routes", json={**body, "confirmar_indisponivel": True}).status_code == 200


def test_floor_connections_follow_direction_and_operational_state(client, db_session, sample_data):
    lower = sample_data["nodes"]["n2"]
    lower.tipo = "elevador"
    upper_floor = Piso(shopping_id=sample_data["shopping"].id, nome="Superior", nivel=2, largura_metros=100, altura_metros=60, ativo=True)
    db_session.add(upper_floor); db_session.flush()
    upper = No(piso_id=upper_floor.id, coord_x=.3, coord_y=.5, tipo="elevador", nome="Elevador superior", ativo=True)
    db_session.add(upper); db_session.flush()
    edge = Aresta(no_origem_id=lower.id, no_destino_id=upper.id, distancia=5, bidirecional=False, acessivel=True, ativa=True)
    db_session.add(edge); db_session.commit()
    def connections(floor):
        return client.get(f"/api/floors/{floor}/graph").json()["conexoes_entre_pisos"]
    assert connections(lower.piso_id)[str(lower.id)] == [upper.id]
    assert connections(upper.piso_id)[str(upper.id)] == []
    edge.ativa = False; db_session.commit()
    assert connections(lower.piso_id)[str(lower.id)] == []
    edge.ativa = True; upper_floor.ativo = False; db_session.commit()
    assert connections(lower.piso_id)[str(lower.id)] == []
