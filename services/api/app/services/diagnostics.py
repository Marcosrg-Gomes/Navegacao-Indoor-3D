from datetime import datetime, timezone

from app.models import Diagnostico


def record_failure(db, tipo, codigo):
    """Bounded aggregate counters: no URL, token, IP, device, origin or destination."""
    values = {"tipo": tipo, "codigo": codigo, "ocorrencias": 1, "atualizado_em": datetime.now(timezone.utc)}
    if db.bind.dialect.name == "mysql":
        from sqlalchemy.dialects.mysql import insert
        statement = insert(Diagnostico).values(**values)
        statement = statement.on_duplicate_key_update(ocorrencias=Diagnostico.ocorrencias + 1, atualizado_em=values["atualizado_em"])
    else:
        from sqlalchemy.dialects.sqlite import insert
        statement = insert(Diagnostico).values(**values)
        statement = statement.on_conflict_do_update(index_elements=["tipo", "codigo"],
            set_={"ocorrencias": Diagnostico.ocorrencias + 1, "atualizado_em": values["atualizado_em"]})
    db.execute(statement)
    db.commit()
