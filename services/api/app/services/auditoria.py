"""Mutation and audit are committed together; credentials and QR tokens are excluded."""
from typing import Annotated
from urllib.parse import unquote

from fastapi import Depends, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.auth import verify_api_key
from app.config import get_settings
from app.database import get_db
from app.models import Auditoria


def admin_context(request: Request, usuario: Annotated[str, Depends(verify_api_key)], db: Annotated[Session, Depends(get_db)]):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        motivo = unquote(request.headers.get("X-Audit-Reason", "")).strip()
        if not 3 <= len(motivo) <= 240 or any(ord(char) < 32 for char in motivo):
            raise HTTPException(422, "Informe o motivo da alteração (3 a 240 caracteres) em X-Audit-Reason")
        settings = get_settings()
        for secret in [settings.ADMIN_API_KEY, *settings.ADMIN_API_KEYS.values()]:
            if secret and secret in motivo:
                raise HTTPException(422, "Não inclua credenciais no motivo da alteração")
        db.info["audit"] = {"usuario": usuario, "motivo": motivo}
    try:
        yield
    finally:
        db.info.pop("audit", None)


def snapshot(record, previous=False):
    state = inspect(record)
    result = {}
    for column in state.mapper.column_attrs:
        name = column.key
        if name in {"criado_em", "atualizado_em"}:
            continue
        history = state.attrs[name].history
        value = history.deleted[0] if previous and history.deleted else getattr(record, name)
        result[name] = "[omitido]" if name == "token" else jsonable_encoder(value)
    return result


def commit_changes(db: Session):
    context = db.info.get("audit")
    if not context:
        raise RuntimeError("Mutação administrativa sem contexto de auditoria")
    changes = [(record, "criar", None) for record in db.new]
    changes += [(record, context.get("acao", "editar"), snapshot(record, previous=True))
                for record in db.dirty if db.is_modified(record, include_collections=False)]
    changes += [(record, "excluir", snapshot(record)) for record in db.deleted]
    db.flush()
    for record, action, before in changes:
        db.add(Auditoria(usuario=context["usuario"], motivo=context["motivo"],
                         entidade=record.__tablename__, registro_id=record.id, acao=action,
                         antes=before, depois=None if action == "excluir" else snapshot(record)))
    db.commit()
