import copy
import json
from pathlib import Path

import pytest
from sqlalchemy import create_engine, inspect, text

from app.migrations import upgrade_codes
from app.models import Aresta, Loja, No, Piso, QRCode, Shopping
from app.scene_contract import load_catalog, transform, validate_catalog
from app.services import scenes
from app.services.navigation import NavigationEngine
from publish_scene import publish_scene
from seed_mini_shopping import DEFAULT_CATALOG, seed_mini_shopping


@pytest.fixture
def mini(db_session):
    shopping = seed_mini_shopping(db_session)
    db_session.commit()
    return shopping


@pytest.fixture
def published(mini, db_session, tmp_path, monkeypatch):
    publish_scene(db_session, DEFAULT_CATALOG, tmp_path)
    monkeypatch.setattr(scenes, "MODELS_DIR", tmp_path)
    return mini


def test_seed_additive_idempotent_preserves_blocks(db_session, sample_data):
    previous_ids = {m: [r.id for r in db_session.query(m).all()] for m in (Shopping, Piso, No, Loja)}
    seed_mini_shopping(db_session)
    db_session.commit()
    counts = {m: db_session.query(m).count() for m in (Shopping, Piso, No, Loja, Aresta, QRCode)}
    edge = db_session.query(Aresta).first()
    edge.ativa = False
    seed_mini_shopping(db_session)
    db_session.commit()
    assert not edge.ativa
    assert counts == {m: db_session.query(m).count() for m in counts}
    for model, ids in previous_ids.items():
        assert all(db_session.get(model, identity) for identity in ids)


def test_catalog_and_seed_cover_real_shopping(mini, db_session):
    assert db_session.query(Piso).count() == 2
    for floor in db_session.query(Piso):
        assert float(floor.largura_metros) == 30 and float(floor.altura_metros) == 60
    assert db_session.query(Loja).count() == 27
    assert db_session.query(No).filter_by(tipo="loja").count() == 22
    assert db_session.query(No).filter_by(tipo="banheiro").count() == 4
    assert db_session.query(QRCode).count() == 7
    assert all(0 <= n.coord_x <= 1 and 0 <= n.coord_y <= 1 for n in db_session.query(No))
    assert all(e.distancia > 0 for e in db_session.query(Aresta))


def test_all_destinations_reachable_and_accessible(mini, db_session):
    engine = NavigationEngine(db_session)
    origin = db_session.query(No).filter_by(codigo="T_ENTRADA").one()
    for poi in db_session.query(Loja):
        for accessible in (False, True):
            route = engine.calcular_rota(origin.id, poi.no_id, accessible)
            assert route["sucesso"], poi.codigo
            if accessible:
                assert not {"escada", "escada_rolante"} & {n["tipo"] for n in route["nos"]}
                if poi.no.piso.codigo == "MEZANINO":
                    assert "elevador" in {n["tipo"] for n in route["nos"]}


def test_escalator_direction_and_accessible_block(mini, db_session):
    engine = NavigationEngine(db_session)
    nodes = {n.codigo: n for n in db_session.query(No)}
    route = engine.calcular_rota(nodes["T_ESCADA_ROLANTE_SUBIDA"].id, nodes["M_ESCADA_ROLANTE_SUBIDA"].id)
    assert len(route["nos"]) == 2
    assert any("escada rolante para subir" in i for i in route["instrucoes"])
    reverse = engine.calcular_rota(nodes["M_ESCADA_ROLANTE_SUBIDA"].id, nodes["T_ESCADA_ROLANTE_SUBIDA"].id)
    assert reverse["sucesso"] and len(reverse["nos"]) > 2
    lift_edge = db_session.query(Aresta).filter_by(no_origem_id=nodes["T_ELEVADOR"].id, no_destino_id=nodes["M_ELEVADOR"].id).one()
    lift_edge.ativa = False
    db_session.commit()
    assert not engine.calcular_rota(nodes["T_ENTRADA"].id, nodes["M_LOJA_ME01"].id, True)["sucesso"]
    assert engine.calcular_rota(nodes["T_ENTRADA"].id, nodes["M_LOJA_ME01"].id)["sucesso"]


def test_scene_endpoint_resolves_and_filters(client, published, db_session):
    response = client.get(f"/api/shoppings/{published.id}/scene")
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data["floors"]) == 2 and len(data["pois"]) == 27
    for poi in data["pois"]:
        assert db_session.get(Loja, poi["loja_id"]).no_id == poi["anchor_node_id"]
    node = db_session.query(No).filter_by(codigo="T_LOJA_E01").one()
    node.ativo = False
    db_session.commit()
    data = client.get(f"/api/shoppings/{published.id}/scene").json()
    assert "E01" not in {p["codigo"] for p in data["pois"]}
    assert node.id not in {p["node_id"] for p in data["anchors"]}


