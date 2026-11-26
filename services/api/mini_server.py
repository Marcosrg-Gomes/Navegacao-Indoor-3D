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
        os.environ.setdefault("DATABASE_URL", "sqlite:///" + database.as_posix())
    os.environ.setdefault("ADMIN_API_KEY", "audit-local-admin-key-with-32-caracteres")
    os.environ.setdefault("SECRET_KEY", "audit-local-only-chave-secreta-32-car")
    os.environ["ADMIN_API_KEYS"] = "{}"
    # Aumenta limites de rate para ambiente de teste (o schema aceita no máximo 600).
    # Sem isso, o padrão de 20 distâncias/min derruba a suíte E2E com HTTP 429.
    os.environ.setdefault("ROUTES_RATE_LIMIT", "600")
    os.environ.setdefault("ROUTE_DISTANCES_RATE_LIMIT", "600")
    os.environ.setdefault("DIAGNOSTICS_RATE_LIMIT", "600")
    # Limpa cache do get_settings() (@lru_cache) para pegar as env vars definidas acima
    from app.config import get_settings
    get_settings.cache_clear()
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
    if engine.dialect.name == "sqlite":
        with engine.connect() as conn:
            conn.execute(text("PRAGMA journal_mode=WAL"))
            conn.commit()
    with SessionLocal.begin() as db:
        seed_mini_shopping(db, catalog_path=catalog_path)
        publish_scene(db, catalog_path)
    # Quando rodando em MySQL (banco de teste/E2E), o mini shopping ja semeia
    # os tokens MINI-ENTRADA-PRINCIPAL etc. via seed_mini_shopping. Os testes
    # de scanner do navegador usam esses mesmos tokens.
    pass
    import uvicorn
    uvicorn.run("app.main:app", host=args.host, port=args.port, workers=args.workers)


if __name__ == "__main__":
    main()
