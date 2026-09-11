from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
import uuid
import math
import shutil
from pathlib import Path
from collections import defaultdict, deque

from app.database import get_db
from app.auth import verify_api_key
from app.models import Shopping, Piso, No, Aresta, Loja, Categoria, QRCode
import app.schemas as schemas
from app.services.navigation import NavigationEngine
from app.services.uploads import MAX_UPLOAD_BYTES, validate_image

router = APIRouter(
    tags=["Admin"],
    dependencies=[Depends(verify_api_key)]
)


TIPOS_TRANSICAO_ENTRE_PISOS = {"escada", "elevador"}


def _obter_no_para_aresta(db: Session, no_id: int, papel: str) -> tuple[No, Piso]:
    """Load an edge endpoint and its floor with a clear API error."""
    no = db.query(No).filter(No.id == no_id).first()
    if not no:
        raise HTTPException(status_code=400, detail=f"Nó de {papel} não encontrado")
    piso = db.query(Piso).filter(Piso.id == no.piso_id).first()
    if not piso:
        raise HTTPException(status_code=400, detail=f"Piso do nó de {papel} não encontrado")
    return no, piso


def _validar_extremos_aresta(
    db: Session, no_origem_id: int, no_destino_id: int
) -> tuple[No, No, Piso]:
    """Enforce graph invariants before persisting an edge.

    Cross-floor connectors are valid only inside one shopping and only between
    stair/elevator nodes.  The latter keeps arbitrary floor-to-floor links
    from silently bypassing the physical vertical circulation.
    """
    if no_origem_id == no_destino_id:
        raise HTTPException(status_code=400, detail="Os nós de origem e destino devem ser diferentes")

    origem, piso_origem = _obter_no_para_aresta(db, no_origem_id, "origem")
    destino, piso_destino = _obter_no_para_aresta(db, no_destino_id, "destino")

    if piso_origem.shopping_id != piso_destino.shopping_id:
        raise HTTPException(
            status_code=400,
            detail="Uma aresta não pode conectar nós de shoppings diferentes",
        )

    if piso_origem.id != piso_destino.id and (
        origem.tipo not in TIPOS_TRANSICAO_ENTRE_PISOS
        or destino.tipo not in TIPOS_TRANSICAO_ENTRE_PISOS
    ):
        raise HTTPException(
            status_code=400,
            detail="Conexões entre pisos devem ligar nós de escada ou elevador",
        )

    return origem, destino, piso_origem


def _resolver_distancia_aresta(
    origem: No, destino: No, piso_origem: Piso, distancia: Optional[float]
) -> float:
    """Use measured geometry on one floor; require an explicit vertical cost."""
    if distancia is not None:
        return distancia
    if origem.piso_id != destino.piso_id:
        raise HTTPException(
            status_code=422,
            detail="Informe a distância em metros para uma conexão entre pisos",
        )

    largura = float(piso_origem.largura_metros or 100)
    altura = float(piso_origem.altura_metros or 60)
    distancia = round(NavigationEngine.calcular_distancia(origem, destino, largura, altura), 2)
    if distancia <= 0:
        raise HTTPException(status_code=422, detail="Nós coincidentes precisam de uma distância positiva explícita")
    return distancia


def _validar_categoria(db: Session, categoria_id: Optional[int]) -> None:
    if categoria_id is None:
        raise HTTPException(status_code=400, detail="Todo POI deve possuir uma categoria")
    if not db.query(Categoria).filter(Categoria.id == categoria_id).first():
        raise HTTPException(status_code=400, detail="Categoria associada não encontrada")

# ==========================================
# SHOPPINGS
# ==========================================

@router.get("/shoppings", response_model=List[schemas.ShoppingResponse])
def listar_shoppings(db: Session = Depends(get_db)):
    """Lista todos os shoppings, incluindo inativos."""
    return db.query(Shopping).all()

@router.post("/shoppings", response_model=schemas.ShoppingResponse, status_code=201)
def criar_shopping(shopping: schemas.ShoppingCreate, db: Session = Depends(get_db)):
    """Cria um novo shopping."""
    db_shopping = Shopping(**shopping.model_dump())
    db.add(db_shopping)
    db.commit()
    db.refresh(db_shopping)
    return db_shopping

