"""
stores/doors.py — Portas das lojas

Cria a porta de cada loja posicionada no centro da vitrine,
com folha de alumínio/metal.
"""

import bpy
from config import CONFIG
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_object_created
from materials import MatNames


def create_store_door(
    store_name: str,
    center_x: float,
    center_y: float,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    """
    Cria a porta de uma loja.
    A porta é um box fino posicionado à frente da vitrine,
    levemente deslocado para o corredor para simular a folha aberta.

    Args:
        store_name: Código da loja (ex: "E01").
        center_x: Borda da loja voltada para o corredor (X).
        center_y: Centro Y da loja.
        collection: Collection da loja.

    Returns:
        Objeto da porta.
    """
    st = CONFIG["stores"]
    door_w = st["door_width"]
    door_h = st["door_height"]
    door_t = 0.05   # Espessura da folha da porta (5 cm)

    # Ligeiramente deslocada para o corredor (simulando porta aberta para fora)
    door_offset = 0.1

    name = f"LOJA_{store_name}_Porta"
    obj = create_box(
        name=name,
        width=door_t,
        depth=door_w,
        height=door_h,
        location=(center_x + door_offset, center_y, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )

    link_to_collection(obj, collection)
    apply_material_by_name(obj, MatNames.PORTA)
    log_object_created(name, "Porta Loja")
    return obj
