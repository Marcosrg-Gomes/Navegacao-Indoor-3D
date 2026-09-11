from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import Optional, Any
from datetime import datetime
import uuid

class QRCodeCreate(BaseModel):
    no_id: int = Field(gt=0)
    token: Optional[str] = Field(default=None, min_length=1, max_length=100)
    ativo: bool = True

    @model_validator(mode='before')
    @classmethod
    def generate_token_if_missing(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if 'token' not in data or not data['token']:
                data['token'] = str(uuid.uuid4())
        return data

    @field_validator("token")
    @classmethod
    def normalizar_token(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and (not value.strip() or "/" in value or "\\" in value):
            raise ValueError("Use um token não vazio, sem barras")
        return value.strip() if value else value

from app.schemas.patch import PatchModel


class QRCodeUpdate(PatchModel):
    non_nullable = {"no_id", "token", "ativo"}
    no_id: Optional[int] = Field(default=None, gt=0)
    token: Optional[str] = Field(default=None, min_length=1, max_length=100)
    ativo: Optional[bool] = None

    @field_validator("token")
    @classmethod
    def normalizar_token(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value or "/" in value or "\\" in value:
            raise ValueError("O token não pode ser vazio")
        return value

class QRCodeResponse(BaseModel):
    id: int
    no_id: int
    token: str
    ativo: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
