"""Idempotent, additive seed. Reads the scene contract, never Blender internals."""
from pathlib import Path

from app.database import Base, SessionLocal, engine
from app.migrations import upgrade_schema
from app.models import Aresta, Categoria, Loja, No, Piso, QRCode, Shopping
from app.scene_contract import REPO_ROOT, load_catalog

DEFAULT_CATALOG = REPO_ROOT / "assets/models/mini-shopping/scene-catalog-v1.json"


def seed_mini_shopping(db, catalog_path=DEFAULT_CATALOG):
    catalog = load_catalog(catalog_path)
    shopping = db.query(Shopping).filter_by(codigo=catalog["shopping_code"]).first()
    if shopping is None:
        shopping = Shopping(codigo=catalog["shopping_code"], nome="Mini Shopping", ativo=True)
        db.add(shopping)
        db.flush()
    floors, nodes = {}, {}
    for code, spec in catalog["floors"].items():
        floor = db.query(Piso).filter_by(codigo=code).first()
        if floor and floor.shopping_id != shopping.id:
            raise ValueError(f"Código de piso já pertence a outro shopping: {code}")
        if floor is None:
            floor = Piso(codigo=code, shopping_id=shopping.id, nome=spec["name"], nivel=spec["level"],
                         largura_metros=spec["axis_x"][0], altura_metros=-spec["axis_y"][2],
                         imagem_planta_url=f"/static/models/mini-shopping/{code.lower()}-v{catalog['release']}.svg", ativo=True)
            db.add(floor)
            db.flush()
        floors[code] = floor
    for code, spec in catalog["anchors"].items():
        node = db.query(No).filter_by(codigo=code).first()
        if node and node.piso_id != floors[spec["floor_code"]].id:
            raise ValueError(f"Código de nó em outro piso: {code}")
        if node is None:
            node = No(codigo=code, piso_id=floors[spec["floor_code"]].id, nome=spec["name"],
                      coord_x=spec["coord_x"], coord_y=spec["coord_y"], tipo=spec["type"], ativo=True)
            db.add(node)
            db.flush()
        nodes[code] = node
    for code, spec in catalog["pois"].items():
        category = db.query(Categoria).filter_by(nome=spec["category"]).first()
        if category is None:
            category = Categoria(nome=spec["category"])
            db.add(category)
            db.flush()
        poi = db.query(Loja).filter_by(codigo=code).first()
        if poi and poi.no_id != nodes[spec["anchor_code"]].id:
            raise ValueError(f"Código de destino em outro nó: {code}")
        if poi is None:
            db.add(Loja(codigo=code, no_id=nodes[spec["anchor_code"]].id, nome=spec["name"],
                        categoria_id=category.id, status_operacional="aberto", ativo=True))
    for spec in catalog["edges"]:
        a, b = nodes[spec["from"]].id, nodes[spec["to"]].id
        if not db.query(Aresta).filter_by(no_origem_id=a, no_destino_id=b).first():
            db.add(Aresta(no_origem_id=a, no_destino_id=b, distancia=spec["distance"],
                          bidirecional=spec["bidirectional"], acessivel=spec["accessible"], ativa=True))
    for token, code in catalog["qr_codes"].items():
        qr = db.query(QRCode).filter_by(token=token).first()
        if qr and qr.no_id != nodes[code].id:
            raise ValueError(f"Token já utilizado em outro nó: {token}")
        if qr is None:
            db.add(QRCode(token=token, no_id=nodes[code].id, ativo=True))
    db.flush()
    return shopping


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    args = parser.parse_args()
    Base.metadata.create_all(engine)
    upgrade_schema(engine)
    with SessionLocal.begin() as db:
        shopping = seed_mini_shopping(db, args.catalog)
        print(f"Mini Shopping preparado: id={shopping.id}. Dados e bloqueios existentes preservados.")
