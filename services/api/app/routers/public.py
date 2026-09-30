from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from pydantic import BaseModel, ConfigDict, Field

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
from app.services.navigation_state import navigation_state
from app.services.diagnostics import record_failure
from app.services.opening_hours import open_now

router = APIRouter(tags=["Público"])


class DiagnosticEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tipo: Literal["rota", "qr", "mapa_2d", "mapa_3d"]
    codigo: Literal["rede", "timeout", "resposta_invalida", "indisponivel", "sem_rota"]


@router.post("/diagnostics/events", status_code=204)
def registrar_diagnostico(event: DiagnosticEvent, db: Session = Depends(get_db)):
    record_failure(db, event.tipo, event.codigo)


@router.get("/shoppings/{shopping_id}/navigation-state")
def estado_navegacao(shopping_id: int, db: Session = Depends(get_db)):
    return navigation_state(db, shopping_id)

from app.schemas.scene import SceneResponse
from app.services.scenes import resolve_scene


@router.get("/shoppings/{shopping_id}/scene", response_model=SceneResponse)
def obter_cena(shopping_id: int, db: Session = Depends(get_db)):
    return resolve_scene(db, shopping_id)

class GraphResponse(BaseModel):
    piso_id: int
    piso_nome: str
    nos: List[NoResponse]
    arestas: List[ArestaResponse]
    conexoes_entre_pisos: dict[int, list[int]] = Field(default_factory=dict)
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
    piso = (
        db.query(Piso)
        .join(Shopping, Piso.shopping_id == Shopping.id)
        .filter(Piso.id == piso_id, Piso.ativo.is_(True), Shopping.ativo.is_(True))
        .first()
    )
    if not piso:
        raise HTTPException(status_code=404, detail="Piso não encontrado ou inativo")
    
    nos = db.query(No).filter(No.piso_id == piso_id, No.ativo == True).all()
    no_ids = [no.id for no in nos]
    
    if no_ids:
        arestas = db.query(Aresta).filter(
            Aresta.ativa == True,
            Aresta.no_origem_id.in_(no_ids),
            Aresta.no_destino_id.in_(no_ids)
        ).all()
    else:
        arestas = []
        
    # Keep drawing edges on their floor; expose only traversable outgoing
    # floor connections separately for elevator/service information.
    conexoes = {}
    if any(no.tipo in {"elevador", "escada", "escada_rolante"} for no in nos):
        grafo = NavigationEngine(db)._build_graph(shopping_id=piso.shopping_id)
        locais = set(no_ids)
        conexoes = {no.id: [destino for destino, _ in grafo.get(no.id, []) if destino not in locais]
                    for no in nos if no.tipo in {"elevador", "escada", "escada_rolante"}}
    return GraphResponse(
        piso_id=piso.id,
        piso_nome=piso.nome,
        nos=nos,
        arestas=arestas,
        conexoes_entre_pisos=conexoes,
    )

@router.post("/routes", response_model=RotaResponse)
def calcular_rota(request: RotaRequest, db: Session = Depends(get_db)):
    """Calcula a melhor rota entre dois pontos."""
    engine = NavigationEngine(db)
    origem = engine._obter_no_navegavel(request.origem_no_id)
    revisao = navigation_state(db, origem.piso.shopping_id)["revisao"] if origem else "ausente"
    destino = db.query(Loja).filter_by(no_id=request.destino_no_id).first()
    if destino and (not destino.ativo or (open_now(destino.status_operacional, destino.horario_funcionamento) is False and not request.confirmar_indisponivel)):
        record_failure(db, "rota", "indisponivel")
        raise HTTPException(409, "Destino indisponível. Abra suas informações e confirme o aviso para consultar o trajeto." if destino.ativo else "Destino não publicado ou inativo.",
                            headers={"X-Error-Code": "DESTINO_INDISPONIVEL"})
    result = engine.calcular_rota(request.origem_no_id, request.destino_no_id, request.acessivel)
    
    if not result.get("sucesso"):
        record_failure(db, "rota", "sem_rota" if result.get("codigo") == "SEM_ROTA" else "indisponivel")
        raise HTTPException(
            status_code=result.get("status_code", 404),
            detail=result.get("mensagem") or "Rota não encontrada",
            headers={"X-Error-Code": result.get("codigo", "SEM_ROTA")},
        )

    return {**result, "revisao": revisao}

@router.get("/routes/distances", response_model=dict[int, float])
def distancias_da_origem(
    origem_no_id: int = Query(..., gt=0),
    acessivel: bool = False,
    db: Session = Depends(get_db),
):
    """Distâncias pelos caminhos atuais, somente no shopping da origem."""
    result = NavigationEngine(db).calcular_distancias(origem_no_id, acessivel)
    if result is None:
        raise HTTPException(status_code=404, detail="Origem não encontrada ou inativa")
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
    query = (
        db.query(Loja)
        .join(No, Loja.no_id == No.id)
        .join(Piso, No.piso_id == Piso.id)
        .join(Shopping, Piso.shopping_id == Shopping.id)
        .outerjoin(Categoria, Loja.categoria_id == Categoria.id)
        .options(joinedload(Loja.categoria))
        .filter(
            Loja.ativo.is_(True),
            No.ativo.is_(True),
            Piso.ativo.is_(True),
            Shopping.ativo.is_(True),
        )
    )
    
    if q:
        termo = q.strip()
        if termo:
            # RF05: a partial search must find both POI names and category
            # labels (for example, "alim" finds all Alimentação POIs).
            query = query.filter(
                or_(Loja.nome.ilike(f"%{termo}%"), Categoria.nome.ilike(f"%{termo}%"))
            )
    if categoria_id is not None:
        query = query.filter(Loja.categoria_id == categoria_id)
    if piso_id is not None:
        query = query.filter(No.piso_id == piso_id)
    if shopping_id is not None:
        query = query.filter(Piso.shopping_id == shopping_id)
        
    lojas = query.all()
    return lojas

@router.get("/pois/{loja_id}", response_model=LojaResponse)
def obter_poi(loja_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de um Ponto de Interesse (POI)."""
    loja = (
        db.query(Loja)
        .join(No, Loja.no_id == No.id)
        .join(Piso, No.piso_id == Piso.id)
        .join(Shopping, Piso.shopping_id == Shopping.id)
        .options(joinedload(Loja.categoria))
        .filter(
            Loja.id == loja_id,
            Loja.ativo.is_(True),
            No.ativo.is_(True),
            Piso.ativo.is_(True),
            Shopping.ativo.is_(True),
        )
        .first()
    )
    if not loja:
        raise HTTPException(status_code=404, detail="POI não encontrado ou inativo")
    return loja

@router.get("/qr-codes/{token}", response_model=QRCodeResolveResponse)
def resolver_qr_code(token: str, db: Session = Depends(get_db)):
    """Resolve um token de QR Code para seu nó correspondente."""
    qr_code = (
        db.query(QRCode)
        .join(No, QRCode.no_id == No.id)
        .join(Piso, No.piso_id == Piso.id)
        .join(Shopping, Piso.shopping_id == Shopping.id)
        .filter(
            QRCode.token == token,
            QRCode.ativo.is_(True),
            No.ativo.is_(True),
            Piso.ativo.is_(True),
            Shopping.ativo.is_(True),
        )
        .first()
    )
    if not qr_code:
        record_failure(db, "qr", "indisponivel")
        raise HTTPException(status_code=404, detail="QR Code não encontrado ou inativo")
        
    return QRCodeResolveResponse(
        qr_code=qr_code,
        no=qr_code.no
    )
