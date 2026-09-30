from pydantic import BaseModel, Field, model_validator
from typing import List, Optional

class RotaRequest(BaseModel):
    origem_no_id: int = Field(gt=0)
    destino_no_id: int = Field(gt=0)
    acessivel: bool = False
    confirmar_indisponivel: bool = False

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

class InstrucaoRota(BaseModel):
    texto: str
    no_id: Optional[int] = None

class EtapaRota(BaseModel):
    texto: str
    tipo: str
    no_origem_id: int
    no_destino_id: int
    piso_origem_id: int
    piso_destino_id: int
    distancia_metros: float = 0
    referencia: Optional[str] = None
    referencia_no_id: Optional[int] = None

class ResumoRota(BaseModel):
    metros_corredor: float
    elevadores: int
    escadas: int
    minutos_estimados: int

class RotaResponse(BaseModel):
    sucesso: bool
    nos: List[NoRota]
    distancia_total_metros: float
    instrucoes: List[str]
    etapas: List[EtapaRota] = Field(default_factory=list)
    resumo: Optional[ResumoRota] = None
    revisao: str

class RotaErro(BaseModel):
    sucesso: bool = False
    mensagem: str
