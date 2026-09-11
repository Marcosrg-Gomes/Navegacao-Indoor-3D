from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime

class CategoriaCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    icone: Optional[str] = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("O nome da categoria não pode ser vazio")
        return value

from app.schemas.patch import PatchModel


class CategoriaUpdate(PatchModel):
    non_nullable = {"nome"}
    nome: Optional[str] = Field(default=None, min_length=1, max_length=100)
    icone: Optional[str] = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("O nome da categoria não pode ser vazio")
        return value

class CategoriaResponse(BaseModel):
    id: int
    nome: str
    icone: Optional[str] = None
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
