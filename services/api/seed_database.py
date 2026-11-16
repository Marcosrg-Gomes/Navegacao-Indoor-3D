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
from app.migrations import upgrade_schema  # noqa: E402
from app.models import Aresta, Categoria, Loja, No, Piso, QRCode, Shopping  # noqa: E402

DEFAULT_SHOPPING_NOME = "Shopping Demo Center"


def ensure_upper_floor(db) -> None:
    """Cria o piso superior e a Livraria Superior se ainda não existirem."""
    demo = db.query(Shopping).filter_by(nome=DEFAULT_SHOPPING_NOME).first()
    if demo is None:
        print("Shopping Demo Center nao encontrado. Criando demo center completo...")
        from seed import seed_db  # noqa: PLC0415

        seed_db()
        db.commit()
        demo = db.query(Shopping).filter_by(nome=DEFAULT_SHOPPING_NOME).first()

    ground = db.query(Piso).filter_by(shopping_id=demo.id, nivel=0).first()
    if ground is None:
        print("Piso térreo nao encontrado. Executando seed completo...")
        from seed import seed_db  # noqa: PLC0415

        seed_db()
        db.commit()
        ground = db.query(Piso).filter_by(shopping_id=demo.id, nivel=0).first()

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
    db.commit()
    print("Piso superior e Livraria Superior criados com sucesso.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed de banco para CI")
    parser.add_argument("--env", type=str, default="ci", help="Ambiente (ignorado, mantido por compatibilidade)")
    parser.add_argument("--include-floors", action="store_true", help="Inclui pisos multi-nível (piso superior)")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    upgrade_schema(engine)

    with SessionLocal.begin() as db:
        ensure_upper_floor(db)

    print("Seed de banco concluido com sucesso.")


if __name__ == "__main__":
    main()
