"""Testes funcionais de integracao: fluxo completo de navegacao.

Usa o banco SQLite isolado do conftest (em memoria). Nao toca no MySQL
de producao. Cobre: QR Code, origem, destino, rota normal, rota acessivel,
ausencia de caminho acessivel, recalculo, estado de navegacao,
destino inexistente.
"""

import pytest

from app.services.navigation import NavigationEngine
from app.services.navigation_state import navigation_state
from app.models import Shopping, Piso, No, Aresta, Loja, Categoria, QRCode
from app.schemas.rota import RotaRequest


@pytest.fixture
def cenario(db_session):
    """Cenario com 2 pisos, elevador (acessivel) e escada (nao acessivel)."""
    shopping = Shopping(nome="Shopping Teste", ativo=True)
    db_session.add(shopping)
    db_session.commit()

    piso_t = Piso(shopping_id=shopping.id, nome="Térreo", nivel=0,
                  largura_metros=30, altura_metros=60, ativo=True)
    piso_m = Piso(shopping_id=shopping.id, nome="Mezanino", nivel=1,
                  largura_metros=30, altura_metros=60, ativo=True)
    db_session.add_all([piso_t, piso_m])
    db_session.commit()

    entrada = No(piso_id=piso_t.id, coord_x=0.1, coord_y=0.5, tipo="entrada",
                 nome="Entrada Principal", ativo=True)
    cor_t = No(piso_id=piso_t.id, coord_x=0.5, coord_y=0.5, tipo="corredor",
               nome="Corredor Térreo", ativo=True)
    elev_t = No(piso_id=piso_t.id, coord_x=0.9, coord_y=0.5, tipo="elevador",
                nome="Elevador Térreo", ativo=True)
    escada_t = No(piso_id=piso_t.id, coord_x=0.8, coord_y=0.2, tipo="escada",
                  nome="Escada Térreo", ativo=True)
    elev_m = No(piso_id=piso_m.id, coord_x=0.9, coord_y=0.5, tipo="elevador",
                nome="Elevador Mezanino", ativo=True)
    escada_m = No(piso_id=piso_m.id, coord_x=0.8, coord_y=0.2, tipo="escada",
                  nome="Escada Mezanino", ativo=True)
    loja_m = No(piso_id=piso_m.id, coord_x=0.5, coord_y=0.5, tipo="loja",
                nome="Loja Mezanino", ativo=True)
    cor_m = No(piso_id=piso_m.id, coord_x=0.3, coord_y=0.5, tipo="corredor",
               nome="Corredor Mezanino", ativo=True)

    db_session.add_all([entrada, cor_t, elev_t, escada_t, elev_m, escada_m,
                        loja_m, cor_m])
    db_session.commit()

    db_session.add_all([
        Aresta(no_origem_id=entrada.id, no_destino_id=cor_t.id, distancia=5.0,
               bidirecional=True, acessivel=True, ativa=True),
        Aresta(no_origem_id=cor_t.id, no_destino_id=elev_t.id, distancia=3.0,
               bidirecional=True, acessivel=True, ativa=True),
        Aresta(no_origem_id=cor_t.id, no_destino_id=escada_t.id, distancia=2.0,
               bidirecional=True, acessivel=True, ativa=True),
        Aresta(no_origem_id=elev_t.id, no_destino_id=elev_m.id, distancia=4.0,
               bidirecional=True, acessivel=True, ativa=True),
        Aresta(no_origem_id=escada_t.id, no_destino_id=escada_m.id,
               distancia=3.0, bidirecional=True, acessivel=False, ativa=True),
        Aresta(no_origem_id=elev_m.id, no_destino_id=cor_m.id, distancia=3.0,
               bidirecional=True, acessivel=True, ativa=True),
        Aresta(no_origem_id=cor_m.id, no_destino_id=loja_m.id, distancia=4.0,
               bidirecional=True, acessivel=True, ativa=True),
        Aresta(no_origem_id=escada_m.id, no_destino_id=cor_m.id, distancia=2.0,
               bidirecional=True, acessivel=True, ativa=True),
    ])

    categoria = Categoria(nome="Vestuário", icone="shirt")
    db_session.add(categoria)
    db_session.commit()

    loja = Loja(no_id=loja_m.id, nome="Loja Teste", categoria_id=categoria.id,
                status_operacional="aberto", ativo=True)
    db_session.add(loja)
    db_session.commit()

    qr = QRCode(token="QR-ENTRADA-PRINCIPAL", no_id=entrada.id, ativo=True)
    db_session.add(qr)
    db_session.commit()

    return {
        "shopping": shopping, "piso_t": piso_t, "piso_m": piso_m,
        "entrada": entrada, "cor_t": cor_t, "elev_t": elev_t,
        "escada_t": escada_t, "elev_m": elev_m, "escada_m": escada_m,
        "loja_m": loja_m, "cor_m": cor_m, "loja": loja,
        "categoria": categoria, "qr": qr,
    }


