"""Isolated demonstration server: never uses credentials or data from .env.

Run: python audit_server.py --port 8765
Each run creates its own temporary SQLite fixture. Production uses MySQL.
"""
import argparse
import os
import tempfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--database", type=Path, help="Reuse an explicit audit SQLite file (never deletes records)")
    args = parser.parse_args()
    database = args.database.resolve() if args.database else Path(tempfile.mkdtemp(prefix="indoor-audit-")) / "demo.db"
    database.parent.mkdir(parents=True, exist_ok=True)
    os.environ["DATABASE_URL"] = "sqlite:///" + database.as_posix()
    os.environ["ADMIN_API_KEY"] = "audit-local-only"
    os.environ["SECRET_KEY"] = "audit-local-only"
    from app.database import Base, engine, SessionLocal
    from app.migrations import upgrade_schema
    from app.models import Aresta, Loja, No, Piso, QRCode
    from seed import seed_db
    Base.metadata.create_all(engine)
    upgrade_schema(engine)
    seed_db()
    with SessionLocal() as db:
        if db.query(Piso).count() == 1:
            ground = db.query(Piso).first()
            upper = Piso(shopping_id=ground.shopping_id, nome="Piso superior", nivel=1,
                         largura_metros=100, altura_metros=60, imagem_planta_url="/static/plantas/demo.svg")
            db.add(upper); db.flush()
            e0 = No(piso_id=ground.id, nome="Elevador térreo", tipo="elevador", coord_x=.85, coord_y=.5)
            e1 = No(piso_id=upper.id, nome="Elevador superior", tipo="elevador", coord_x=.85, coord_y=.5)
            s1 = No(piso_id=upper.id, nome="Escada superior", tipo="escada", coord_x=.9, coord_y=.3)
            dest = No(piso_id=upper.id, nome="Livraria Superior", tipo="loja", coord_x=.5, coord_y=.3)
            db.add_all([e0, e1, s1, dest]); db.flush()
            central = db.query(No).filter(No.nome == "Corredor Central").one()
            stairs = db.query(No).filter(No.nome == "Escada Piso Superior").one()
            for a, b, distance, accessible in [(central, e0, 35, True), (e0, e1, 8, True),
                                              (e1, dest, 35, True), (stairs, s1, 5, False),
                                              (s1, dest, 40, True)]:
                db.add(Aresta(no_origem_id=a.id, no_destino_id=b.id, distancia=distance,
                             acessivel=accessible, bidirecional=True, ativa=True))
            category = db.query(Loja).first().categoria_id
            db.add(Loja(no_id=dest.id, nome="Livraria Superior", categoria_id=category,
                        status_operacional="aberto", descricao="Livros e papelaria no piso superior."))
            db.add(QRCode(no_id=dest.id, token="DESTINO-SUPERIOR", ativo=True))
            db.commit()
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=args.port)


if __name__ == "__main__":
    main()
