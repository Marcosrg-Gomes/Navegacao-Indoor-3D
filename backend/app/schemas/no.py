from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime

TIPOS_PERMITIDOS = ['corredor', 'loja', 'entrada', 'escada', 'elevador', 'banheiro', 'saida']

class NoCreate(BaseModel):
    piso_id: int
    coord_x: float = Field(ge=0.0, le=1.0)
    coord_y: float = Field(ge=0.0, le=1.0)
    tipo: str
    nome: Optional[str] = None

    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        if v not in TIPOS_PERMITIDOS:
            raise ValueError(f"O tipo deve ser um dos seguintes: {', '.join(TIPOS_PERMITIDOS)}")
        return v

class NoUpdate(BaseModel):
    piso_id: Optional[int] = None
    coord_x: Optional[float] = Field(None, ge=0.0, le=1.0)
    coord_y: Optional[float] = Field(None, ge=0.0, le=1.0)
    tipo: Optional[str] = None
    nome: Optional[str] = None

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