@router.get("/shoppings/{id}", response_model=schemas.ShoppingResponse)
def obter_shopping(id: int, db: Session = Depends(get_db)):
    """Obtém um shopping pelo ID."""
    shopping = db.query(Shopping).filter(Shopping.id == id).first()
    if not shopping:
        raise HTTPException(status_code=404, detail="Shopping não encontrado")
    return shopping

@router.put("/shoppings/{id}", response_model=schemas.ShoppingResponse)
def atualizar_shopping(id: int, shopping_update: schemas.ShoppingUpdate, db: Session = Depends(get_db)):
    """Atualiza os dados de um shopping."""
    db_shopping = db.query(Shopping).filter(Shopping.id == id).first()
    if not db_shopping:
        raise HTTPException(status_code=404, detail="Shopping não encontrado")
    
    update_data = shopping_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_shopping, key, value)
        
    db.commit()
    db.refresh(db_shopping)
    return db_shopping

@router.delete("/shoppings/{id}", status_code=204)
def deletar_shopping(id: int, db: Session = Depends(get_db)):
    """Exclui logicamente (soft delete) um shopping."""
    db_shopping = db.query(Shopping).filter(Shopping.id == id).first()
    if not db_shopping:
        raise HTTPException(status_code=404, detail="Shopping não encontrado")
    db_shopping.ativo = False
    db.commit()
    return None


# ==========================================
# FLOORS (PISOS)
# ==========================================

