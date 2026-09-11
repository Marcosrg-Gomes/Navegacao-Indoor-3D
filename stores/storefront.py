"""
stores/storefront.py — Vitrine de lojas abertas (Open Storefronts)

Cria vitrines laterais parciais em vidro com pórtico em U invertido,
soleira de transição e caixa de cortina de enrolar no topo da fáscia,
mantendo o vão central 100% aberto no horário comercial.
"""

import bpy
from config import CONFIG
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from materials import MatNames


PORTICO_FINISHES = (
    MatNames.MADEIRA,
    MatNames.ALUMINIO,
    MatNames.MARMORE,
)


def _portico_material(store_name: str) -> str:
    """Alterna madeira nobre, alumínio escovado e mármore entre as lojas."""
    idx = sum(ord(ch) for ch in store_name) % len(PORTICO_FINISHES)
    return PORTICO_FINISHES[idx]


def create_storefront_glass(
    store_name: str,
    center_x: float,
    center_y: float,
    vitrine_width: float,
    collection: bpy.types.Collection,
    base_z: float = 0.0,
) -> list:
    """
    Painéis de vidro laterais da fachada, deixando o vão central aberto.
    """
    st = CONFIG["stores"]
    glass_thickness = 0.04
    glass_height = st["storefront_height"]

    wing_glass_w = vitrine_width * 0.28
    offset_y = (vitrine_width / 2.0) - (wing_glass_w / 2.0)

    objects = []

    g_left = create_box(
        name=f"LOJA_{store_name}_Vitrine_Esq",
        width=glass_thickness,
        depth=wing_glass_w,
        height=glass_height,
        location=(center_x, center_y - offset_y, base_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(g_left, collection)
    apply_material_by_name(g_left, MatNames.VIDRO)
    objects.append(g_left)

    g_right = create_box(
        name=f"LOJA_{store_name}_Vitrine_Dir",
        width=glass_thickness,
        depth=wing_glass_w,
        height=glass_height,
        location=(center_x, center_y + offset_y, base_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(g_right, collection)
    apply_material_by_name(g_right, MatNames.VIDRO)
    objects.append(g_right)

    return objects


def create_storefront_frame(
    store_name: str,
    center_x: float,
    center_y: float,
    store_width: float,
    collection: bpy.types.Collection,
    base_z: float = 0.0,
) -> list:
    """
    Pórtico em U invertido, caixa de cortina rolo e soleira de transição.
    """
    st = CONFIG["stores"]
    h = st["storefront_height"]
    frame_t = 0.10
    frame_depth = 0.14
    toward_corridor = 0.08 if center_x < 0 else -0.08
    fx = center_x + toward_corridor
    finish = _portico_material(store_name)
    open_span = store_width * 0.44

    objects = []

    verga = create_box(
        name=f"LOJA_{store_name}_Portico_Topo",
        width=frame_depth,
        depth=store_width,
        height=frame_t,
        location=(fx, center_y, base_z + h - frame_t),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(verga, collection)
    apply_material_by_name(verga, finish)
    objects.append(verga)

    for side, y_offset in (
        ("L", -(store_width / 2.0 - frame_t / 2.0)),
        ("R", +(store_width / 2.0 - frame_t / 2.0)),
    ):
        mont = create_box(
            name=f"LOJA_{store_name}_Portico_{side}",
            width=frame_depth,
            depth=frame_t,
            height=h,
            location=(fx, center_y + y_offset, base_z),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(mont, collection)
        apply_material_by_name(mont, finish)
        objects.append(mont)

    caixa_rolo = create_box(
        name=f"LOJA_{store_name}_CaixaRolo",
        width=0.22,
        depth=open_span,
        height=0.16,
        location=(fx, center_y, base_z + h - 0.04),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(caixa_rolo, collection)
    apply_material_by_name(caixa_rolo, MatNames.ALUMINIO)
    objects.append(caixa_rolo)

    soleira = create_box(
        name=f"LOJA_{store_name}_Soleira",
        width=0.42,
        depth=open_span,
        height=0.018,
        location=(center_x, center_y, base_z + 0.002),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(soleira, collection)
    apply_material_by_name(soleira, MatNames.MARMORE)
    objects.append(soleira)

    return objects
