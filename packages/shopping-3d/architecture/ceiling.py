"""
architecture/ceiling.py — Criação do teto e claraboia zenital envidraçada (Skylight)

Gera:
  - Lajes de teto laterais sobre o pavimento superior (Z = 9.2m)
  - Claraboia central envidraçada longitudinal sobre o átrio
  - 14 vigas metálicas treliçadas transversais para suporte da claraboia
  - Forro rebaixado diferenciado sobre as lojas do mezanino
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_object_created, log_section, log_section_end
from materials import MatNames


def create_skylight_ceiling(collection: bpy.types.Collection) -> list:
    """
    Cria as lajes do teto no topo do shopping (Z = 9.2m) com abertura central
    (claraboia) e o vidro translúcido com caixilhos metálicos transversais.
    """
    s = CONFIG["shopping"]
    c = CONFIG["corridor"]
    ct = s["ceiling_thickness"]
    skylight_w = c["width"] * 0.75  # Claraboia ampla ocupando 6.0m de vão
    ceil_h = s["height"]

    half_w = DERIVED["half_width"]
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
    beam_count = 14
    step_y = inner_len / max(beam_count - 1, 1)
    start_y = -inner_len / 2.0

    for i in range(beam_count):
        by = start_y + i * step_y
        beam = create_box(
            name=f"ARQ_TETO_Claraboia_Viga_{i+1:02d}",
            width=skylight_w + 0.3,
            depth=0.18,
            height=0.25,
            location=(0.0, by, ceil_h),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(beam, collection)
        apply_material_by_name(beam, MatNames.METAL)
        objects.append(beam)

    return objects


def create_store_ceiling_drop(collection: bpy.types.Collection) -> list:
    """Cria forros rebaixados elegantes sobre as lojas do piso superior com grelhas lineares de ar condicionado."""
    s = CONFIG["shopping"]
    st = CONFIG["stores"]
    mz = CONFIG.get("mezzanine", {})
    upper_floor_z = mz.get("floor_z", 4.7)
    store_ceiling_h = upper_floor_z + st["storefront_height"] + 0.8
    drop_thickness = s["height"] - store_ceiling_h

    if drop_thickness <= 0.05:
        return []

    objects = []

    for code, pos in DERIVED["store_positions"].items():
        if not pos["is_mezzanine"]:
            continue
        sign = -1 if pos["side"] == "E" else 1
        center_x, center_y = pos["center_x"], pos["center_y"]
        store_depth = pos["store_depth"]
        store_width = pos["store_width"]
        name = f"ARQ_TETO_Rebaixado_{code}"

        # 1. Forro de gesso rebaixado
        obj = create_box(
            name=name,
            width=store_depth,
            depth=store_width,
            height=drop_thickness,
            location=(center_x, center_y, store_ceiling_h),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(obj, collection)
        apply_material_by_name(obj, MatNames.TETO)
        objects.append(obj)

        # 2. Grelha linear de Ar Condicionado (ao fundo do forro)
        grelha = create_box(
            name=f"ARQ_TETO_GrelhaAr_{code}",
            width=0.18,
            depth=store_width * 0.92,
            height=0.02,
            location=(pos["outer_x"] - sign * 0.40, center_y, store_ceiling_h - 0.01),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(grelha, collection)
        apply_material_by_name(grelha, MatNames.GRELHA_AR)
        objects.append(grelha)

    return objects


def build_ceiling(collections: dict) -> dict:
    """Ponto de entrada do teto com claraboia zenital."""
    log_section("Criando Teto e Claraboia Zenital (2 Pavimentos)")

    col_teto = collections.get("TETO")
    if not col_teto:
        raise ValueError("Collection 'TETO' não encontrada.")

    skylight_parts = create_skylight_ceiling(col_teto)
    store_drops = (create_store_ceiling_drop(col_teto)
                   if CONFIG["features"].get("stores", True)
                   and CONFIG["features"].get("store_ceilings", True) else [])

    result = {
        "skylight": skylight_parts,
        "store_drops": store_drops,
    }

    total = len(skylight_parts) + len(store_drops)
    log_section_end(f"Teto com Claraboia ({total} elementos)")
    return result
