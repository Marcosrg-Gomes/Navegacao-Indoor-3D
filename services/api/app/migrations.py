"""Small idempotent upgrade for installations created before the phase audit.

Existing records are preserved. Future structural migrations should use Alembic.
"""
from sqlalchemy import inspect, text


def upgrade_schema(engine):
    upgrade_codes(engine)
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


def upgrade_codes(engine):
    """Add and backfill stable identities without recreating or deleting tables."""
    inspector = inspect(engine)
    for table in ("shoppings", "pisos", "nos", "lojas"):
        if table not in inspector.get_table_names():
            continue
        columns = {c["name"] for c in inspector.get_columns(table)}
        with engine.begin() as connection:
            if "codigo" not in columns:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN codigo VARCHAR(80)"))
            ids = connection.execute(text(f"SELECT id FROM {table} WHERE codigo IS NULL OR codigo = ''")).scalars().all()
            for identity in ids:
                connection.execute(text(f"UPDATE {table} SET codigo = :code WHERE id = :id"),
                                   {"code": f"LEGACY_{table.upper()}_{identity}", "id": identity})
            indexes = inspect(connection).get_indexes(table)
            constraints = inspect(connection).get_unique_constraints(table)
            if not any(i.get("unique", True) and i["column_names"] == ["codigo"] for i in indexes + constraints):
                connection.execute(text(f"CREATE UNIQUE INDEX ux_{table}_codigo ON {table} (codigo)"))
            if engine.dialect.name == "sqlite":
                # SQLite cannot ALTER COLUMN NOT NULL without rebuilding the table.
                for event in ("INSERT", "UPDATE"):
                    connection.execute(text(f"""CREATE TRIGGER IF NOT EXISTS ck_{table}_codigo_{event.lower()}
                        BEFORE {event} ON {table} WHEN NEW.codigo IS NULL OR NEW.codigo = ''
                        BEGIN SELECT RAISE(ABORT, 'codigo obrigatório'); END"""))
            elif engine.dialect.name == "mysql" and ("codigo" not in columns or next(c for c in inspector.get_columns(table) if c["name"] == "codigo")["nullable"]):
                connection.execute(text(f"ALTER TABLE {table} MODIFY codigo VARCHAR(80) NOT NULL"))
