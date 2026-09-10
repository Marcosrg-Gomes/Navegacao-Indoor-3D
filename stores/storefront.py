"""
stores/storefront.py — Vitrine de vidro das lojas

Cria o painel de vidro que ocupa a abertura frontal da loja,
entre a fachada metálica e a altura da vitrine definida em config.
"""

import bpy
from config import CONFIG
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_object_created
from materials import MatNames


def create_storefront_glass(
    store_name: str,
    center_x: float,
    center_y: float,
    vitrine_width: float,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    """
    Cria o painel de vidro da vitrine para uma loja.

    Args:
        store_name: Código da loja (ex: "E01", "D03") para nomear o objeto.
        center_x: Centro X da vitrine (borda do corredor).
        center_y: Centro Y da loja.
        vitrine_width: Largura da abertura de vidro (= largura da loja - estrutura).
        collection: Collection da loja.

    Returns:
        Objeto de vitrine.
    """
    st = CONFIG["stores"]
    glass_thickness = 0.05  # 5 cm de espessura do vidro
    glass_height = st["storefront_height"]

    name = f"LOJA_{store_name}_Vitrine"
    obj = create_box(
        name=name,
        width=glass_thickness,
        depth=vitrine_width,
        height=glass_height,
        location=(center_x, center_y, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )

    link_to_collection(obj, collection)
    apply_material_by_name(obj, MatNames.VIDRO)
    log_object_created(name, "Vitrine")
    return obj


def create_storefront_frame(
    store_name: str,
    center_x: float,
    center_y: float,
    store_width: float,
    collection: bpy.types.Collection,
) -> list:
    """
    Cria a estrutura metálica (caixilho) ao redor da vitrine.
    Composta por: montantes laterais + verga superior + peitoril inferior.

    Args:
        store_name: Código da loja.
        center_x: Centro X da vitrine (borda do corredor).
        center_y: Centro Y da loja.
        store_width: Largura total da fachada da loja.
        collection: Collection da loja.

    Returns:
        Lista de objetos do caixilho.
    """
    st = CONFIG["stores"]
    h = st["storefront_height"]
    s = CONFIG["shopping"]
    frame_t = 0.08       # Espessura do perfil metálico
    frame_depth = 0.05   # Profundidade do perfil

    objects = []

    # Verga superior (barra horizontal no topo da vitrine)
    verga_name = f"LOJA_{store_name}_Frame_Verga"
    verga = create_box(
        name=verga_name,
        width=frame_depth,
        depth=store_width,
        height=frame_t,
        location=(center_x, center_y, h - frame_t / 2),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(verga, collection)
    apply_material_by_name(verga, MatNames.FACHADA_LOJA)
    objects.append(verga)

    # Montante esquerdo
    for side, y_offset in [("L", -(store_width / 2.0 - frame_t / 2.0)),
                            ("R", +(store_width / 2.0 - frame_t / 2.0))]:
        mont_name = f"LOJA_{store_name}_Frame_{side}"
        mont = create_box(
            name=mont_name,
            width=frame_depth,
            depth=frame_t,
            height=h,
            location=(center_x, center_y + y_offset, 0.0),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(mont, collection)
        apply_material_by_name(mont, MatNames.FACHADA_LOJA)
        objects.append(mont)

    return objects
