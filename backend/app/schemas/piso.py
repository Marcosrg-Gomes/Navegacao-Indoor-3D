from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class PisoCreate(BaseModel):
    shopping_id: int
    nome: str
    nivel: int
    imagem_planta_url: Optional[str] = None
    largura_metros: Optional[float] = None
    altura_metros: Optional[float] = None

class PisoUpdate(BaseModel):
    shopping_id: Optional[int] = None
    nome: Optional[str] = None
    nivel: Optional[int] = None
    imagem_planta_url: Optional[str] = None
    largura_metros: Optional[float] = None
    altura_metros: Optional[float] = None

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
