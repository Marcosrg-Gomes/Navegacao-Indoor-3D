from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime

TIPOS_PERMITIDOS = ['corredor', 'loja', 'entrada', 'escada', 'elevador', 'banheiro', 'saida']

class NoCreate(BaseModel):
    piso_id: int = Field(gt=0)
    coord_x: float = Field(ge=0.0, le=1.0)
    coord_y: float = Field(ge=0.0, le=1.0)
    tipo: str
    nome: Optional[str] = None
    ativo: bool = True

    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        if v not in TIPOS_PERMITIDOS:
            raise ValueError(f"O tipo deve ser um dos seguintes: {', '.join(TIPOS_PERMITIDOS)}")
        return v

from app.schemas.patch import PatchModel


class NoUpdate(PatchModel):
    non_nullable = {"piso_id", "coord_x", "coord_y", "tipo", "ativo"}
    piso_id: Optional[int] = Field(default=None, gt=0)
    coord_x: Optional[float] = Field(None, ge=0.0, le=1.0)
    coord_y: Optional[float] = Field(None, ge=0.0, le=1.0)
    tipo: Optional[str] = None
    nome: Optional[str] = None
    ativo: Optional[bool] = None

    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in TIPOS_PERMITIDOS:
            raise ValueError(f"O tipo deve ser um dos seguintes: {', '.join(TIPOS_PERMITIDOS)}")
        return v

class NoResponse(BaseModel):
    id: int
    piso_id: int
    coord_x: float
    coord_y: float
    tipo: str
    nome: Optional[str] = None
    ativo: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
