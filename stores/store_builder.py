"""
stores/store_builder.py — Construtor parametrizado de lojas

Monta cada loja completa:
  - Sub-Collection individual (LOJA_E01, LOJA_D03, etc.)
  - Parede de fundo interna
  - Parede superior da vitrine (acima do vidro até o teto rebaixado)
  - Vitrine de vidro
  - Caixilho metálico
  - Porta
  - Fachada lateral (banda colorida acima da vitrine)

Convenção de lados:
  "E" = Esquerdo — lojas ficam no lado -X (corredor à direita)
  "D" = Direito  — lojas ficam no lado +X (corredor à esquerda)

Para o lado E, a vitrine enfrenta +X (corredor).
Para o lado D, a vitrine enfrenta -X (corredor).
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
    """
    Calcula todas as posições relevantes para uma loja.

    Args:
        side: "E" (esquerdo) ou "D" (direito).
        index: Índice da loja (0-based).

    Returns:
        Dicionário com coordenadas e dimensões da loja.
    """
    st = CONFIG["stores"]
    corridor_half = CONFIG["corridor"]["width"] / 2.0
    store_depth = st["depth"]
    store_width = st["width"]
    div_t = st["wall_thickness"]
    start_y = DERIVED["store_start_y"]

    # Centro Y desta loja
    center_y = start_y + index * (store_width + div_t) + store_width / 2.0

    if side == "E":
        # Lojas do lado esquerdo: de X = -(corridor_half + store_depth) até X = -corridor_half
        inner_x = -corridor_half          # Borda do corredor (vitrine aqui)
        outer_x = -(corridor_half + store_depth)
        center_x = -(corridor_half + store_depth / 2.0)
        vitrine_x = inner_x              # X da vitrine (face do corredor)
    else:
        # Lojas do lado direito: de X = +corridor_half até X = +(corridor_half + store_depth)
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
) -> dict:
    """
    Cria uma loja completa com todos seus elementos.

    Args:
        side: "E" ou "D".
        index: Índice 0-based da loja.
        parent_collection: Collection 02_LOJAS (pai).

    Returns:
        Dicionário com todos os objetos criados para esta loja.
    """
    store_code = f"{side}{index+1:02d}"
    store_col_name = f"LOJA_{store_code}"

    # Criar Sub-Collection para esta loja
    store_col = get_or_create_collection(store_col_name, parent=parent_collection)

    pos = _get_store_position(side, index)
    st = CONFIG["stores"]
    s = CONFIG["shopping"]
    vitrine_h = st["storefront_height"]
    store_h = s["height"]

    # Largura interna da vitrine (descontando os montantes)
    glass_width = pos["store_width"] - 0.16  # 8 cm de montante em cada lado

    objects = {}

    # ------------------------------------------------------------------
    # 1. Parede superior da vitrine (acima do vidro, até o teto rebaixado)
    # ------------------------------------------------------------------
    fascia_h = store_h - vitrine_h
    fascia_name = f"LOJA_{store_code}_Fascia"
    fascia = create_box(
        name=fascia_name,
        width=0.15,
        depth=pos["store_width"],
        height=fascia_h,
        location=(pos["vitrine_x"], pos["center_y"], vitrine_h),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(fascia, store_col)
    apply_material_by_name(fascia, MatNames.FACHADA_LOJA)
    log_object_created(fascia_name, "Fáscia")
    objects["fascia"] = fascia

    # ------------------------------------------------------------------
    # 2. Vitrine de vidro
    # ------------------------------------------------------------------
    objects["glass"] = create_storefront_glass(
        store_name=store_code,
        center_x=pos["vitrine_x"],
        center_y=pos["center_y"],
        vitrine_width=glass_width,
        collection=store_col,
    )

    # ------------------------------------------------------------------
    # 3. Caixilho metálico
    # ------------------------------------------------------------------
    frame_parts = create_storefront_frame(
        store_name=store_code,
        center_x=pos["vitrine_x"],
        center_y=pos["center_y"],
        store_width=pos["store_width"],
        collection=store_col,
    )
    objects["frame"] = frame_parts

    # ------------------------------------------------------------------
    # 4. Porta
    # ------------------------------------------------------------------
    objects["door"] = create_store_door(
        store_name=store_code,
        center_x=pos["vitrine_x"],
        center_y=pos["center_y"],
        collection=store_col,
    )

    return objects


def build_stores(collections: dict) -> dict:
    """
    Ponto de entrada principal. Cria todas as lojas dos dois lados.

    Args:
        collections: Dicionário de Collections do projeto.

    Returns:
        Dicionário {store_code: {objetos}} para todas as lojas.
    """
    log_section("Criando Lojas")

    col_lojas = collections.get("02_LOJAS")
    if not col_lojas:
        raise ValueError("Collection '02_LOJAS' não encontrada.")

    count = CONFIG["stores"]["count_per_side"]
    all_stores = {}
    total_objs = 0

    for side in ("E", "D"):
        side_label = "Esquerdo" if side == "E" else "Direito"
        log_info(f"  Criando {count} lojas — Lado {side_label}")
        for i in range(count):
            store_code = f"{side}{i+1:02d}"
            store_objects = create_store(side, i, col_lojas)
            all_stores[store_code] = store_objects
            # Contar objetos (glass, door, fascia + frame parts)
            total_objs += 3 + len(store_objects.get("frame", []))

    log_section_end(f"Lojas ({count * 2} lojas, ~{total_objs} objetos)")
    return all_stores
