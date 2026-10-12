import pytest
from app.auth import verify_api_key
from app.config import INSECURE_EXAMPLE_VALUES, Settings
from fastapi import HTTPException
from pydantic import ValidationError


def valid_settings():
    return {
        "DATABASE_URL": "sqlite:///./config-test.db",
        "ADMIN_API_KEY": "credencial-administrativa-de-teste",
        "SECRET_KEY": "segredo-de-configuracao-de-teste",
    }


@pytest.mark.parametrize("field", ("DATABASE_URL", "ADMIN_API_KEY", "SECRET_KEY"))
def test_settings_rejeita_valor_vazio(field):
    values = valid_settings()
    values[field] = "   "

    with pytest.raises(ValidationError, match=field):
        Settings(**values)


@pytest.mark.parametrize(
    "field,value",
    [(field, value) for field, values in INSECURE_EXAMPLE_VALUES.items() for value in values],
)
def test_settings_rejeita_valores_de_exemplo_inseguros(field, value):
    values = valid_settings()
    values[field] = value

    with pytest.raises(ValidationError, match=field):
        Settings(**values)


def test_settings_aceita_credenciais_proprias():
    settings = Settings(**valid_settings())

    assert settings.ADMIN_API_KEY == "credencial-administrativa-de-teste"


def test_settings_rejeita_admin_api_key_curta():
    values = valid_settings()
    values["ADMIN_API_KEY"] = "curta"

    with pytest.raises(ValidationError, match="ADMIN_API_KEY"):
        Settings(**values)


def test_settings_aceita_admin_api_key_com_32_caracteres():
    values = valid_settings()
    values["ADMIN_API_KEY"] = "a" * 32

    assert Settings(**values).ADMIN_API_KEY == values["ADMIN_API_KEY"]


@pytest.mark.parametrize(
    "field,value",
    [
        ("ROUTES_RATE_LIMIT", 0),
        ("ROUTES_RATE_LIMIT", 601),
        ("ROUTES_RATE_WINDOW_SECONDS", 0),
        ("ROUTES_RATE_WINDOW_SECONDS", 3601),
        ("ROUTE_DISTANCES_RATE_LIMIT", 0),
        ("ROUTE_DISTANCES_RATE_LIMIT", 601),
        ("ROUTE_DISTANCES_RATE_WINDOW_SECONDS", 0),
        ("ROUTE_DISTANCES_RATE_WINDOW_SECONDS", 3601),
    ],
)
def test_settings_rejeita_limites_publicos_invalidos(field, value):
    values = valid_settings()
    values[field] = value

    with pytest.raises(ValidationError, match=field):
        Settings(**values)


def test_settings_aceita_limites_publicos_configuraveis():
    settings = Settings(
        **valid_settings(),
        ROUTES_RATE_LIMIT=31,
        ROUTES_RATE_WINDOW_SECONDS=61,
        ROUTE_DISTANCES_RATE_LIMIT=21,
        ROUTE_DISTANCES_RATE_WINDOW_SECONDS=62,
    )

    assert settings.ROUTES_RATE_LIMIT == 31
    assert settings.ROUTES_RATE_WINDOW_SECONDS == 61
    assert settings.ROUTE_DISTANCES_RATE_LIMIT == 21
    assert settings.ROUTE_DISTANCES_RATE_WINDOW_SECONDS == 62


def test_autenticacao_administrativa_aceita_credencial_valida(monkeypatch):
    settings = Settings(**valid_settings())
    monkeypatch.setattr("app.auth.get_settings", lambda: settings)

    assert verify_api_key(settings.ADMIN_API_KEY) == "administrador-compartilhado"

    with pytest.raises(HTTPException, match="Chave de API inválida") as exc_info:
        verify_api_key("credencial-invalida")

    assert exc_info.value.status_code == 403