def test_scene_errors_and_authenticated_diagnostics(client, mini, db_session, tmp_path, monkeypatch, api_key_header):
    monkeypatch.setattr(scenes, "MODELS_DIR", tmp_path)
    assert client.get(f"/api/shoppings/{mini.id}/scene").status_code == 404
    publish_scene(db_session, DEFAULT_CATALOG, tmp_path)
    assert client.get(f"/api/admin/shoppings/{mini.id}/scene/validation").status_code in (401, 403)
    node = db_session.query(No).filter_by(codigo="T_LOJA_E01").one()
    node.coord_x = .1
    db_session.commit()
    assert client.get(f"/api/shoppings/{mini.id}/scene").status_code == 409
    report = client.get(f"/api/admin/shoppings/{mini.id}/scene/validation", headers=api_key_header).json()
    assert not report["valid"] and "Âncora divergente: T_LOJA_E01" in report["errors"]
    with pytest.raises(ValueError, match="Publicação rejeitada"):
        publish_scene(db_session, DEFAULT_CATALOG, tmp_path)


@pytest.mark.parametrize("mutation", ["path", "dangling", "nan", "transform", "position", "position_nan", "bool", "structure", "release", "metadata", "direction"])
def test_contract_rejects_invalid_catalogs(mutation):
    catalog = copy.deepcopy(load_catalog(DEFAULT_CATALOG))
    if mutation == "path": catalog["model_url"] = "https://other.test/model.glb"
    if mutation == "dangling": catalog["pois"]["E01"]["anchor_code"] = "MISSING"
    if mutation == "nan": catalog["anchors"]["T_ENTRADA"]["coord_x"] = float("nan")
    if mutation == "transform": catalog["floors"]["TERREO"]["axis_y"][2] = 60
    if mutation == "position": catalog["anchors"]["T_ENTRADA"]["position"][0] = 99
    if mutation == "position_nan": catalog["anchors"]["T_ENTRADA"]["position"][0] = float("nan")
    if mutation == "bool": catalog["anchors"]["T_ENTRADA"]["coord_x"] = True
    if mutation == "structure": catalog["floors"] = ["TERREO"]
    if mutation == "release": catalog["release"] = 2
    if mutation == "metadata": del catalog["pois"]["E01"]["kind"]
    if mutation == "direction": catalog["edges"][0]["bidirectional"] = "false"
    with pytest.raises(ValueError): validate_catalog(catalog)


def test_transform_orientation():
    floors = load_catalog(DEFAULT_CATALOG)["floors"]
    assert transform(floors["TERREO"], 0, 0) == [-15, 0, 30]
    assert transform(floors["TERREO"], 1, 1) == [15, 0, -30]
    assert transform(floors["MEZANINO"], .5, .5) == [0, 4.7, 0]


def test_codes_migration_preserves_legacy_data_and_repeats():
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE shoppings (id INTEGER PRIMARY KEY, nome TEXT NOT NULL)"))
        conn.execute(text("INSERT INTO shoppings VALUES (7, 'Shopping existente')"))
    upgrade_codes(engine)
    upgrade_codes(engine)
    with engine.connect() as conn:
        assert conn.execute(text("SELECT id, nome, codigo FROM shoppings")).one() == (7, "Shopping existente", "LEGACY_SHOPPINGS_7")
    assert any(i["unique"] for i in inspect(engine).get_indexes("shoppings"))


def test_publication_keeps_previous_when_glb_is_corrupt(published, db_session, tmp_path):
    before = (tmp_path / "published-scenes.json").read_bytes()
    directory = tmp_path / "candidate"
    directory.mkdir()
    catalog = json.loads(DEFAULT_CATALOG.read_text(encoding="utf-8"))
    (directory / DEFAULT_CATALOG.name).write_text(json.dumps(catalog), encoding="utf-8")
    (directory / Path(catalog["model_url"]).name).write_bytes(b"invalid")
    with pytest.raises(ValueError): publish_scene(db_session, directory / DEFAULT_CATALOG.name, tmp_path)
    assert (tmp_path / "published-scenes.json").read_bytes() == before


@pytest.mark.parametrize("mutation", ["missing_poi", "missing_plan", "changed_plan"])
def test_publication_rejects_incomplete_or_changed_artifacts(published, db_session, tmp_path, mutation):
    import shutil
    before = {p.relative_to(tmp_path): p.read_bytes() for p in tmp_path.rglob("*") if p.is_file()}
    candidate = tmp_path / "candidate"
    shutil.copytree(DEFAULT_CATALOG.parent, candidate)
    path = candidate / DEFAULT_CATALOG.name
    if mutation == "missing_poi":
        catalog = json.loads(path.read_text(encoding="utf-8"))
        catalog["pois"]["E01"]["object_prefix"] = "OBJECT_NOT_IN_GLB"
        path.write_text(json.dumps(catalog), encoding="utf-8")
    elif mutation == "missing_plan":
        (candidate / "terreo-v1.svg").unlink()
    else:
        (candidate / "terreo-v1.svg").write_text("<svg/>", encoding="utf-8")
    with pytest.raises((ValueError, FileNotFoundError)):
        publish_scene(db_session, path, tmp_path)
    assert all((tmp_path / p).read_bytes() == content for p, content in before.items())