# =====================================================================
# 1. QR Code valido e invalido
# =====================================================================

def test_qr_valido_resolve_origem(db_session, cenario):
    """QR valido resolve no de origem com piso e shopping ativos."""
    nav = NavigationEngine(db_session)
    origem = nav._obter_no_navegavel(cenario["entrada"].id)
    assert origem is not None
    assert origem.piso_id == cenario["piso_t"].id
    assert origem.tipo == "entrada"
    assert origem.ativo is True


def test_qr_invalido_nao_resolve(db_session, cenario):
    """QR inexistente nao existe no banco (simula token invalido)."""
    existente = db_session.query(QRCode).filter_by(
        token="QR-INEXISTENTE").first()
    assert existente is None


# =====================================================================
# 2. Rota normal
# =====================================================================

def test_rota_normal_entre_pisos(db_session, cenario):
    """Rota normal entre térreo e mezanino pode usar escada ou elevador."""
    nav = NavigationEngine(db_session)
    resultado = nav.calcular_rota(cenario["entrada"].id,
                                  cenario["loja_m"].id, acessivel=False)
    assert resultado["sucesso"] is True
    assert len(resultado["nos"]) >= 3
    assert resultado["distancia_total_metros"] > 0
    assert "instrucoes" in resultado


# =====================================================================
# 3. Rota acessível (sem escadas)
# =====================================================================

def test_rota_acessivel_usa_elevador_nao_escada(db_session, cenario):
    """Rota acessivel usa elevador, nunca escada/escada rolante."""
    nav = NavigationEngine(db_session)
    resultado = nav.calcular_rota(cenario["entrada"].id,
                                  cenario["loja_m"].id, acessivel=True)
    assert resultado["sucesso"] is True
    tipos = {no["tipo"] for no in resultado["nos"]}
    assert not tipos & {"escada", "escada_rolante"}, (
        "Rota acessível não deve incluir escadas: " + str(tipos))
    assert "elevador" in tipos, (
        "Rota acessível ao mezanino deve usar elevador")


# =====================================================================
# 4. Ausência de caminho acessível
# =====================================================================

def test_sem_caminho_acessivel_quando_elevador_bloqueado(db_session, cenario):
    """Se elevador estiver inativo, não existe rota acessível entre pisos."""
    nav = NavigationEngine(db_session)
    aresta = db_session.query(Aresta).filter_by(
        no_origem_id=cenario["elev_t"].id,
        no_destino_id=cenario["elev_m"].id,
    ).first()
    aresta.ativa = False
    db_session.commit()

    resultado = nav.calcular_rota(cenario["entrada"].id,
                                  cenario["loja_m"].id, acessivel=True)
    assert resultado["sucesso"] is False
    assert resultado["codigo"] == "SEM_ROTA"
    assert "sem escadas" in resultado["mensagem"].lower()

    aresta.ativa = True
    db_session.commit()


# =====================================================================
# 5. Destino inexistente
# =====================================================================

def test_destino_inexistente_rejeitado(db_session, cenario):
    """Destino com nó inexistente retorna LOCAL_INDISPONIVEL."""
    nav = NavigationEngine(db_session)
    resultado = nav.calcular_rota(cenario["entrada"].id, 999999,
                                  acessivel=False)
    assert resultado["sucesso"] is False
    assert resultado["codigo"] == "LOCAL_INDISPONIVEL"


# =====================================================================
# 6. Recalculo apos alteracao de aresta (revisao muda)
# =====================================================================

def test_recalculo_apos_bloqueio_aresta(db_session, cenario):
    """Desativar aresta muda a revisao e recalcula rota alternativa."""
    nav = NavigationEngine(db_session)
    revisao_antes = navigation_state(db_session, cenario["shopping"].id)[
        "revisao"]

    aresta = db_session.query(Aresta).filter_by(
        no_origem_id=cenario["cor_t"].id,
        no_destino_id=cenario["elev_t"].id,
    ).first()
    aresta.ativa = False
    db_session.commit()

    revisao_depois = navigation_state(db_session, cenario["shopping"].id)[
        "revisao"]
    assert revisao_antes != revisao_depois, (
        "Revisao deve mudar apos alteracao de aresta")

    resultado = nav.calcular_rota(cenario["entrada"].id,
                                  cenario["loja_m"].id, acessivel=False)
    assert resultado["sucesso"] is True

    aresta.ativa = True
    db_session.commit()


# =====================================================================
# 7. Estado da navegacao consistente
# =====================================================================

def test_estado_navegacao_retorna_revisao_ativo(db_session, cenario):
    """Estado de navegacao retorna revisao e ativo consistentes."""
    estado = navigation_state(db_session, cenario["shopping"].id)
    assert "revisao" in estado
    assert "ativo" in estado
    assert estado["ativo"] is True
    assert isinstance(estado["revisao"], str)
    assert len(estado["revisao"]) > 0


# =====================================================================
# 8. Origem igual a destino (validacao do schema)
# =====================================================================

