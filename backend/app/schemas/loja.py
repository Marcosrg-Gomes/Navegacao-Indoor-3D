from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class LojaCreate(BaseModel):
    no_id: int
    nome: str
    descricao: Optional[str] = None
    categoria_id: Optional[int] = None
    horario_funcionamento: Optional[str] = None
    telefone: Optional[str] = None
    logo_url: Optional[str] = None

class LojaUpdate(BaseModel):
    no_id: Optional[int] = None
    nome: Optional[str] = None
    descricao: Optional[str] = None
    categoria_id: Optional[int] = None
    horario_funcionamento: Optional[str] = None
    telefone: Optional[str] = None
    logo_url: Optional[str] = None

class LojaResponse(BaseModel):
    id: int
    no_id: int
    nome: str
    descricao: Optional[str] = None
    categoria_id: Optional[int] = None
    horario_funcionamento: Optional[str] = None
    telefone: Optional[str] = None
    logo_url: Optional[str] = None
    ativo: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    categoria_nome: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
