"""
furniture/tables.py — Módulo complementar de mesas para praça de alimentação
"""

import bpy
from config import CONFIG
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from materials import MatNames


def create_single_table_set(
    name_prefix: str,
    location: tuple,
    collection: bpy.types.Collection,
) -> list:
    """Cria um conjunto isolado de mesa e cadeiras."""
    tc = CONFIG["tables"]
    tw, tl, th = tc["table_width"], tc["table_length"], tc["table_height"]
    cs, ch = tc["chair_size"], tc["chair_height"]
    cx, cy, cz = location

    objects = []

    # Mesa
    mesa = create_box(
        name=f"{name_prefix}_Mesa",
        width=tw,
        depth=tl,
        height=th,
        location=(cx, cy, cz),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(mesa, collection)
    apply_material_by_name(mesa, MatNames.MADEIRA)
    objects.append(mesa)

    # 4 Cadeiras
    pads = [(0, tl/2 + 0.2), (0, -tl/2 - 0.2), (tw/2 + 0.2, 0), (-tw/2 - 0.2, 0)]
    for i, (ox, oy) in enumerate(pads):
        cad = create_box(
            name=f"{name_prefix}_Cadeira_{i+1}",
            width=cs,
            depth=cs,
            height=ch,
            location=(cx + ox, cy + oy, cz),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(cad, collection)
        apply_material_by_name(cad, MatNames.BANCO_MADEIRA)
        objects.append(cad)

    return objects
