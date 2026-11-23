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
    parser.add_argument("--workers", type=int, default=4, help="Workers uvicorn para testes E2E concorrentes")
    args = parser.parse_args()
    database = Path(tempfile.mkdtemp(prefix="mini-shopping-")) / "demo.db"
    # Usa MySQL do .env quando disponível; senão, SQLite temporário (demonstração isolada)
    if not os.environ.get("DATABASE_URL"):
        os.environ.update(DATABASE_URL="sqlite:///" + database.as_posix(), ADMIN_API_KEY="audit-local-admin-key-with-32-characters", SECRET_KEY="audit-local-only")
    else:
        os.environ.setdefault("ADMIN_API_KEY", "audit-local-admin-key-with-32-characters")
        os.environ.setdefault("SECRET_KEY", "audit-local-only")
    os.environ["ADMIN_API_KEYS"] = "{}"
    from app.database import Base, SessionLocal, engine
    from app.migrations import upgrade_schema
    from seed_mini_shopping import seed_mini_shopping
    from publish_scene import publish_scene
    default_catalog = Path(__file__).resolve().parents[2] / "assets/models/mini-shopping/scene-catalog-v2.json"
    catalog_path = Path(args.catalog) if args.catalog else default_catalog
    Base.metadata.create_all(engine)
    upgrade_schema(engine)
    with SessionLocal.begin() as db:
        seed_mini_shopping(db, catalog_path=catalog_path)
        publish_scene(db, catalog_path)
    import uvicorn
    uvicorn.run("app.main:app", host=args.host, port=args.port, workers=args.workers)


if __name__ == "__main__":
    main()
