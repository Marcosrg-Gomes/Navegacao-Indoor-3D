from app.codes import Code, new_code
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime


class StatusOperacional(str, Enum):
    """Estados visíveis para o visitante, distintos do soft-delete ``ativo``."""

    aberto = "aberto"
    fechado = "fechado"
    manutencao = "manutencao"


class LojaCreate(BaseModel):
    codigo: Code = Field(default_factory=new_code)
    no_id: int = Field(gt=0)
    nome: str = Field(min_length=1, max_length=200)
    descricao: Optional[str] = None
    categoria_id: int = Field(gt=0)
    horario_funcionamento: Optional[str] = None
    telefone: Optional[str] = None
    logo_url: Optional[str] = None
    status_operacional: StatusOperacional
    ativo: bool = True

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("O nome do POI não pode ser vazio")
        return value

from app.schemas.patch import PatchModel


class LojaUpdate(PatchModel):
    codigo: Optional[Code] = None
    non_nullable = {"codigo", "no_id", "nome", "categoria_id", "status_operacional", "ativo"}
    no_id: Optional[int] = Field(default=None, gt=0)
    nome: Optional[str] = Field(default=None, min_length=1, max_length=200)
    descricao: Optional[str] = None
    categoria_id: Optional[int] = Field(default=None, gt=0)
    horario_funcionamento: Optional[str] = None
    telefone: Optional[str] = None
    logo_url: Optional[str] = None
    status_operacional: Optional[StatusOperacional] = None
    ativo: Optional[bool] = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("O nome do POI não pode ser vazio")
        return value

class LojaResponse(BaseModel):
    codigo: str
    id: int
    no_id: int
    nome: str
    descricao: Optional[str] = None
    categoria_id: int
    horario_funcionamento: Optional[str] = None
    telefone: Optional[str] = None
    logo_url: Optional[str] = None
    status_operacional: StatusOperacional
    ativo: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    categoria_nome: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
