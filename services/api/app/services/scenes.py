"""Resolve published scene codes against the API's current database state."""
import hashlib
import json
from functools import lru_cache
from pathlib import Path

from fastapi import HTTPException
from app.models import Loja, No, Piso, Shopping
from app.scene_contract import load_catalog
from app.services.navigation import NavigationEngine

MODELS_DIR = Path(__file__).resolve().parents[1] / "static/models"


@lru_cache(maxsize=8)
def _digest(path, size, mtime):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read_published(shopping_code):
    registry = MODELS_DIR / "published-scenes.json"
    if not registry.exists():
        raise HTTPException(404, "Shopping sem cena publicada")
    try:
        relative = json.loads(registry.read_text(encoding="utf-8")).get(shopping_code)
        if not relative:
            raise HTTPException(404, "Shopping sem cena publicada")
        path = (MODELS_DIR / relative).resolve()
        if not path.is_relative_to(MODELS_DIR.resolve()):
            raise ValueError("Caminho fora da publicação")
        catalog = load_catalog(path)
        if catalog["shopping_code"] != shopping_code:
            raise ValueError("Shopping divergente")
        model = MODELS_DIR / catalog["model_url"].removeprefix("/static/models/")
        stat = model.stat()
        if stat.st_size > 25 * 1024 * 1024 or stat.st_size != catalog["model_bytes"]:
            raise ValueError("Tamanho do GLB divergente")
        if _digest(str(model), stat.st_size, stat.st_mtime_ns) != catalog["model_sha256"]:
            raise ValueError("Hash do GLB divergente")
        return catalog
    except (ValueError, OSError, KeyError, TypeError) as exc:
        raise HTTPException(409, f"Publicação da cena inválida: {exc}") from exc


def inspect_scene(db, shopping, catalog, routes=False):
    floors_all = db.query(Piso).filter_by(shopping_id=shopping.id).all()
    floor_ids = [p.id for p in floors_all]
    nodes_all = db.query(No).filter(No.piso_id.in_(floor_ids)).all()
    pois_all = db.query(Loja).filter(Loja.no_id.in_([n.id for n in nodes_all])).all()
    floors = {p.codigo: p for p in floors_all if p.ativo}
    nodes = {n.codigo: n for n in nodes_all if n.ativo and n.piso.ativo}
    pois = {p.codigo: p for p in pois_all if p.ativo and p.no.ativo and p.no.piso.ativo}
    errors, missing_db, missing_catalog = [], {}, {}
    for kind, current, all_items in [("floors", floors, floors_all), ("anchors", nodes, nodes_all), ("pois", pois, pois_all)]:
        missing_db[kind] = sorted(set(catalog[kind]) - {item.codigo for item in all_items})
        missing_catalog[kind] = sorted(set(current) - set(catalog[kind]))
        if missing_db[kind] or missing_catalog[kind]:
            errors.append(f"Códigos divergentes em {kind}")
    if catalog["shopping_code"] != shopping.codigo:
        errors.append("Código de shopping divergente")
    for code, floor in floors.items():
        spec = catalog["floors"].get(code)
        if spec and (abs(float(floor.largura_metros or 0)-spec["axis_x"][0]) > .001 or
                     abs(float(floor.altura_metros or 0)+spec["axis_y"][2]) > .001 or floor.nivel != spec["level"]):
            errors.append(f"Dimensões/nível divergentes: {code}")
    invalid_nodes = []
    for code, node in nodes.items():
        spec = catalog["anchors"].get(code)
        if not 0 <= float(node.coord_x) <= 1 or not 0 <= float(node.coord_y) <= 1:
            invalid_nodes.append(code)
        if spec and (node.piso.codigo != spec["floor_code"] or node.tipo != spec["type"] or
                     abs(float(node.coord_x)-spec["coord_x"]) > .00001 or abs(float(node.coord_y)-spec["coord_y"]) > .00001):
            errors.append(f"Âncora divergente: {code}")
    for code, poi in pois.items():
        if code in catalog["pois"] and poi.no.codigo != catalog["pois"][code]["anchor_code"]:
            errors.append(f"Vínculo POI/nó divergente: {code}")
    if invalid_nodes:
        errors.append("Nós fora dos limites do piso")
    unavailable, inaccessible = [], []
    if routes:
        origin = nodes.get("T_ENTRADA")
        engine = NavigationEngine(db)
        for code, poi in pois.items():
            if not origin or not engine.calcular_rota(origin.id, poi.no_id)["sucesso"]:
                unavailable.append(code)
            if not origin or not engine.calcular_rota(origin.id, poi.no_id, acessivel=True)["sucesso"]:
                inaccessible.append(code)
    counts = {kind: {"expected": len(catalog[kind]), "found": len(current)}
              for kind, current in [("floors", floors), ("anchors", nodes), ("pois", pois)]}
    for kind in ("loja", "banheiro", "entrada"):
        counts[kind] = {"expected": sum(p["kind"] == kind for p in catalog["pois"].values()),
                        "found": sum(p.no.tipo == kind for p in pois.values())}
    report = {"valid": not errors, "scene_version": catalog["version"], "release": catalog["release"],
              "published_at": catalog.get("published_at"), "model_url": catalog["model_url"],
              "counts": counts, "missing_in_database": missing_db, "missing_in_catalog": missing_catalog,
              "invalid_nodes": invalid_nodes, "unreachable_pois": unavailable,
              "inaccessible_pois": inaccessible, "errors": errors,
              "floors": [{"id": p.id, "nome": p.nome} for p in floors.values()]}
    return report, floors, nodes, pois


def resolve_scene(db, shopping_id, diagnostic=False):
    shopping = db.query(Shopping).filter_by(id=shopping_id, ativo=True).first()
    if not shopping:
        raise HTTPException(404, "Shopping não encontrado ou inativo")
    catalog = read_published(shopping.codigo)
    report, floors, nodes, pois = inspect_scene(db, shopping, catalog, routes=diagnostic)
    if diagnostic:
        return report
    if not report["valid"]:
        raise HTTPException(409, report)
    return {"shopping_id": shopping.id, "scene_version": catalog["version"], "release": catalog["release"],
            "model_url": catalog["model_url"], "model_sha256": catalog["model_sha256"],
            "floors": [dict(catalog["floors"][code], piso_id=p.id, codigo=code) for code, p in floors.items()],
            "pois": [{"loja_id": p.id, "codigo": code, "object_prefix": catalog["pois"][code]["object_prefix"],
                      "anchor_node_id": p.no_id} for code, p in pois.items()],
            "anchors": [dict(catalog["anchors"][code], node_id=n.id, codigo=code, piso_id=n.piso_id)
                        for code, n in nodes.items()]}
