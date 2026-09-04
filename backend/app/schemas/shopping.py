from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ShoppingCreate(BaseModel):
    nome: str
    endereco: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ShoppingUpdate(BaseModel):
    nome: Optional[str] = None
    endereco: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

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
