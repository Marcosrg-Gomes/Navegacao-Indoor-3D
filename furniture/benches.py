"""
furniture/benches.py — Bancos de descanso no corredor do shopping

Cria um modelo base de banco com pés de metal e assento de madeira,
e posiciona instâncias vinculadas (linked duplicates) ao longo do corredor.
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name, create_linked_instance
from utils.logging import log_object_created, log_section, log_section_end, log_info
from materials import MatNames


def create_bench_prototype() -> bpy.types.Object:
    """
    Cria a geometria base de um banco de shopping moderno.
    (Assento em ripa de madeira + pés metálicos).

    Returns:
        Objeto Blender base do banco.
    """
    f_cfg = CONFIG["furniture"]
    l = f_cfg.get("bench_length", 2.0)
    w = f_cfg.get("bench_width", 0.5)
    h = f_cfg.get("bench_height", 0.45)

    # Assento do banco
    seat = create_box(
        name="PROTO_BANCO_Assento",
        width=w,
        depth=l,
        height=0.08,
        location=(0.0, 0.0, h - 0.08),
        centered_xy=True,
        base_at_zero=True,
    )
    apply_material_by_name(seat, MatNames.BANCO_MADEIRA)
    return seat


def build_benches(collections: dict) -> list:
    """
    Cria e distribui os bancos ao longo do corredor central.
    """
    log_section("Criando Bancos do Corredor")

    col_bancos = collections.get("BANCOS")
    if not col_bancos:
        raise ValueError("Collection 'BANCOS' não encontrada.")

    f_cfg = CONFIG["furniture"]
    count = f_cfg.get("bench_count", 6)
    half_l = DERIVED["half_length"]

    start_y = -half_l + 10.0
    end_y = half_l - 16.0
    step_y = (end_y - start_y) / max(count - 1, 1)

    # Criar protótipo
    proto = create_bench_prototype()
    proto.name = "MOB_BANCO_01"
    proto.location = (0.0, start_y, 0.0)
    link_to_collection(proto, col_bancos)
    log_object_created(proto.name, "Banco (Protótipo)")

    benches = [proto]

    # Criar instâncias vinculadas (compartilhando a malha)
    for i in range(1, count):
        y_pos = start_y + i * step_y
        name = f"MOB_BANCO_{i+1:02d}"

        # Alternar levemente o lado ou manter no eixo central
        x_offset = 1.2 if (i % 2 == 0) else -1.2

        inst = create_linked_instance(
            source_obj=proto,
            name=name,
            location=(x_offset, y_pos, 0.0),
            collection=col_bancos,
        )
        log_object_created(name, "Banco (Instância)")
        benches.append(inst)

    log_section_end(f"Bancos ({len(benches)} no corredor)")
    return benches
