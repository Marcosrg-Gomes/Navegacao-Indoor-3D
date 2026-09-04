from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel, ConfigDict

from app.database import get_db
from app.models import Shopping, Piso, No, Aresta, Loja, Categoria, QRCode
from app.schemas.shopping import ShoppingResponse
from app.schemas.piso import PisoResponse  
from app.schemas.no import NoResponse
from app.schemas.aresta import ArestaResponse
from app.schemas.loja import LojaResponse
from app.schemas.qr_code import QRCodeResponse
from app.schemas.rota import RotaRequest, RotaResponse
from app.services.navigation import NavigationEngine

router = APIRouter(tags=["Público"])

class GraphResponse(BaseModel):
    piso_id: int
    piso_nome: str
    nos: List[NoResponse]
    arestas: List[ArestaResponse]
    model_config = ConfigDict(from_attributes=True)

class QRCodeResolveResponse(BaseModel):
    qr_code: QRCodeResponse
    no: NoResponse
    model_config = ConfigDict(from_attributes=True)

@router.get("/shoppings", response_model=List[ShoppingResponse])
def listar_shoppings(db: Session = Depends(get_db)):
    """Lista todos os shoppings ativos."""
    return db.query(Shopping).filter(Shopping.ativo == True).all()

@router.get("/shoppings/{shopping_id}", response_model=ShoppingResponse)
def obter_shopping(shopping_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de um shopping específico."""
    shopping = db.query(Shopping).filter(Shopping.id == shopping_id, Shopping.ativo == True).first()
    if not shopping:
        raise HTTPException(status_code=404, detail="Shopping não encontrado ou inativo")
    return shopping

@router.get("/shoppings/{shopping_id}/floors", response_model=List[PisoResponse])
def listar_pisos_shopping(shopping_id: int, db: Session = Depends(get_db)):
    """Lista todos os pisos ativos de um shopping."""
    shopping = db.query(Shopping).filter(Shopping.id == shopping_id, Shopping.ativo == True).first()
    if not shopping:
        raise HTTPException(status_code=404, detail="Shopping não encontrado ou inativo")
    
    return db.query(Piso).filter(Piso.shopping_id == shopping_id, Piso.ativo == True).order_by(Piso.nivel).all()

@router.get("/floors/{piso_id}/graph", response_model=GraphResponse)
def obter_grafo_piso(piso_id: int, db: Session = Depends(get_db)):
    """Obtém os nós e arestas (grafo) de um piso."""
    piso = db.query(Piso).filter(Piso.id == piso_id, Piso.ativo == True).first()
    if not piso:
        raise HTTPException(status_code=404, detail="Piso não encontrado ou inativo")
    
    nos = db.query(No).filter(No.piso_id == piso_id, No.ativo == True).all()
    no_ids = [no.id for no in nos]
    
    if no_ids:
        arestas = db.query(Aresta).filter(
            Aresta.ativo == True,
            Aresta.origem_id.in_(no_ids),
            Aresta.destino_id.in_(no_ids)
        ).all()
    else:
        arestas = []
        
    return GraphResponse(
        piso_id=piso.id,
        piso_nome=piso.nome,
        nos=nos,
        arestas=arestas
    )

@router.post("/routes", response_model=RotaResponse)
def calcular_rota(request: RotaRequest, db: Session = Depends(get_db)):
    """Calcula a melhor rota entre dois pontos."""
    engine = NavigationEngine(db)
    result = engine.calcular_rota(request.origem_no_id, request.destino_no_id, request.acessivel)
    
    if not result.sucesso:
        raise HTTPException(status_code=404, detail=result.mensagem or "Rota não encontrada")
        
    return result

@router.get("/pois", response_model=List[LojaResponse])
def listar_pois(
    q: Optional[str] = Query(None, description="Termo de busca (nome)"),
    categoria_id: Optional[int] = Query(None, description="ID da categoria"),
    shopping_id: Optional[int] = Query(None, description="ID do shopping"),
    piso_id: Optional[int] = Query(None, description="ID do piso"),
    db: Session = Depends(get_db)
):
    """Lista Pontos de Interesse (POIs/Lojas) com filtros opcionais."""
    query = db.query(Loja).join(No).filter(Loja.ativo == True, No.ativo == True)
    
    if q:
        query = query.filter(Loja.nome.ilike(f"%{q}%"))
    if categoria_id:
        query = query.filter(Loja.categoria_id == categoria_id)
    if piso_id:
        query = query.filter(No.piso_id == piso_id)
    if shopping_id:
        query = query.join(Piso, No.piso_id == Piso.id).filter(Piso.shopping_id == shopping_id)
        
    lojas = query.all()
    return lojas

@router.get("/pois/{loja_id}", response_model=LojaResponse)
def obter_poi(loja_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de um Ponto de Interesse (POI)."""
    loja = db.query(Loja).filter(Loja.id == loja_id, Loja.ativo == True).first()
    if not loja:
        raise HTTPException(status_code=404, detail="POI não encontrado ou inativo")
    return loja

@router.get("/qr-codes/{token}", response_model=QRCodeResolveResponse)
def resolver_qr_code(token: str, db: Session = Depends(get_db)):
    """Resolve um token de QR Code para seu nó correspondente."""
    qr_code = db.query(QRCode).filter(QRCode.token == token, QRCode.ativo == True).first()
    if not qr_code or not qr_code.no or not qr_code.no.ativo:
        raise HTTPException(status_code=404, detail="QR Code não encontrado ou inativo")
        
    return QRCodeResolveResponse(
        qr_code=qr_code,
        no=qr_code.no
    )
