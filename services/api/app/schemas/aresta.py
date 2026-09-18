from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional
from datetime import datetime

class ArestaCreate(BaseModel):
    no_origem_id: int = Field(gt=0)
    no_destino_id: int = Field(gt=0)
    distancia: Optional[float] = Field(None, gt=0)
    bidirecional: bool = True
    acessivel: bool = True
    ativa: bool = True

    @model_validator(mode="after")
    def validar_extremos(self) -> "ArestaCreate":
        if self.no_origem_id == self.no_destino_id:
            raise ValueError("Os nós de origem e destino devem ser diferentes")
        return self

from app.schemas.patch import PatchModel


class ArestaUpdate(PatchModel):
    non_nullable = {"no_origem_id", "no_destino_id", "bidirecional", "acessivel", "ativa"}
    no_origem_id: Optional[int] = Field(default=None, gt=0)
    no_destino_id: Optional[int] = Field(default=None, gt=0)
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
