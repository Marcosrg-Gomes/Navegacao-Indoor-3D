"""Local isolated integrated demo; creates a disposable SQLite database."""
import argparse
import os
import tempfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    database = Path(tempfile.mkdtemp(prefix="mini-shopping-")) / "demo.db"
    os.environ.update(DATABASE_URL="sqlite:///" + database.as_posix(), ADMIN_API_KEY="audit-local-only", SECRET_KEY="audit-local-only")
    from app.database import Base, SessionLocal, engine
    from app.migrations import upgrade_schema
    from seed_mini_shopping import DEFAULT_CATALOG, seed_mini_shopping
    from publish_scene import publish_scene
    Base.metadata.create_all(engine)
    upgrade_schema(engine)
    with SessionLocal.begin() as db:
        seed_mini_shopping(db)
        publish_scene(db, DEFAULT_CATALOG)
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=args.port)


if __name__ == "__main__":
    main()
