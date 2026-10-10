from types import SimpleNamespace

import pytest
from app.models import Diagnostico
from app.routers import public
from app.services import diagnostics
from app.services.diagnostics import SlidingWindowRateLimiter
from fastapi import HTTPException
from pydantic import ValidationError


def test_rate_limiter_remove_clientes_inativos(monkeypatch):
    moments = iter((0, 60))
    monkeypatch.setattr(diagnostics, "monotonic", lambda: next(moments))
    limiter = SlidingWindowRateLimiter(1, 60)

    assert limiter.allow("cliente-inativo")
    assert limiter.allow("cliente-ativo")

    assert set(limiter.requests) == {"cliente-ativo"}


def test_rate_limiter_isola_limites_por_cliente(monkeypatch):
    monkeypatch.setattr(diagnostics, "monotonic", lambda: 0)
    limiter = SlidingWindowRateLimiter(1, 60)

    assert limiter.allow("cliente-a")
    assert limiter.allow("cliente-b")
    assert not limiter.allow("cliente-a")
    assert not limiter.allow("cliente-b")


def test_diagnostics_rate_limit_rejeita_sem_gravar_e_reabre_janela(
    db_session, monkeypatch
):
    moments = iter((0, 0, 60))
    monkeypatch.setattr(diagnostics, "monotonic", lambda: next(moments))
    monkeypatch.setattr(public, "diagnostics_rate_limiter", SlidingWindowRateLimiter(1, 60))
    event = public.DiagnosticEvent(tipo="mapa_3d", codigo="timeout")
    request = SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"))

    assert public.registrar_diagnostico(request, event, db_session) is None
    with pytest.raises(HTTPException) as exc_info:
        public.registrar_diagnostico(request, event, db_session)
    assert exc_info.value.status_code == 429
    assert db_session.query(Diagnostico).count() == 1
    assert db_session.query(Diagnostico).one().ocorrencias == 1

    assert public.registrar_diagnostico(request, event, db_session) is None
    assert db_session.query(Diagnostico).one().ocorrencias == 2


def test_diagnostics_invalid_event_is_rejected():
    with pytest.raises(ValidationError):
        public.DiagnosticEvent.model_validate(
            {"tipo": "mapa_3d", "codigo": "timeout", "token": "nao-registrar"}
        )
