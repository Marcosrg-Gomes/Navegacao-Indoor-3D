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
    os.environ["ADMIN_API_KEY"] = "audit-local-admin-key-with-32-characters"
    os.environ["ADMIN_API_KEYS"] = "{}"
    os.environ["SECRET_KEY"] = "audit-local-only"
    from app.database import Base, engine, SessionLocal
    from app.migrations import upgrade_schema
    from app.models import Aresta, Categoria, Loja, No, Piso, QRCode, Shopping
    from seed import seed_db
    from seed_mini_shopping import seed_mini_shopping
    Base.metadata.create_all(engine)
    upgrade_schema(engine)
    seed_db()  # seed legado: preservado integralmente; nunca apaga cadastros existentes.

    # Seed aditivo do Mini Shopping (inclui o QR MINI-ENTRADA-PRINCIPAL)
    # em sessão própria, com commit garantido ao sair do bloco.
    with SessionLocal.begin() as db:
        seed_mini_shopping(db)

    # Cenário legado DESTINO-SUPERIOR: associado explicitamente ao Shopping
    # Demo Center, independentemente da quantidade total de pisos. O piso
    # superior só é criado quando ainda não existe, evitando duplicação em
    # novas execuções com o mesmo --database.
    with SessionLocal.begin() as db:
        demo = db.query(Shopping).filter_by(nome="Shopping Demo Center").first()
        if demo is not None:
            ground = db.query(Piso).filter_by(shopping_id=demo.id, nivel=0).first()
            if ground is not None:
                upper = db.query(Piso).filter_by(shopping_id=demo.id, nivel=1).first()
                if upper is None:
                    upper = Piso(shopping_id=demo.id, nome="Piso superior", nivel=1,
                                 largura_metros=100, altura_metros=60,
                                 imagem_planta_url="/static/plantas/demo.svg")
                    db.add(upper); db.flush()
                    e0 = No(piso_id=ground.id, nome="Elevador térreo", tipo="elevador", coord_x=.85, coord_y=.5)
                    e1 = No(piso_id=upper.id, nome="Elevador superior", tipo="elevador", coord_x=.85, coord_y=.5)
                    s1 = No(piso_id=upper.id, nome="Escada superior", tipo="escada", coord_x=.9, coord_y=.3)
                    dest = No(piso_id=upper.id, nome="Livraria Superior", tipo="loja", coord_x=.5, coord_y=.3)
                    db.add_all([e0, e1, s1, dest]); db.flush()
                    central = db.query(No).filter(No.nome == "Corredor Central", No.piso_id == ground.id).one()
                    stairs = db.query(No).filter(No.nome == "Escada Piso Superior", No.piso_id == ground.id).one()
                    for a, b, distance, accessible in [(central, e0, 35, True), (e0, e1, 8, True),
                                                       (e1, dest, 35, True), (stairs, s1, 5, False),
                                                       (s1, dest, 40, True)]:
                        db.add(Aresta(no_origem_id=a.id, no_destino_id=b.id, distancia=distance,
                                     acessivel=accessible, bidirecional=True, ativa=True))
                    categoria = (
                        db.query(Categoria)
                        .join(Loja, Loja.categoria_id == Categoria.id)
                        .join(No, No.id == Loja.no_id)
                        .join(Piso, Piso.id == No.piso_id)
                        .filter(Piso.shopping_id == demo.id)
                        .first()
                    )
                    categoria_id = categoria.id
                    db.add(Loja(no_id=dest.id, nome="Livraria Superior", categoria_id=categoria_id,
                                status_operacional="aberto", descricao="Livros e papelaria no piso superior."))
                    db.add(QRCode(no_id=dest.id, token="DESTINO-SUPERIOR", ativo=True))
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=args.port)


if __name__ == "__main__":
    main()
