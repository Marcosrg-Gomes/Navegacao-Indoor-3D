from pydantic import BaseModel, Field, model_validator
from typing import List, Optional

class RotaRequest(BaseModel):
    origem_no_id: int = Field(gt=0)
    destino_no_id: int = Field(gt=0)
    acessivel: bool = False

    @model_validator(mode='after')
    def validar_origem_destino(self) -> 'RotaRequest':
        if self.origem_no_id == self.destino_no_id:
            raise ValueError("O nó de origem não pode ser igual ao nó de destino.")
        return self

class NoRota(BaseModel):
    id: int
    coord_x: float
    coord_y: float
    tipo: str
    nome: Optional[str] = None
    piso_id: int

class RotaResponse(BaseModel):
    sucesso: bool
    nos: List[NoRota]
    distancia_total_metros: float
    instrucoes: List[str]

class RotaErro(BaseModel):
    sucesso: bool = False
    mensagem: str
