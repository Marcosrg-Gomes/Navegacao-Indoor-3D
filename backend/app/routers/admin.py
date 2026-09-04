from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
import uuid
import math
from collections import defaultdict, deque

from app.database import get_db
from app.auth import verify_api_key
from app.models import Shopping, Piso, No, Aresta, Loja, Categoria, QRCode
import app.schemas as schemas
from app.services.navigation import NavigationEngine

router = APIRouter(
    tags=["Admin"],
    dependencies=[Depends(verify_api_key)]
)

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
    db.delete(db_piso)
    db.commit()
    return None


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
    for key, value in update_data.items():
        setattr(db_no, key, value)
        
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
    origem = db.query(No).filter(No.id == aresta.no_origem_id).first()
    destino = db.query(No).filter(No.id == aresta.no_destino_id).first()
    
    if not origem or not destino:
        raise HTTPException(status_code=400, detail="Nó de origem ou destino não encontrado")
        
    data = aresta.model_dump()
    if data.get("distancia") is None:
        piso = db.query(Piso).filter(Piso.id == origem.piso_id).first()
        if piso:
            largura = float(piso.largura_metros or 100)
            altura = float(piso.altura_metros or 60)
            data["distancia"] = NavigationEngine.calcular_distancia(origem, destino, largura, altura)
        else:
            data["distancia"] = 1.0 # Valor default fallback

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
        
    update_data = aresta_update.model_dump(exclude_unset=True)
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
    """Cria uma nova loja, validando a exclusividade do nó associado."""
    no = db.query(No).filter(No.id == loja.no_id).first()
    if not no:
        raise HTTPException(status_code=400, detail="Nó associado não encontrado")
        
    if db.query(Loja).filter(Loja.no_id == loja.no_id).first():
        raise HTTPException(status_code=400, detail="Nó já está vinculado a outra loja")
        
    db_loja = Loja(**loja.model_dump())
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
        
    update_data = loja_update.model_dump(exclude_unset=True)
    if "no_id" in update_data and update_data["no_id"] != db_loja.no_id:
        if db.query(Loja).filter(Loja.no_id == update_data["no_id"]).first():
            raise HTTPException(status_code=400, detail="Novo nó já está vinculado a outra loja")

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
        
    data = qr.model_dump()
    if not data.get("token"):
        data["token"] = str(uuid.uuid4())
        
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
    Valida a consistência do grafo de navegação.
    Se piso_id for fornecido, valida apenas o grafo desse piso.
    Verifica:
    1. Nós isolados (sem arestas ativas)
    2. Arestas inválidas (apontando para nós não existentes ou inativos)
    3. QR Codes órfãos (vinculados a nós não existentes ou inativos)
    4. Componentes desconectados (verifica se o grafo do escopo é totalmente conexo, desconsiderando subgrafos de nós inativos se necessário)
    """
    problemas = []
    
    # 1. Base Query for Nodes
    nos_query = db.query(No).filter(No.ativo == True)
    if piso_id:
        nos_query = nos_query.filter(No.piso_id == piso_id)
        
    nos_ativos = nos_query.all()
    nos_ativos_ids = {no.id for no in nos_ativos}
    
    if not nos_ativos:
        return {"valido": True, "problemas": [{"tipo": "Grafo Vazio", "descricao": "Nenhum nó ativo encontrado no escopo", "ids": []}]}
        
    # 2. Get Edges
    arestas_query = db.query(Aresta)
    if piso_id:
        arestas_query = arestas_query.join(No, No.id == Aresta.no_origem_id).filter(No.piso_id == piso_id)
    arestas = arestas_query.all()
    
    adj_list = defaultdict(list)
    arestas_invalidas = []
    
    for aresta in arestas:
        # Arestas inválidas: apontam para nós inexistentes ou inativos
        if aresta.no_origem_id not in nos_ativos_ids or aresta.no_destino_id not in nos_ativos_ids:
            arestas_invalidas.append(aresta.id)
        else:
            # Assumimos que o grafo é não-direcionado para validação de conectividade
            adj_list[aresta.no_origem_id].append(aresta.no_destino_id)
            adj_list[aresta.no_destino_id].append(aresta.no_origem_id)
            
    if arestas_invalidas:
        problemas.append({
            "tipo": "Arestas Inválidas",
            "descricao": "Arestas conectadas a nós inativos ou inexistentes",
            "ids": arestas_invalidas
        })
        
    # 3. Nós isolados
    nos_isolados = [no_id for no_id in nos_ativos_ids if no_id not in adj_list or not adj_list[no_id]]
    if nos_isolados:
        problemas.append({
            "tipo": "Nós Isolados",
            "descricao": "Nós ativos sem arestas conectadas",
            "ids": nos_isolados
        })
        
    # 4. QR Codes órfãos
    qr_query = db.query(QRCode)
    if piso_id:
        qr_query = qr_query.join(No, No.id == QRCode.no_id).filter(No.piso_id == piso_id)
    qr_codes = qr_query.all()
    
    qr_orfaos = [qr.id for qr in qr_codes if qr.no_id not in nos_ativos_ids]
    if qr_orfaos:
        problemas.append({
            "tipo": "QR Codes Órfãos",
            "descricao": "QR Codes vinculados a nós inativos ou inexistentes",
            "ids": qr_orfaos
        })

    lojas_query = db.query(Loja)
    if piso_id:
        lojas_query = lojas_query.join(No, No.id == Loja.no_id).filter(No.piso_id == piso_id)
    lojas_orfas = [loja.id for loja in lojas_query.all() if loja.no_id not in nos_ativos_ids]
    if lojas_orfas:
        problemas.append({
            "tipo": "Lojas Órfãs",
            "descricao": "Lojas vinculadas a nós inativos ou inexistentes",
            "ids": lojas_orfas
        })
        
    # 5. Conectividade (BFS)
    if nos_ativos_ids and not nos_isolados:
        visitados = set()
        start_node = next(iter(nos_ativos_ids))
        queue = deque([start_node])
        
        while queue:
            atual = queue.popleft()
            if atual not in visitados:
                visitados.add(atual)
                for vizinho in adj_list[atual]:
                    if vizinho not in visitados:
                        queue.append(vizinho)
                        
        desconectados = nos_ativos_ids - visitados
        if desconectados:
            problemas.append({
                "tipo": "Componentes Desconectados",
                "descricao": "Grafo não é totalmente conexo (existem ilhas de nós)",
                "ids": list(desconectados)
            })
            
    return {
        "valido": len(problemas) == 0,
        "problemas": problemas
    }
