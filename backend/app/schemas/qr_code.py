from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional, Any
from datetime import datetime
import uuid

class QRCodeCreate(BaseModel):
    no_id: int
    token: Optional[str] = None
    ativo: bool = True

    @model_validator(mode='before')
    @classmethod
    def generate_token_if_missing(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if 'token' not in data or not data['token']:
                data['token'] = str(uuid.uuid4())
        return data

class QRCodeUpdate(BaseModel):
    no_id: Optional[int] = None
    token: Optional[str] = None
    ativo: Optional[bool] = None

class QRCodeResponse(BaseModel):
    id: int
    no_id: int
    token: str
    ativo: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
