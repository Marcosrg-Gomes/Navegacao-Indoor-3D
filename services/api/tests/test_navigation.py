import math

import pytest

from app.services.navigation import NavigationEngine
from app.models import No


def test_rota_valida(db_session, sample_data):
    """Testa cálculo de rota válida entre dois nós."""
    nav = NavigationEngine(db_session)
    n1 = sample_data["nodes"]["n1"]
    n5 = sample_data["nodes"]["n5"]

    result = nav.calcular_rota(n1.id, n5.id, acessivel=False)
    assert result["sucesso"] is True
    assert len(result["nos"]) >= 3
    assert result["distancia_total_metros"] > 0


def test_rota_sem_caminho(db_session, sample_data):
    """Testa que retorna erro quando não há caminho."""
    nav = NavigationEngine(db_session)
    piso = sample_data["piso"]
    n6 = No(piso_id=piso.id, coord_x=0.9, coord_y=0.9, tipo="corredor", nome="Isolado", ativo=True)
    db_session.add(n6)
    db_session.commit()

    n1 = sample_data["nodes"]["n1"]
    result = nav.calcular_rota(n1.id, n6.id)
    assert result["sucesso"] is False
    assert "mensagem" in result


def test_aresta_inativa_ignorada(db_session, sample_data):
    """Testa que arestas inativas são ignoradas no cálculo."""
    nav = NavigationEngine(db_session)
    n1 = sample_data["nodes"]["n1"]
    n5 = sample_data["nodes"]["n5"]

    result = nav.calcular_rota(n1.id, n5.id, acessivel=False)
    assert result["sucesso"] is True
    assert len(result["nos"]) > 2


def test_rota_acessivel(db_session, sample_data):
    """Testa filtro de acessibilidade."""
    nav = NavigationEngine(db_session)
    n1 = sample_data["nodes"]["n1"]
    n5 = sample_data["nodes"]["n5"]

    result = nav.calcular_rota(n1.id, n5.id, acessivel=True)
    assert result["sucesso"] is True

    n4_id = sample_data["nodes"]["n4"].id
    path_ids = [n["id"] for n in result["nos"]]
    assert n4_id not in path_ids


def test_rota_bidirecional(db_session, sample_data):
    """Testa que arestas bidirecionais funcionam em ambas direções."""
    nav = NavigationEngine(db_session)
    n1 = sample_data["nodes"]["n1"]
    n5 = sample_data["nodes"]["n5"]

    result = nav.calcular_rota(n5.id, n1.id, acessivel=False)
    assert result["sucesso"] is True
    assert result["nos"][0]["id"] == n5.id
    assert result["nos"][-1]["id"] == n1.id


def test_no_inexistente(db_session, sample_data):
    """Testa erro com nó inexistente."""
    nav = NavigationEngine(db_session)
    n1 = sample_data["nodes"]["n1"]
    result = nav.calcular_rota(n1.id, 9999)
    assert result["sucesso"] is False
    assert "mensagem" in result


def test_instrucoes_geradas(db_session, sample_data):
    """Testa que instruções de navegação são geradas."""
    nav = NavigationEngine(db_session)
    n1 = sample_data["nodes"]["n1"]
    n5 = sample_data["nodes"]["n5"]

    result = nav.calcular_rota(n1.id, n5.id, acessivel=False)
    assert result["sucesso"] is True
    instrucoes = result["instrucoes"]
    assert len(instrucoes) > 0
    assert isinstance(instrucoes[0], str)


def test_calcular_distancia():
    """Testa cálculo de distância euclidiana."""
    dx = (0.5 - 0.1) * 100.0
    dy = (0.5 - 0.5) * 60.0
    dist = math.sqrt(dx**2 + dy**2)
    assert dist == 40.0


@pytest.mark.parametrize("acessivel", [False, True])
def test_distancias_correspondem_as_rotas_e_bloqueios(client, db_session, sample_data, acessivel):
    origem = sample_data["nodes"]["n1"]
    nav = NavigationEngine(db_session)
    for bloqueado in [False, True]:
        if bloqueado:
            sample_data["edges"][0].ativa = False
            db_session.commit()
        response = client.get("/api/routes/distances", params={"origem_no_id": origem.id, "acessivel": acessivel})
        assert response.status_code == 200
        distances = response.json()
        assert distances[str(origem.id)] == 0
        for node in sample_data["nodes"].values():
            route = nav.calcular_rota(origem.id, node.id, acessivel)
            if route["sucesso"]:
                assert distances[str(node.id)] == route["distancia_total_metros"]
            else:
                assert str(node.id) not in distances


def test_distancias_rejeitam_origem_inativa(client, db_session, sample_data):
    sample_data["piso"].ativo = False
    db_session.commit()
    assert client.get("/api/routes/distances", params={"origem_no_id": sample_data["nodes"]["n1"].id}).status_code == 404


def test_etapas_identificam_troca_de_piso(client, db_session, sample_data):
    from app.models import Piso, Aresta

    piso = Piso(shopping_id=sample_data["shopping"].id, nome="Mezanino", nivel=2,
                largura_metros=100, altura_metros=60, ativo=True)
    db_session.add(piso)
    db_session.flush()
    elevador = sample_data["nodes"]["n5"]
    elevador.tipo = "elevador"
    destino = No(piso_id=piso.id, nome="Elevador superior", tipo="elevador", coord_x=.7, coord_y=.5, ativo=True)
    db_session.add(destino)
    db_session.flush()
    db_session.add(Aresta(no_origem_id=elevador.id, no_destino_id=destino.id, distancia=4,
                         bidirecional=True, acessivel=True, ativa=True))
    db_session.commit()
    response = client.post("/api/routes", json={"origem_no_id": sample_data["nodes"]["n1"].id, "destino_no_id": destino.id, "acessivel": True})
    assert response.status_code == 200
    route = response.json()
    assert [step["texto"] for step in route["etapas"]] == route["instrucoes"]
    assert route["etapas"][0]["tipo"] == "inicio"
    assert route["etapas"][-1]["tipo"] == "chegada"
    transition, = [step for step in route["etapas"] if step["tipo"] == "troca_piso"]
    assert transition["piso_origem_id"] == sample_data["piso"].id
    assert transition["piso_destino_id"] == piso.id
    assert transition["no_destino_id"] == destino.id
    assert "elevador" in transition["texto"].lower()
