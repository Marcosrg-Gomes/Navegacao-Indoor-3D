"""
stores/store_builder.py — Construtor parametrizado de lojas (Térreo e Mezanino)

Monta 22 lojas abertas (12 no térreo e 10 no mezanino):
  - Sub-Collection individual por loja
  - Fáscia superior
  - Vitrine lateral de vidro com vão central aberto
  - Pórtico, caixa de cortina rolo e soleira
  - Sem portas de vidro no horário comercial
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import (
    link_to_collection,
    apply_material_by_name,
    get_or_create_collection,
)
from utils.logging import log_info, log_object_created, log_section, log_section_end
from materials import MatNames
from stores.storefront import create_storefront_glass, create_storefront_frame
from stores.doors import create_store_door


def _get_store_position(side: str, index: int) -> dict:
    """Calcula coordenadas e dimensões de uma loja."""
    st = CONFIG["stores"]
    corridor_half = CONFIG["corridor"]["width"] / 2.0
    store_depth = st["depth"]
    store_width = st["width"]
    div_t = st["wall_thickness"]
    start_y = DERIVED["store_start_y"]

    center_y = start_y + index * (store_width + div_t) + store_width / 2.0

    if side == "E":
        inner_x = -corridor_half
        outer_x = -(corridor_half + store_depth)
        center_x = -(corridor_half + store_depth / 2.0)
        vitrine_x = inner_x
    else:
        inner_x = +corridor_half
        outer_x = +(corridor_half + store_depth)
        center_x = +(corridor_half + store_depth / 2.0)
        vitrine_x = inner_x

    return {
        "center_x": center_x,
        "center_y": center_y,
        "inner_x": inner_x,
        "outer_x": outer_x,
        "vitrine_x": vitrine_x,
        "store_width": store_width,
        "store_depth": store_depth,
    }


def create_store(
    side: str,
    index: int,
    parent_collection: bpy.types.Collection,
    is_mezzanine: bool = False,
) -> dict:
    """
    Cria uma loja individual completa no térreo ou mezanino.
    """
    st = CONFIG["stores"]
    s = CONFIG["shopping"]
    mz = CONFIG.get("mezzanine", {})

    prefix = "M" if is_mezzanine else ""
    store_code = f"{prefix}{side}{index+1:02d}"
    store_col_name = f"LOJA_{store_code}"

    store_col = get_or_create_collection(store_col_name, parent=parent_collection)

    pos = _get_store_position(side, index)
    base_z = mz.get("floor_z", 4.7) if is_mezzanine else 0.0
    store_ceiling_z = s["height"] if is_mezzanine else mz.get("height", 4.2)
    store_total_h = store_ceiling_z - base_z
    vitrine_h = st["storefront_height"]

    glass_width = pos["store_width"] - 0.16

    objects = {}

    # 1. Fáscia superior da vitrine
    fascia_h = store_total_h - vitrine_h
    fascia_name = f"LOJA_{store_code}_Fascia"
    fascia = create_box(
        name=fascia_name,
        width=0.15,
        depth=pos["store_width"],
        height=max(fascia_h, 0.4),
        location=(pos["vitrine_x"], pos["center_y"], base_z + vitrine_h),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(fascia, store_col)
    apply_material_by_name(fascia, MatNames.FACHADA_LOJA)
    objects["fascia"] = fascia

    # 2. Vitrine de vidro
    objects["glass"] = create_storefront_glass(
        store_name=store_code,
        center_x=pos["vitrine_x"],
        center_y=pos["center_y"],
        vitrine_width=glass_width,
        collection=store_col,
        base_z=base_z,
    )

    # 3. Caixilho metálico
    frame_parts = create_storefront_frame(
        store_name=store_code,
        center_x=pos["vitrine_x"],
        center_y=pos["center_y"],
        store_width=pos["store_width"],
        collection=store_col,
        base_z=base_z,
    )
    objects["frame"] = frame_parts

    # 4. Porta
    objects["door"] = create_store_door(
        store_name=store_code,
        center_x=pos["vitrine_x"],
        center_y=pos["center_y"],
        collection=store_col,
        base_z=base_z,
    )

    return objects


def build_stores(collections: dict) -> dict:
    """
    Ponto de entrada principal. Cria todas as 22 lojas (12 no térreo e 10 no mezanino).
    """
    log_section("Criando Lojas (Térreo e Mezanino)")

    col_lojas = collections.get("02_LOJAS")
    if not col_lojas:
        raise ValueError("Collection '02_LOJAS' não encontrada.")

    count_ground = CONFIG["stores"]["count_per_side"]
    count_mz = CONFIG.get("mezzanine", {}).get("count_per_side", 5)

    all_stores = {}
    total_objs = 0

    # 1. Lojas do Térreo (E01-E06, D01-D06)
    for side in ("E", "D"):
        side_label = "Esquerdo" if side == "E" else "Direito"
        log_info(f"  Criando {count_ground} lojas térreo — Lado {side_label}")
        for i in range(count_ground):
            store_code = f"{side}{i+1:02d}"
            store_objects = create_store(side, i, col_lojas, is_mezzanine=False)
            all_stores[store_code] = store_objects
            total_objs += 3 + len(store_objects.get("frame", []))

    # 2. Lojas do Mezanino (ME01-ME05, MD01-MD05)
    for side in ("E", "D"):
        side_label = "Esquerdo" if side == "E" else "Direito"
        log_info(f"  Criando {count_mz} lojas mezanino — Lado {side_label}")
        for i in range(count_mz):
            store_code = f"M{side}{i+1:02d}"
            store_objects = create_store(side, i, col_lojas, is_mezzanine=True)
            all_stores[store_code] = store_objects
            total_objs += 3 + len(store_objects.get("frame", []))

    total_stores_count = (count_ground + count_mz) * 2
    log_section_end(f"Lojas ({total_stores_count} lojas no total, ~{total_objs} objetos)")
    return all_stores
