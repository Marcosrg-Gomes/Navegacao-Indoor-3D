"""A fingerprint of public navigation data also detects changes made outside the admin UI."""
import hashlib
import json

from sqlalchemy import or_

from app.models import Aresta, Categoria, Loja, No, Piso, Shopping


def navigation_state(db, shopping_id):
    shopping = db.query(Shopping).filter_by(id=shopping_id).first()
    if not shopping:
        return {"revisao": "ausente", "ativo": False}
    floors = db.query(Piso).filter_by(shopping_id=shopping_id).order_by(Piso.id).all()
    nodes = db.query(No).filter(No.piso_id.in_([floor.id for floor in floors])).order_by(No.id).all()
    ids = [node.id for node in nodes]
    edges = db.query(Aresta).filter(or_(Aresta.no_origem_id.in_(ids), Aresta.no_destino_id.in_(ids))).order_by(Aresta.id).all()
    pois = db.query(Loja).filter(Loja.no_id.in_(ids)).order_by(Loja.id).all()
    categories = db.query(Categoria).filter(Categoria.id.in_([poi.categoria_id for poi in pois])).order_by(Categoria.id).all()
    # Include public fields only; never bind revisions to credentials or visitor data.
    data = [[{column.name: str(getattr(record, column.name)) for column in record.__table__.columns
              if column.name not in {"criado_em", "atualizado_em"}} for record in records]
            for records in [[shopping], floors, nodes, edges, pois, categories]]
    digest = hashlib.sha256(json.dumps(data, sort_keys=True, ensure_ascii=True).encode()).hexdigest()
    return {"revisao": digest, "ativo": shopping.ativo}