@router.get("/floors", response_model=List[schemas.PisoResponse])
def listar_pisos(shopping_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Lista todos os pisos. Opcionalmente filtra por shopping."""
    query = db.query(Piso)
    if shopping_id:
        query = query.filter(Piso.shopping_id == shopping_id)
    return query.all()

@router.post("/floors", response_model=schemas.PisoResponse, status_code=201)
def criar_piso(piso: schemas.PisoCreate, db: Session = Depends(get_db)):
    """Cria um novo piso, validando o shopping."""
    shopping = db.query(Shopping).filter(Shopping.id == piso.shopping_id).first()
    if not shopping:
        raise HTTPException(status_code=400, detail="Shopping associado não encontrado")
    
    db_piso = Piso(**piso.model_dump())
    db.add(db_piso)
    db.commit()
    db.refresh(db_piso)
    return db_piso

@router.get("/floors/{id}", response_model=schemas.PisoResponse)
def obter_piso(id: int, db: Session = Depends(get_db)):
    """Obtém um piso pelo ID."""
    piso = db.query(Piso).filter(Piso.id == id).first()
    if not piso:
        raise HTTPException(status_code=404, detail="Piso não encontrado")
    return piso

@router.put("/floors/{id}", response_model=schemas.PisoResponse)
def atualizar_piso(id: int, piso_update: schemas.PisoUpdate, db: Session = Depends(get_db)):
    """Atualiza os dados de um piso."""
    db_piso = db.query(Piso).filter(Piso.id == id).first()
    if not db_piso:
        raise HTTPException(status_code=404, detail="Piso não encontrado")
        
    update_data = piso_update.model_dump(exclude_unset=True)
    novo_shopping_id = update_data.get("shopping_id")
    if novo_shopping_id is not None and novo_shopping_id != db_piso.shopping_id:
        if not db.query(Shopping).filter(Shopping.id == novo_shopping_id).first():
            raise HTTPException(status_code=400, detail="Shopping associado não encontrado")
        if db.query(No).filter(No.piso_id == db_piso.id).count() > 0:
            raise HTTPException(
                status_code=400,
                detail="Não é possível mover um piso com nós cadastrados para outro shopping",
            )
    for key, value in update_data.items():
        setattr(db_piso, key, value)
        
    db.commit()
    db.refresh(db_piso)
    return db_piso

@router.delete("/floors/{id}", status_code=204)
def deletar_piso(id: int, db: Session = Depends(get_db)):
    """Deleta um piso."""
    db_piso = db.query(Piso).filter(Piso.id == id).first()
    if not db_piso:
        raise HTTPException(status_code=404, detail="Piso não encontrado")
    if db.query(No).filter(No.piso_id == id).count() > 0:
        raise HTTPException(
            status_code=400,
            detail="Piso possui nós cadastrados. Remova os nós e suas referências primeiro.",
        )
    db.delete(db_piso)
    db.commit()
    return None

@router.post("/floors/{id}/upload-planta", response_model=schemas.PisoResponse)
async def upload_planta_piso(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Faz upload de uma imagem de planta baixa para o piso especificado.
    Formatos aceitos: png, jpg, jpeg, svg, webp.
    Salva o arquivo em backend/app/static/plantas/ e atualiza o campo imagem_planta_url.
    """
    db_piso = db.query(Piso).filter(Piso.id == id).first()
    if not db_piso:
        raise HTTPException(status_code=404, detail="Piso não encontrado")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in [".png", ".jpg", ".jpeg", ".svg", ".webp"]:
        raise HTTPException(
            status_code=400,
            detail="Formato de arquivo inválido. Permitidos: .png, .jpg, .jpeg, .svg, .webp"
        )

    static_plantas = Path(__file__).resolve().parent.parent / "static" / "plantas"
    static_plantas.mkdir(parents=True, exist_ok=True)

    filename = f"piso_{id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = static_plantas / filename

    data = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    validate_image(data, ext)
    dest_path.write_bytes(data)

    db_piso.imagem_planta_url = f"/static/plantas/{filename}"
    db.commit()
    db.refresh(db_piso)
    return db_piso


# ==========================================
# NODES (NÓS)
# ==========================================

@router.get("/nodes", response_model=List[schemas.NoResponse])
def listar_nos(piso_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Lista todos os nós. Opcionalmente filtra por piso."""
    query = db.query(No)
    if piso_id:
        query = query.filter(No.piso_id == piso_id)
    return query.all()

@router.post("/nodes", response_model=schemas.NoResponse, status_code=201)
def criar_no(no: schemas.NoCreate, db: Session = Depends(get_db)):
    """Cria um novo nó, validando o piso."""
    piso = db.query(Piso).filter(Piso.id == no.piso_id).first()
    if not piso:
        raise HTTPException(status_code=400, detail="Piso associado não encontrado")
        
    db_no = No(**no.model_dump())
    db.add(db_no)
    db.commit()
    db.refresh(db_no)
    return db_no

@router.get("/nodes/{id}", response_model=schemas.NoResponse)
def obter_no(id: int, db: Session = Depends(get_db)):
    """Obtém um nó pelo ID."""
    no = db.query(No).filter(No.id == id).first()
    if not no:
        raise HTTPException(status_code=404, detail="Nó não encontrado")
    return no

@router.put("/nodes/{id}", response_model=schemas.NoResponse)
def atualizar_no(id: int, no_update: schemas.NoUpdate, db: Session = Depends(get_db)):
    """Atualiza os dados de um nó."""
    db_no = db.query(No).filter(No.id == id).first()
    if not db_no:
        raise HTTPException(status_code=404, detail="Nó não encontrado")
        
    update_data = no_update.model_dump(exclude_unset=True)
    novo_piso_id = update_data.get("piso_id")
    if novo_piso_id is not None and novo_piso_id != db_no.piso_id:
        novo_piso = db.query(Piso).filter(Piso.id == novo_piso_id).first()
        if not novo_piso:
            raise HTTPException(status_code=400, detail="Piso associado não encontrado")
        if db.query(Aresta).filter(
            or_(Aresta.no_origem_id == id, Aresta.no_destino_id == id)
        ).count() > 0:
            raise HTTPException(
                status_code=400,
                detail="Não é possível mover um nó com arestas conectadas para outro piso",
            )
    for key, value in update_data.items():
        setattr(db_no, key, value)

    if "tipo" in update_data:
        with db.no_autoflush:
            for edge in db.query(Aresta).filter(or_(Aresta.no_origem_id == id, Aresta.no_destino_id == id)).all():
                _validar_extremos_aresta(db, edge.no_origem_id, edge.no_destino_id)
        
    db.commit()
    db.refresh(db_no)
    return db_no

@router.delete("/nodes/{id}", status_code=204)
def deletar_no(id: int, db: Session = Depends(get_db)):
    """Deleta um nó, verificando se possui arestas conectadas."""
    db_no = db.query(No).filter(No.id == id).first()
    if not db_no:
        raise HTTPException(status_code=404, detail="Nó não encontrado")
        
    arestas = db.query(Aresta).filter(or_(Aresta.no_origem_id == id, Aresta.no_destino_id == id)).count()
    if arestas > 0:
        raise HTTPException(status_code=400, detail="Nó possui arestas conectadas. Remova as arestas primeiro.")
    if db.query(QRCode).filter(QRCode.no_id == id).count() > 0:
        raise HTTPException(status_code=400, detail="Nó possui QR Code vinculado. Remova-o primeiro.")
    if db.query(Loja).filter(Loja.no_id == id).count() > 0:
        raise HTTPException(status_code=400, detail="Nó possui loja/POI vinculado. Remova-a primeiro.")
        
    db.delete(db_no)
    db.commit()
    return None


# ==========================================
# EDGES (ARESTAS)
# ==========================================

@router.get("/edges", response_model=List[schemas.ArestaResponse])
def listar_arestas(piso_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Lista todas as arestas. Opcionalmente filtra as que pertencem a um piso."""
    query = db.query(Aresta)
    if piso_id:
        query = query.join(No, or_(No.id == Aresta.no_origem_id, No.id == Aresta.no_destino_id)).filter(No.piso_id == piso_id).distinct()
    return query.all()

@router.post("/edges", response_model=schemas.ArestaResponse, status_code=201)
def criar_aresta(aresta: schemas.ArestaCreate, db: Session = Depends(get_db)):
    """Cria uma nova aresta entre dois nós. Calcula a distância caso não seja fornecida."""
    origem, destino, piso_origem = _validar_extremos_aresta(
        db, aresta.no_origem_id, aresta.no_destino_id
    )
    data = aresta.model_dump(mode="json")
    if "escada" in (origem.tipo, destino.tipo):
        data["acessivel"] = False
    data["distancia"] = _resolver_distancia_aresta(
        origem, destino, piso_origem, data.get("distancia")
    )

    db_aresta = Aresta(**data)
    db.add(db_aresta)
    db.commit()
    db.refresh(db_aresta)
    return db_aresta

@router.get("/edges/{id}", response_model=schemas.ArestaResponse)
def obter_aresta(id: int, db: Session = Depends(get_db)):
    """Obtém uma aresta pelo ID."""
    aresta = db.query(Aresta).filter(Aresta.id == id).first()
    if not aresta:
        raise HTTPException(status_code=404, detail="Aresta não encontrada")
    return aresta

@router.put("/edges/{id}", response_model=schemas.ArestaResponse)
def atualizar_aresta(id: int, aresta_update: schemas.ArestaUpdate, db: Session = Depends(get_db)):
    """Atualiza uma aresta."""
    db_aresta = db.query(Aresta).filter(Aresta.id == id).first()
    if not db_aresta:
        raise HTTPException(status_code=404, detail="Aresta não encontrada")
        
    update_data = aresta_update.model_dump(exclude_unset=True, mode="json")
    no_origem_id = update_data.get("no_origem_id", db_aresta.no_origem_id)
    no_destino_id = update_data.get("no_destino_id", db_aresta.no_destino_id)
    origem, destino, piso_origem = _validar_extremos_aresta(db, no_origem_id, no_destino_id)
    if "escada" in (origem.tipo, destino.tipo):
        update_data["acessivel"] = False

    endpoints_alterados = (
        no_origem_id != db_aresta.no_origem_id
        or no_destino_id != db_aresta.no_destino_id
    )
    if update_data.get("distancia") is None and ("distancia" in update_data or endpoints_alterados):
        update_data["distancia"] = _resolver_distancia_aresta(origem, destino, piso_origem, None)

    for key, value in update_data.items():
        setattr(db_aresta, key, value)
        
    db.commit()
    db.refresh(db_aresta)
    return db_aresta

@router.delete("/edges/{id}", status_code=204)
def deletar_aresta(id: int, db: Session = Depends(get_db)):
    """Deleta uma aresta."""
    db_aresta = db.query(Aresta).filter(Aresta.id == id).first()
    if not db_aresta:
        raise HTTPException(status_code=404, detail="Aresta não encontrada")
    db.delete(db_aresta)
    db.commit()
    return None


# ==========================================
# STORES (LOJAS)
# ==========================================

@router.get("/stores", response_model=List[schemas.LojaResponse])
def listar_lojas(db: Session = Depends(get_db)):
    """Lista todas as lojas."""
    return db.query(Loja).all()

@router.post("/stores", response_model=schemas.LojaResponse, status_code=201)
def criar_loja(loja: schemas.LojaCreate, db: Session = Depends(get_db)):
    """Cria um POI completo, com categoria e estado operacional explícitos."""
    no = db.query(No).filter(No.id == loja.no_id).first()
    if not no:
        raise HTTPException(status_code=400, detail="Nó associado não encontrado")

    _validar_categoria(db, loja.categoria_id)

    if db.query(Loja).filter(Loja.no_id == loja.no_id).first():
        raise HTTPException(status_code=409, detail="Nó já está vinculado a outra loja")

    db_loja = Loja(**loja.model_dump(mode="json"))
    db.add(db_loja)
    db.commit()
    db.refresh(db_loja)
    return db_loja

@router.get("/stores/{id}", response_model=schemas.LojaResponse)
def obter_loja(id: int, db: Session = Depends(get_db)):
    """Obtém uma loja pelo ID."""
    loja = db.query(Loja).filter(Loja.id == id).first()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    return loja

@router.put("/stores/{id}", response_model=schemas.LojaResponse)
def atualizar_loja(id: int, loja_update: schemas.LojaUpdate, db: Session = Depends(get_db)):
    """Atualiza os dados de uma loja."""
    db_loja = db.query(Loja).filter(Loja.id == id).first()
    if not db_loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
        
    update_data = loja_update.model_dump(exclude_unset=True, mode="json")
    if "nome" in update_data and update_data["nome"] is None:
        raise HTTPException(status_code=400, detail="O nome do POI não pode ser vazio")
    if "status_operacional" in update_data and update_data["status_operacional"] is None:
        raise HTTPException(status_code=400, detail="Todo POI deve possuir um status operacional")
    if "no_id" in update_data and update_data["no_id"] != db_loja.no_id:
        if not db.query(No).filter(No.id == update_data["no_id"]).first():
            raise HTTPException(status_code=400, detail="Nó associado não encontrado")
        if db.query(Loja).filter(Loja.no_id == update_data["no_id"]).first():
            raise HTTPException(status_code=409, detail="Novo nó já está vinculado a outra loja")

    if "categoria_id" in update_data:
        _validar_categoria(db, update_data["categoria_id"])

    for key, value in update_data.items():
        setattr(db_loja, key, value)
        
    db.commit()
    db.refresh(db_loja)
    return db_loja

@router.delete("/stores/{id}", status_code=204)
def deletar_loja(id: int, db: Session = Depends(get_db)):
    """Deleta uma loja."""
    db_loja = db.query(Loja).filter(Loja.id == id).first()
    if not db_loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    db.delete(db_loja)
    db.commit()
    return None


# ==========================================
# CATEGORIES (CATEGORIAS)
# ==========================================

@router.get("/categories", response_model=List[schemas.CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db)):
    """Lista todas as categorias."""
    return db.query(Categoria).all()

@router.post("/categories", response_model=schemas.CategoriaResponse, status_code=201)
def criar_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    """Cria uma nova categoria."""
    if db.query(Categoria).filter(Categoria.nome == categoria.nome).first():
        raise HTTPException(status_code=409, detail="Já existe uma categoria com este nome")
    db_cat = Categoria(**categoria.model_dump())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.get("/categories/{id}", response_model=schemas.CategoriaResponse)
def obter_categoria(id: int, db: Session = Depends(get_db)):
    """Obtém uma categoria pelo ID."""
    cat = db.query(Categoria).filter(Categoria.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return cat

@router.put("/categories/{id}", response_model=schemas.CategoriaResponse)
def atualizar_categoria(id: int, cat_update: schemas.CategoriaUpdate, db: Session = Depends(get_db)):
    """Atualiza uma categoria."""
    db_cat = db.query(Categoria).filter(Categoria.id == id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
        
    update_data = cat_update.model_dump(exclude_unset=True)
    novo_nome = update_data.get("nome")
    if novo_nome is not None:
        existente = db.query(Categoria).filter(Categoria.nome == novo_nome).first()
        if existente and existente.id != id:
            raise HTTPException(status_code=409, detail="Já existe uma categoria com este nome")
    for key, value in update_data.items():
        setattr(db_cat, key, value)
        
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/categories/{id}", status_code=204)
def deletar_categoria(id: int, db: Session = Depends(get_db)):
    """Deleta uma categoria, verificando se há lojas vinculadas."""
    db_cat = db.query(Categoria).filter(Categoria.id == id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
        
    lojas_vinculadas = db.query(Loja).filter(Loja.categoria_id == id).count()
    if lojas_vinculadas > 0:
        raise HTTPException(status_code=400, detail="Categoria possui lojas vinculadas. Remova o vínculo primeiro.")
        
    db.delete(db_cat)
    db.commit()
    return None


# ==========================================
# QR CODES
# ==========================================

@router.get("/qr-codes", response_model=List[schemas.QRCodeResponse])
def listar_qr_codes(db: Session = Depends(get_db)):
    """Lista todos os QR codes."""
    return db.query(QRCode).all()

@router.post("/qr-codes", response_model=schemas.QRCodeResponse, status_code=201)
def criar_qr_code(qr: schemas.QRCodeCreate, db: Session = Depends(get_db)):
    """Cria um novo QR code."""
    no = db.query(No).filter(No.id == qr.no_id).first()
    if not no:
        raise HTTPException(status_code=400, detail="Nó associado não encontrado")
    if db.query(QRCode).filter(QRCode.no_id == qr.no_id).first():
        raise HTTPException(status_code=409, detail="Nó já possui um QR Code vinculado")

    data = qr.model_dump()
    if not data.get("token"):
        data["token"] = str(uuid.uuid4())
    if db.query(QRCode).filter(QRCode.token == data["token"]).first():
        raise HTTPException(status_code=409, detail="Token de QR Code já está em uso")
        
    db_qr = QRCode(**data)
    db.add(db_qr)
    db.commit()
    db.refresh(db_qr)
    return db_qr

@router.get("/qr-codes/{id}", response_model=schemas.QRCodeResponse)
def obter_qr_code(id: int, db: Session = Depends(get_db)):
    """Obtém um QR code pelo ID."""
    qr = db.query(QRCode).filter(QRCode.id == id).first()
    if not qr:
        raise HTTPException(status_code=404, detail="QR Code não encontrado")
    return qr

@router.put("/qr-codes/{id}", response_model=schemas.QRCodeResponse)
def atualizar_qr_code(id: int, qr_update: schemas.QRCodeUpdate, db: Session = Depends(get_db)):
    """Atualiza um QR code."""
    db_qr = db.query(QRCode).filter(QRCode.id == id).first()
    if not db_qr:
        raise HTTPException(status_code=404, detail="QR Code não encontrado")
        
    update_data = qr_update.model_dump(exclude_unset=True)
    novo_no_id = update_data.get("no_id")
    if novo_no_id is not None and novo_no_id != db_qr.no_id:
        if not db.query(No).filter(No.id == novo_no_id).first():
            raise HTTPException(status_code=400, detail="Nó associado não encontrado")
        existente = db.query(QRCode).filter(QRCode.no_id == novo_no_id).first()
        if existente and existente.id != id:
            raise HTTPException(status_code=409, detail="Nó já possui um QR Code vinculado")
    novo_token = update_data.get("token")
    if novo_token is not None:
        existente = db.query(QRCode).filter(QRCode.token == novo_token).first()
        if existente and existente.id != id:
            raise HTTPException(status_code=409, detail="Token de QR Code já está em uso")
    for key, value in update_data.items():
        setattr(db_qr, key, value)
        
    db.commit()
    db.refresh(db_qr)
    return db_qr

@router.delete("/qr-codes/{id}", status_code=204)
def deletar_qr_code(id: int, db: Session = Depends(get_db)):
    """Deleta um QR code."""
    db_qr = db.query(QRCode).filter(QRCode.id == id).first()
    if not db_qr:
        raise HTTPException(status_code=404, detail="QR Code não encontrado")
    db.delete(db_qr)
    db.commit()
    return None


# ==========================================
# GRAPH VALIDATION
# ==========================================

@router.get("/graph/validate")
def validar_grafo(piso_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Valida a consistência navegável do grafo, por shopping.

    A validação considera somente arestas ativas para isolamento e
    conectividade, mas ainda denuncia qualquer aresta estruturalmente
    inválida.  Ao filtrar por piso, o algoritmo inclui os outros pisos do
    mesmo shopping para que uma ligação válida de escada/elevador não seja
    falsamente considerada órfã.
    """
    problemas = []
    piso_selecionado = None
    shopping_selecionado_id = None
    if piso_id is not None:
        piso_selecionado = db.query(Piso).filter(Piso.id == piso_id).first()
        if not piso_selecionado:
            raise HTTPException(status_code=404, detail="Piso não encontrado")
        shopping_selecionado_id = piso_selecionado.shopping_id

    todos_nos = {no.id: no for no in db.query(No).all()}
    todos_pisos = {piso.id: piso for piso in db.query(Piso).all()}
    todos_shoppings = {shopping.id: shopping for shopping in db.query(Shopping).all()}

    def no_navegavel(no: Optional[No]) -> bool:
        if not no or not no.ativo:
            return False
        piso = todos_pisos.get(no.piso_id)
        shopping = todos_shoppings.get(piso.shopping_id) if piso else None
        return bool(piso and piso.ativo and shopping and shopping.ativo)

    nos_ativos = [no for no in todos_nos.values() if no_navegavel(no)]
    if shopping_selecionado_id is not None:
        nos_ativos = [
            no
            for no in nos_ativos
            if todos_pisos[no.piso_id].shopping_id == shopping_selecionado_id
        ]

    nos_ativos_ids = {no.id for no in nos_ativos}
    if piso_id is None:
        ids_no_escopo = nos_ativos_ids
        ids_de_todos_nos_no_piso = set(todos_nos)
    else:
        ids_no_escopo = {no.id for no in nos_ativos if no.piso_id == piso_id}
        ids_de_todos_nos_no_piso = {
            no.id for no in todos_nos.values() if no.piso_id == piso_id
        }

    if not ids_no_escopo:
        return {
            "valido": False,
            "problemas": [
                {
                    "tipo": "Grafo Vazio",
                    "descricao": "Nenhum nó navegável encontrado no escopo",
                    "ids": [],
                }
            ],
        }

    def pertence_ao_escopo(aresta: Aresta) -> bool:
        if piso_id is None:
            return True
        origem = todos_nos.get(aresta.no_origem_id)
        destino = todos_nos.get(aresta.no_destino_id)
        return bool(
            (origem and origem.piso_id == piso_id)
            or (destino and destino.piso_id == piso_id)
        )

    def pertence_ao_shopping_selecionado(aresta: Aresta) -> bool:
        if shopping_selecionado_id is None:
            return True
        for no_id in (aresta.no_origem_id, aresta.no_destino_id):
            no = todos_nos.get(no_id)
            piso = todos_pisos.get(no.piso_id) if no else None
            if piso and piso.shopping_id == shopping_selecionado_id:
                return True
        return False

    adjacencia_fraca: dict[int, set[int]] = defaultdict(set)
    incidentes_ativos: dict[int, set[int]] = defaultdict(set)
    arestas_invalidas = []

    for aresta in db.query(Aresta).all():
        if not pertence_ao_shopping_selecionado(aresta):
            continue

        origem = todos_nos.get(aresta.no_origem_id)
        destino = todos_nos.get(aresta.no_destino_id)
        piso_origem = todos_pisos.get(origem.piso_id) if origem else None
        piso_destino = todos_pisos.get(destino.piso_id) if destino else None
        shopping_origem = todos_shoppings.get(piso_origem.shopping_id) if piso_origem else None
        shopping_destino = todos_shoppings.get(piso_destino.shopping_id) if piso_destino else None

        invalida = (
            not no_navegavel(origem)
            or not no_navegavel(destino)
            or aresta.no_origem_id == aresta.no_destino_id
            or float(aresta.distancia) <= 0
            or not piso_origem
            or not piso_destino
            or not shopping_origem
            or not shopping_destino
            or shopping_origem.id != shopping_destino.id
            or (
                piso_origem.id != piso_destino.id
                and (
                    origem.tipo not in TIPOS_TRANSICAO_ENTRE_PISOS
                    or destino.tipo not in TIPOS_TRANSICAO_ENTRE_PISOS
                )
            )
        )
        if invalida:
            if pertence_ao_escopo(aresta):
                arestas_invalidas.append(aresta.id)
            continue

        if not aresta.ativa:
            continue

        # These maps represent physical navigability.  Weak connectivity is
        # deliberate here: a one-way edge is still a physical connection, and
        # directionality remains enforced by Dijkstra itself.
        incidentes_ativos[origem.id].add(destino.id)
        incidentes_ativos[destino.id].add(origem.id)
        adjacencia_fraca[origem.id].add(destino.id)
        adjacencia_fraca[destino.id].add(origem.id)

    if arestas_invalidas:
        problemas.append(
            {
                "tipo": "Arestas Inválidas",
                "descricao": "Arestas com nós inativos/inexistentes, peso inválido ou shopping incompatível",
                "ids": sorted(set(arestas_invalidas)),
            }
        )

    nos_isolados = sorted(
        no_id for no_id in ids_no_escopo if not incidentes_ativos.get(no_id)
    )
    if nos_isolados:
        problemas.append(
            {
                "tipo": "Nós Isolados",
                "descricao": "Nós navegáveis sem arestas ativas conectadas",
                "ids": nos_isolados,
            }
        )

    qr_orfaos = []
    for qr in db.query(QRCode).all():
        no = todos_nos.get(qr.no_id)
        if piso_id is not None and no and no.piso_id != piso_id:
            continue
        if no is None and piso_id is not None:
            # A truly missing node cannot be attributed to a particular floor.
            continue
        if not no_navegavel(no):
            qr_orfaos.append(qr.id)
    if qr_orfaos:
        problemas.append(
            {
                "tipo": "QR Codes Órfãos",
                "descricao": "QR Codes vinculados a nós inativos ou inexistentes",
                "ids": sorted(qr_orfaos),
            }
        )

    lojas_orfas = []
    for loja in db.query(Loja).all():
        no = todos_nos.get(loja.no_id)
        if piso_id is not None and no and no.piso_id != piso_id:
            continue
        if no is None and piso_id is not None:
            continue
        if not no_navegavel(no):
            lojas_orfas.append(loja.id)
    if lojas_orfas:
        problemas.append(
            {
                "tipo": "Lojas Órfãs",
                "descricao": "Lojas vinculadas a nós inativos ou inexistentes",
                "ids": sorted(lojas_orfas),
            }
        )

    # Validate components independently for each shopping.  Separate malls do
    # not need to be connected to one another.
    por_shopping: dict[int, set[int]] = defaultdict(set)
    for no in nos_ativos:
        por_shopping[todos_pisos[no.piso_id].shopping_id].add(no.id)

    desconectados = set()
    for ids_do_shopping in por_shopping.values():
        ids_com_aresta = {no_id for no_id in ids_do_shopping if incidentes_ativos.get(no_id)}
        if not ids_com_aresta:
            continue

        componentes = []
        pendentes = set(ids_com_aresta)
        while pendentes:
            inicio = pendentes.pop()
            componente = {inicio}
            fila = deque([inicio])
            while fila:
                atual = fila.popleft()
                for vizinho in adjacencia_fraca.get(atual, set()):
                    if vizinho in pendentes:
                        pendentes.remove(vizinho)
                        componente.add(vizinho)
                        fila.append(vizinho)
            componentes.append(componente)

        if len(componentes) > 1:
            principal = max(componentes, key=len)
            for componente in componentes:
                if componente is not principal:
                    desconectados.update(componente)

    if piso_id is not None:
        desconectados.intersection_update(ids_no_escopo)
    if desconectados:
        problemas.append(
            {
                "tipo": "Componentes Desconectados",
                "descricao": "Grafo não é totalmente conexo (existem ilhas de nós)",
                "ids": sorted(desconectados),
            }
        )

    return {"valido": len(problemas) == 0, "problemas": problemas}
