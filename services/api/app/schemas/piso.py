from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime

class PisoCreate(BaseModel):
    shopping_id: int = Field(gt=0)
    nome: str = Field(min_length=1, max_length=100)
    nivel: int
    imagem_planta_url: Optional[str] = None
    largura_metros: Optional[float] = Field(default=None, gt=0)
    altura_metros: Optional[float] = Field(default=None, gt=0)
    ativo: bool = True

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("O nome do piso não pode ser vazio")
        return value

from app.schemas.patch import PatchModel


class PisoUpdate(PatchModel):
    non_nullable = {"shopping_id", "nome", "nivel", "ativo"}
    shopping_id: Optional[int] = Field(default=None, gt=0)
    nome: Optional[str] = Field(default=None, min_length=1, max_length=100)
    nivel: Optional[int] = None
    imagem_planta_url: Optional[str] = None
    largura_metros: Optional[float] = Field(default=None, gt=0)
    altura_metros: Optional[float] = Field(default=None, gt=0)
    ativo: Optional[bool] = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("O nome do piso não pode ser vazio")
        return value

class PisoResponse(BaseModel):
    id: int
    shopping_id: int
    nome: str
    nivel: int
    imagem_planta_url: Optional[str] = None
    largura_metros: Optional[float] = None
    altura_metros: Optional[float] = None
    ativo: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
