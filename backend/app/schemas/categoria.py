from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CategoriaCreate(BaseModel):
    nome: str
    icone: Optional[str] = None

class CategoriaUpdate(BaseModel):
    nome: Optional[str] = None
    icone: Optional[str] = None

class CategoriaResponse(BaseModel):
    id: int
    nome: str
    icone: Optional[str] = None
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
