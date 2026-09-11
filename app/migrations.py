"""Small idempotent upgrade for installations created before the phase audit.

Existing records are preserved. Future structural migrations should use Alembic.
"""
from sqlalchemy import inspect, text


def upgrade_schema(engine):
    inspector = inspect(engine)
    if "lojas" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("lojas")}
    with engine.begin() as connection:
        if "status_operacional" not in columns:
            connection.execute(text(
                "ALTER TABLE lojas ADD COLUMN status_operacional VARCHAR(20) NOT NULL DEFAULT 'aberto'"
            ))
            connection.execute(text("UPDATE lojas SET status_operacional = 'fechado' WHERE ativo = false"))
        # Legacy uncategorized POIs gain an explicit, reviewable category.
        missing = connection.execute(text("SELECT COUNT(*) FROM lojas WHERE categoria_id IS NULL")).scalar()
        if missing:
            category_id = connection.execute(text(
                "SELECT id FROM categorias WHERE nome = 'Sem classificação (revisar)'"
            )).scalar()
            if category_id is None:
                connection.execute(text("INSERT INTO categorias (nome) VALUES ('Sem classificação (revisar)')"))
                category_id = connection.execute(text(
                    "SELECT id FROM categorias WHERE nome = 'Sem classificação (revisar)'"
                )).scalar()
            connection.execute(text("UPDATE lojas SET categoria_id = :category_id WHERE categoria_id IS NULL"),
                               {"category_id": category_id})
