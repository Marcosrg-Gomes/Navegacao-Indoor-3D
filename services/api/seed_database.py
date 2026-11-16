"""Script de seed dedicado para o CI: garante o piso superior e a Livraria Superior.

Uso no CI:
    python ../../services/api/seed_database.py --env ci --include-floors || true

Este script aditivo nunca apaga cadastros existentes. Ele apenas assegura que o
Shopping Demo Center possua um piso superior com a Livraria Superior e o QR code
DESTINO-SUPERIOR, necessários pelos testes E2E de regressão (navigation.spec.ts
e scanner.spec.ts).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Garante que o pacote app seja importável a partir de qualquer diretório
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import Aresta, Categoria, Loja, No, Piso, QRCode, Shopping  # noqa: E402

DEFAULT_SHOPPING_NOME = "Shopping Demo Center"


def _criar_demo_completo(db) -> Shopping:
    """Cria o Shopping Demo Center com dados mínimos (piso térreo, nós, arestas, lojas, QR codes)."""
    shopping = Shopping(
        nome=DEFAULT_SHOPPING_NOME,
        endereco="Av. Brasil, 1000 - Centro",
        latitude=-23.5505,
        longitude=-46.6333,
        ativo=True,
    )
    db.add(shopping)
    db.flush()

    categorias = [
        Categoria(nome="Alimentação", icone="restaurant"),
        Categoria(nome="Moda", icone="shirt"),
        Categoria(nome="Tecnologia", icone="laptop"),
        Categoria(nome="Serviços", icone="tools"),
        Categoria(nome="Entretenimento", icone="gamepad"),
    ]
    db.add_all(categorias)
    db.flush()
    cat_map = {c.nome: c for c in categorias}

    piso = Piso(
        shopping_id=shopping.id,
        nome="Térreo",
        nivel=0,
        largura_metros=100.0,
        altura_metros=60.0,
        imagem_planta_url="/static/plantas/demo.svg",
        ativo=True,
    )
    db.add(piso)
    db.flush()

    nos_data = [
        (0.1, 0.5, 'entrada', "Entrada Principal"),
        (0.9, 0.5, 'entrada', "Entrada Lateral"),
        (0.2, 0.5, 'corredor', "Corredor A1"),
        (0.3, 0.5, 'corredor', "Corredor A2"),
        (0.4, 0.5, 'corredor', "Corredor A3"),
        (0.5, 0.5, 'corredor', "Corredor Central"),
        (0.6, 0.5, 'corredor', "Corredor B1"),
        (0.7, 0.5, 'corredor', "Corredor B2"),
        (0.8, 0.5, 'corredor', "Corredor B3"),
        (0.3, 0.3, 'corredor', "Corredor Norte"),
        (0.5, 0.3, 'corredor', "Corredor Norte Central"),
        (0.7, 0.3, 'corredor', "Corredor Norte Leste"),
        (0.3, 0.7, 'corredor', "Corredor Sul"),
        (0.5, 0.7, 'corredor', "Corredor Sul Central"),
        (0.7, 0.7, 'corredor', "Corredor Sul Leste"),
        (0.3, 0.15, 'loja', "Loja Moda Fashion"),
        (0.5, 0.15, 'loja', "TechStore"),
        (0.7, 0.15, 'loja', "Restaurante Sabor"),
        (0.3, 0.85, 'loja', "Cinema Star"),
        (0.5, 0.85, 'loja', "Farmácia Saúde"),
        (0.7, 0.85, 'banheiro', "Banheiro"),
        (0.9, 0.3, 'escada', "Escada Piso Superior"),
    ]

    nos = []
    for i, (cx, cy, tipo, desc) in enumerate(nos_data, start=1):
        n = No(
            piso_id=piso.id,
            coord_x=cx,
            coord_y=cy,
            tipo=tipo,
            nome=desc,
            ativo=True,
        )
        nos.append(n)
    db.add_all(nos)
    db.flush()

    n_map = {i + 1: n for i, n in enumerate(nos)}

    arestas_conexoes = [
        (1, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 9), (9, 2),
        (4, 10), (6, 11), (8, 12),
        (4, 13), (6, 14), (8, 15),
        (10, 16), (11, 17), (12, 18),
        (13, 19), (14, 20), (15, 21),
        (10, 11), (11, 12), (13, 14), (14, 15),
        (12, 22),
    ]

    arestas = []
    for u, v in arestas_conexoes:
        n1 = n_map[u]
        n2 = n_map[v]
        import math
        dx = float(n1.coord_x - n2.coord_x) * 100.0
        dy = float(n1.coord_y - n2.coord_y) * 60.0
        dist = (dx**2 + dy**2) ** 0.5
        acessivel = False if (u == 15 and v == 21) or (u == 21 and v == 15) else True
        ativa = False if (u == 10 and v == 11) or (u == 11 and v == 10) else True
        arestas.append(Aresta(
            no_origem_id=n1.id,
            no_destino_id=n2.id,
            distancia=dist,
            bidirecional=True,
            acessivel=acessivel,
            ativa=ativa,
        ))
    db.add_all(arestas)
    db.flush()

    lojas_data = [
        ("Moda Fashion", 16, "Moda"),
        ("TechStore", 17, "Tecnologia"),
        ("Restaurante Sabor", 18, "Alimentação"),
        ("Cinema Star", 19, "Entretenimento"),
        ("Farmácia Saúde", 20, "Serviços"),
        ("Café Aroma", 5, "Alimentação"),
        ("Ótica VIS", 10, "Serviços"),
        ("Livraria Cultura", 13, "Entretenimento"),
        ("Pet Shop Amigo", 14, "Serviços"),
        ("Joalheria Brilho", 15, "Moda"),
        ("Banheiro", 21, "Serviços"),
    ]
    for nome, nid, cat_nome in lojas_data:
        db.add(Loja(
            no_id=n_map[nid].id,
            categoria_id=cat_map[cat_nome].id,
            nome=nome,
            descricao=f"Descrição da {nome}",
            horario_funcionamento="10:00 - 22:00",
            status_operacional="manutencao" if nome == "Joalheria Brilho" else "fechado" if nome == "Cinema Star" else "aberto",
            ativo=True,
        ))

    qrcodes_data = [
        ("ENTRADA-PRINCIPAL", 1),
        ("ENTRADA-LATERAL", 2),
        ("CORREDOR-CENTRAL", 6),
        ("NORTE-CENTRAL", 11),
        ("SUL-CENTRAL", 14),
        ("DESTINO-TECHSTORE", 17),
    ]
    for token, nid in qrcodes_data:
        db.add(QRCode(
            token=token,
            no_id=n_map[nid].id,
            ativo=True,
        ))

    db.flush()
    print("Shopping Demo Center criado com dados mínimos.")
    return shopping


def ensure_upper_floor(db) -> None:
    """Cria o piso superior e a Livraria Superior se ainda não existirem."""
    demo = db.query(Shopping).filter_by(nome=DEFAULT_SHOPPING_NOME).first()
    if demo is None:
        print("Shopping Demo Center nao encontrado. Criando demo center completo...")
        demo = _criar_demo_completo(db)

    ground = db.query(Piso).filter_by(shopping_id=demo.id, nivel=0).first()
    if ground is None:
        print("Piso térreo nao encontrado. Criando piso térreo...")
        piso = Piso(
            shopping_id=demo.id,
            nome="Térreo",
            nivel=0,
            largura_metros=100.0,
            altura_metros=60.0,
            imagem_planta_url="/static/plantas/demo.svg",
            ativo=True,
        )
        db.add(piso)
        db.flush()
        ground = piso

    upper = db.query(Piso).filter_by(shopping_id=demo.id, nivel=1).first()
    if upper is not None:
        print("Piso superior e Livraria Superior ja existem. Nada a fazer.")
        return

    upper = Piso(
        shopping_id=demo.id,
        nome="Piso superior",
        nivel=1,
        largura_metros=100.0,
        altura_metros=60.0,
        imagem_planta_url="/static/plantas/demo.svg",
        ativo=True,
    )
    db.add(upper)
    db.flush()

    e0 = No(piso_id=ground.id, nome="Elevador térreo", tipo="elevador", coord_x=0.85, coord_y=0.5, ativo=True)
    e1 = No(piso_id=upper.id, nome="Elevador superior", tipo="elevador", coord_x=0.85, coord_y=0.5, ativo=True)
    s1 = No(piso_id=upper.id, nome="Escada superior", tipo="escada", coord_x=0.9, coord_y=0.3, ativo=True)
    dest = No(piso_id=upper.id, nome="Livraria Superior", tipo="loja", coord_x=0.5, coord_y=0.3, ativo=True)
    db.add_all([e0, e1, s1, dest])
    db.flush()

    central = db.query(No).filter(No.nome == "Corredor Central", No.piso_id == ground.id).one()
    stairs = db.query(No).filter(No.nome == "Escada Piso Superior", No.piso_id == ground.id).one()

    arestas = [
        (central, e0, 35, True),
        (e0, e1, 8, True),
        (e1, dest, 35, True),
        (stairs, s1, 5, False),
        (s1, dest, 40, True),
    ]
    for origem, destino, distancia, acessivel in arestas:
        db.add(Aresta(
            no_origem_id=origem.id,
            no_destino_id=destino.id,
            distancia=distancia,
            acessivel=acessivel,
            bidirecional=True,
            ativa=True,
        ))

    categoria = (
        db.query(Categoria)
        .join(Loja, Loja.categoria_id == Categoria.id)
        .join(No, No.id == Loja.no_id)
        .join(Piso, Piso.id == No.piso_id)
        .filter(Piso.shopping_id == demo.id)
        .first()
    )
    categoria_id = categoria.id if categoria else 1

    db.add(Loja(
        no_id=dest.id,
        nome="Livraria Superior",
        categoria_id=categoria_id,
        status_operacional="aberto",
        descricao="Livros e papelaria no piso superior.",
        ativo=True,
    ))
    db.add(QRCode(
        no_id=dest.id,
        token="DESTINO-SUPERIOR",
        ativo=True,
    ))
    db.flush()
    print("Piso superior e Livraria Superior criados com sucesso.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed de banco para CI")
    parser.add_argument("--env", type=str, default="ci", help="Ambiente (ignorado, mantido por compatibilidade)")
    parser.add_argument("--include-floors", action="store_true", help="Inclui pisos multi-nível (piso superior)")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)

    with SessionLocal.begin() as db:
        ensure_upper_floor(db)

    print("Seed de banco concluido com sucesso.")


if __name__ == "__main__":
    main()