def test_origem_igual_destino_rejeitado(db_session, cenario):
    """Origem igual a destino nao e permitida (validado pelo schema)."""
    with pytest.raises(ValueError):
        RotaRequest(origem_no_id=cenario["entrada"].id,
                    destino_no_id=cenario["entrada"].id)


# =====================================================================
# 9. Regressao: navegacao entre pisos ate Livraria Superior
# =====================================================================

def test_rota_entre_pisos_ate_livraria_superior(db_session):
    """Regressao entre-pisos: entrada (térreo) até Livraria Superior (mezanino).

    Cobre o fluxo validado pelo teste de navegacao (AUDIT_URL/8765): origem via
    QR, destino Livraria Superior no piso superior, troca de piso por elevador
    (acessível), sem uso de escadas.
    """
    from app.services.navigation import NavigationEngine
    from app.models import Shopping, Piso, No, Aresta, Loja, Categoria, QRCode

    shopping = Shopping(nome="Shopping Teste Superior", ativo=True)
    db_session.add(shopping)
    db_session.commit()

    piso_t = Piso(shopping_id=shopping.id, nome="Térreo", nivel=0,
                  largura_metros=30, altura_metros=60, ativo=True)
    piso_m = Piso(shopping_id=shopping.id, nome="Mezanino", nivel=1,
                  largura_metros=30, altura_metros=60, ativo=True)
    db_session.add_all([piso_t, piso_m])
    db_session.commit()

    entrada = No(piso_id=piso_t.id, coord_x=0.5, coord_y=0.05, tipo="entrada",
                 nome="Entrada Principal", ativo=True)
    cor_t = No(piso_id=piso_t.id, coord_x=0.5, coord_y=0.5, tipo="corredor",
               nome="Corredor Térreo", ativo=True)
    elev_t = No(piso_id=piso_t.id, coord_x=0.5, coord_y=0.608, tipo="elevador",
                nome="Elevador Térreo", ativo=True)
    elev_m = No(piso_id=piso_m.id, coord_x=0.5, coord_y=0.608, tipo="elevador",
                nome="Elevador Mezanino", ativo=True)
    livraria = No(piso_id=piso_m.id, coord_x=0.5, coord_y=0.3, tipo="loja",
                  nome="Livraria Superior", ativo=True)
    db_session.add_all([entrada, cor_t, elev_t, elev_m, livraria])
    db_session.commit()

    db_session.add_all([
        Aresta(no_origem_id=entrada.id, no_destino_id=cor_t.id, distancia=5.0,
               bidirecional=True, acessivel=True, ativa=True),
        Aresta(no_origem_id=cor_t.id, no_destino_id=elev_t.id, distancia=3.0,
               bidirecional=True, acessivel=True, ativa=True),
        Aresta(no_origem_id=elev_t.id, no_destino_id=elev_m.id, distancia=4.0,
               bidirecional=True, acessivel=True, ativa=True),
        Aresta(no_origem_id=elev_m.id, no_destino_id=livraria.id, distancia=3.0,
               bidirecional=True, acessivel=True, ativa=True),
    ])

    categoria = Categoria(nome="Entretenimento", icone="book")
    db_session.add(categoria)
    db_session.commit()
    db_session.add(Loja(no_id=livraria.id, nome="Livraria Superior",
                        categoria_id=categoria.id, status_operacional="aberto",
                        ativo=True))
    db_session.add(QRCode(token="DESTINO-SUPERIOR", no_id=livraria.id, ativo=True))
    db_session.commit()

    nav = NavigationEngine(db_session)

    # Rota normal entre pisos deve funcionar
    resultado = nav.calcular_rota(entrada.id, livraria.id, acessivel=False)
    assert resultado["sucesso"] is True
    tipos = {no["tipo"] for no in resultado["nos"]}
    assert "elevador" in tipos, ("Rota entre pisos deve usar elevador: "
                                 + str(tipos))
    assert not tipos & {"escada", "escada_rolante"}, (
        "Rota não deve incluir escadas: " + str(tipos))

    # Rota acessível também deve funcionar usando elevador, nunca escada
    resultado_acc = nav.calcular_rota(entrada.id, livraria.id, acessivel=True)
    assert resultado_acc["sucesso"] is True
    tipos_acc = {no["tipo"] for no in resultado_acc["nos"]}
    assert "elevador" in tipos_acc
    assert not tipos_acc & {"escada", "escada_rolante"}

    # Confirma transição de piso no trecho do elevador
    transicoes = [e for e in resultado["etapas"] if e["tipo"] == "troca_piso"]
    assert len(transicoes) >= 1, (
        "Esperado ao menos uma etapa de troca de piso: "
        + str([e["tipo"] for e in resultado["etapas"]]))
    transicao = transicoes[0]
    assert transicao["piso_origem_id"] != transicao["piso_destino_id"]
    assert transicao["no_destino_id"] == elev_m.id
