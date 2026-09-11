from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime

class ShoppingCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    endereco: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ativo: bool = True

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("O nome do shopping não pode ser vazio")
        return value

from app.schemas.patch import PatchModel


class ShoppingUpdate(PatchModel):
    non_nullable = {"nome", "ativo"}
    nome: Optional[str] = Field(default=None, min_length=1, max_length=200)
    endereco: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ativo: Optional[bool] = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("O nome do shopping não pode ser vazio")
        return value

class ShoppingResponse(BaseModel):
    id: int
    nome: str
    endereco: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ativo: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
