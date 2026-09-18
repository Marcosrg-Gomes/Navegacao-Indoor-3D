from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from app.config import get_settings

settings = get_settings()

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Verifica a validade da chave de API informada no cabeçalho.
    """
    if api_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chave de API inválida"
        )
    return api_key
