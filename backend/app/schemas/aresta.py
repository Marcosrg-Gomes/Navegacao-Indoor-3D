from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class ArestaCreate(BaseModel):
    no_origem_id: int
    no_destino_id: int
    distancia: Optional[float] = Field(None, gt=0)
    bidirecional: bool = True
    acessivel: bool = True
    ativa: bool = True

class ArestaUpdate(BaseModel):
    no_origem_id: Optional[int] = None
    no_destino_id: Optional[int] = None
    distancia: Optional[float] = Field(None, gt=0)
    bidirecional: Optional[bool] = None
    acessivel: Optional[bool] = None
    ativa: Optional[bool] = None

class ArestaResponse(BaseModel):
    id: int
    no_origem_id: int
    no_destino_id: int
    distancia: Optional[float] = None
    bidirecional: bool
    acessivel: bool
    ativa: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
