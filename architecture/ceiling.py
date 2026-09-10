"""
architecture/ceiling.py — Criação do teto e claraboia envidraçada (Skylight)

Gera:
  - Lajes de teto laterais sobre as lojas
  - Claraboia central envidraçada longitudinal sobre o corredor
  - Vigas metálicas treliçadas transversais para suporte da claraboia
  - Forro rebaixado diferenciado sobre as lojas
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_object_created, log_section, log_section_end
from materials import MatNames


def create_skylight_ceiling(collection: bpy.types.Collection) -> list:
    """
    Cria as lajes do teto com abertura central (claraboia) e o vidro translúcido
    com caixilhos metálicos transversais sobre o corredor.
    """
    s = CONFIG["shopping"]
    c = CONFIG["corridor"]
    ct = s["ceiling_thickness"]
    skylight_w = c["width"] * 0.6  # Claraboia ocupa 60% da largura do corredor (ex: 4.8m)
    ceil_h = s["height"]

    half_w = DERIVED["half_width"]
    half_l = DERIVED["half_length"]
    wt = s["wall_thickness"]
    inner_len = s["length"] - 2 * wt

    objects = []

    # 1. Laje lateral Esquerda (do limite oeste até a borda da claraboia)
    slab_left_w = (half_w - wt) - (skylight_w / 2.0)
    slab_left = create_box(
        name="ARQ_TETO_Laje_Esq",
        width=slab_left_w,
        depth=inner_len,
        height=ct,
        location=(-half_w + wt + slab_left_w / 2.0, 0.0, ceil_h),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(slab_left, collection)
    apply_material_by_name(slab_left, MatNames.TETO)
    objects.append(slab_left)

    # 2. Laje lateral Direita
    slab_right = create_box(
        name="ARQ_TETO_Laje_Dir",
        width=slab_left_w,
        depth=inner_len,
        height=ct,
        location=(half_w - wt - slab_left_w / 2.0, 0.0, ceil_h),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(slab_right, collection)
    apply_material_by_name(slab_right, MatNames.TETO)
    objects.append(slab_right)

    # 3. Vidro da Claraboia Central
    skylight_glass = create_box(
        name="ARQ_TETO_Claraboia_Vidro",
        width=skylight_w,
        depth=inner_len,
        height=0.04,
        location=(0.0, 0.0, ceil_h + ct / 2.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(skylight_glass, collection)
    apply_material_by_name(skylight_glass, MatNames.VIDRO)
    log_object_created("ARQ_TETO_Claraboia_Vidro", "Vidro da Claraboia")
    objects.append(skylight_glass)

    # 4. Vigas metálicas transversais ao longo da claraboia
    beam_count = 12
    step_y = inner_len / max(beam_count - 1, 1)
    start_y = -inner_len / 2.0

    for i in range(beam_count):
        by = start_y + i * step_y
        beam = create_box(
            name=f"ARQ_TETO_Claraboia_Viga_{i+1:02d}",
            width=skylight_w + 0.2,
            depth=0.15,
            height=0.20,
            location=(0.0, by, ceil_h),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(beam, collection)
        apply_material_by_name(beam, MatNames.METAL)
        objects.append(beam)

    return objects


def create_store_ceiling_drop(collection: bpy.types.Collection) -> list:
    """Cria forros rebaixados sobre as lojas para transição volumétrica elegante."""
    s = CONFIG["shopping"]
    st = CONFIG["stores"]
    corridor_half = CONFIG["corridor"]["width"] / 2.0

    store_depth = st["depth"]
    store_ceiling_h = st["storefront_height"] + 0.8
    drop_thickness = s["height"] - store_ceiling_h

    start_y = DERIVED["store_start_y"]
    count = st["count_per_side"]
    div_t = st["wall_thickness"]
    total_store_length = count * st["width"] + (count - 1) * div_t

    objects = []

    sides = [
        ("E", -(corridor_half + store_depth / 2.0)),
        ("D", +(corridor_half + store_depth / 2.0)),
    ]

    for side_code, center_x in sides:
        name = f"ARQ_TETO_Rebaixado_{side_code}"
        center_y = start_y + total_store_length / 2.0

        obj = create_box(
            name=name,
            width=store_depth,
            depth=total_store_length,
            height=drop_thickness,
            location=(center_x, center_y, store_ceiling_h),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(obj, collection)
        apply_material_by_name(obj, MatNames.TETO)
        objects.append(obj)

    return objects


def build_ceiling(collections: dict) -> dict:
    """Ponto de entrada do teto com claraboia."""
    log_section("Criando Teto e Claraboia Zenital")

    col_teto = collections.get("TETO")
    if not col_teto:
        raise ValueError("Collection 'TETO' não encontrada.")

    skylight_parts = create_skylight_ceiling(col_teto)
    store_drops = create_store_ceiling_drop(col_teto)

    result = {
        "skylight": skylight_parts,
        "store_drops": store_drops,
    }

    total = len(skylight_parts) + len(store_drops)
    log_section_end(f"Teto com Claraboia ({total} elementos)")
    return result
