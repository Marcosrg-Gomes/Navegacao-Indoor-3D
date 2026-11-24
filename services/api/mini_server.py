"""Local isolated integrated demo; creates a disposable SQLite database."""
import argparse
import os
import tempfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--catalog", type=str, default=None,
                        help="Caminho do catálogo a publicar (padrão: scene-catalog-v2.json)")
    parser.add_argument("--workers", type=int, default=1, help="Workers uvicorn (padrão: 1 para evitar problemas de concorrência do SQLite)")
    args = parser.parse_args()
    database = Path(tempfile.mkdtemp(prefix="mini-shopping-")) / "demo.db"
    # Usa MySQL do .env quando disponível; senão, SQLite temporário (demonstração isolada)
    if not os.environ.get("DATABASE_URL"):
        os.environ.update(DATABASE_URL="sqlite:///" + database.as_posix(), ADMIN_API_KEY="audit-local-admin-key-with-32-characters", SECRET_KEY="audit-local-only")
    else:
        os.environ.setdefault("ADMIN_API_KEY", "audit-local-admin-key-with-32-characters")
        os.environ.setdefault("SECRET_KEY", "audit-local-only")
    os.environ["ADMIN_API_KEYS"] = "{}"
    # Aumenta limites de rate para ambiente de teste
    if os.environ.get("ROUTES_RATE_LIMIT"):
        os.environ["ROUTES_RATE_LIMIT"] = os.environ.get("ROUTES_RATE_LIMIT", "1000")
    if os.environ.get("ROUTE_DISTANCES_RATE_LIMIT"):
        os.environ["ROUTE_DISTANCES_RATE_LIMIT"] = os.environ.get("ROUTE_DISTANCES_RATE_LIMIT", "1000")
    if os.environ.get("DIAGNOSTICS_RATE_LIMIT"):
        os.environ["DIAGNOSTICS_RATE_LIMIT"] = os.environ.get("DIAGNOSTICS_RATE_LIMIT", "1000")
    from app.database import Base, SessionLocal, engine
    from app.migrations import upgrade_schema
    from seed_mini_shopping import seed_mini_shopping
    from publish_scene import publish_scene
    default_catalog = Path(__file__).resolve().parents[2] / "assets/models/mini-shopping/scene-catalog-v2.json"
    catalog_path = Path(args.catalog) if args.catalog else default_catalog
    Base.metadata.create_all(engine)
    upgrade_schema(engine)
    # Habilita WAL mode para melhorar concorrência de leitura no SQLite
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.commit()
    with SessionLocal.begin() as db:
        seed_mini_shopping(db, catalog_path=catalog_path)
        publish_scene(db, catalog_path)
    import uvicorn
    uvicorn.run("app.main:app", host=args.host, port=args.port, workers=args.workers)


if __name__ == "__main__":
    main()
