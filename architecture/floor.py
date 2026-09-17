"""
architecture/floor.py — Criação dos pisos e laje do mezanino

Gera:
  - Piso principal térreo (MAT_Piso_Shopping)
  - Laje estrutural do mezanino em "U" (Z=4.2m, espessura 0.5m, MAT_Laje_Mezanino)
  - Piso caminhável das passarelas do mezanino (Z=4.7m, MAT_Piso_Mezanino)
  - Piso da praça de alimentação no mezanino (Z=4.7m, MAT_Piso_Praca)
  - Pisos individuais das lojas (térreo e mezanino)
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_info, log_object_created, log_section, log_section_end
from materials import MatNames


def create_main_floor(collection: bpy.types.Collection) -> bpy.types.Object:
    """Cria o piso principal cobrindo toda a área interna do shopping no térreo."""
    s = CONFIG["shopping"]

    floor_width = s["width"] - 2 * s["wall_thickness"]
    floor_length = s["length"] - 2 * s["wall_thickness"]
    floor_thickness = s["floor_thickness"]

    obj = create_box(
        name="ARQ_PISO_Principal",
        width=floor_width,
        depth=floor_length,
        height=floor_thickness,
        location=(0.0, 0.0, -floor_thickness),
        centered_xy=True,
        base_at_zero=True,
    )

    link_to_collection(obj, collection)
    apply_material_by_name(obj, MatNames.PISO_SHOPPING)
    log_object_created("ARQ_PISO_Principal", "Piso Principal")
    return obj


def create_mezzanine_slab(collection: bpy.types.Collection) -> list:
    """
    Cria a laje estrutural do mezanino em formato perimetral ("U" com galerias).
    Mantém o vão central do átrio de 5.0m aberto para o pé-direito duplo.
    Laje inicia em Z = mezzanine.height (4.2m) com espessura de 0.5m até Z = 4.7m.
    """
    s = CONFIG["shopping"]
    mz = CONFIG.get("mezzanine", {})
    wt = s["wall_thickness"]

    slab_z = mz.get("height", 4.2)
    slab_thick = mz.get("slab_thickness", 0.5)
    atrium_w = mz.get("atrium_opening", 5.0)

    total_inner_w = s["width"] - 2 * wt
    total_inner_l = s["length"] - 2 * wt
    half_l = DERIVED["half_length"]

    # Largura de cada asa lateral (lojas + passarela):
    wing_w = (total_inner_w - atrium_w) / 2.0
    wing_center_offset_x = atrium_w / 2.0 + wing_w / 2.0

    objects = []

    # 1. Laje Lateral Esquerda (asa Oeste)
    slab_left = create_box(
        name="ARQ_LAJE_Mezanino_Esq",
        width=wing_w,
        depth=total_inner_l,
        height=slab_thick,
        location=(-wing_center_offset_x, 0.0, slab_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(slab_left, collection)
    apply_material_by_name(slab_left, MatNames.LAJE_MEZANINO)
    objects.append(slab_left)

    # 2. Laje Lateral Direita (asa Leste)
    slab_right = create_box(
        name="ARQ_LAJE_Mezanino_Dir",
        width=wing_w,
        depth=total_inner_l,
        height=slab_thick,
        location=(wing_center_offset_x, 0.0, slab_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(slab_right, collection)
    apply_material_by_name(slab_right, MatNames.LAJE_MEZANINO)
    objects.append(slab_right)

    # 3. Laje de Conexão Frontal (mezanino sobre a entrada / hall sul)
    front_bridge_depth = DERIVED["mz_atrium_start_y"] - DERIVED["front_wall_y"]
    front_bridge_center_y = -half_l + wt + front_bridge_depth / 2.0
    slab_front = create_box(
        name="ARQ_LAJE_Mezanino_Frente",
        width=atrium_w,
        depth=front_bridge_depth,
        height=slab_thick,
        location=(0.0, front_bridge_center_y, slab_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(slab_front, collection)
    apply_material_by_name(slab_front, MatNames.LAJE_MEZANINO)
    objects.append(slab_front)

    # 4. Laje de Conexão Fundo (praça de alimentação e sanitários no mezanino)
    back_bridge_depth = DERIVED["back_wall_y"] - DERIVED["mz_atrium_end_y"]
    back_bridge_center_y = half_l - wt - back_bridge_depth / 2.0
    slab_back = create_box(
        name="ARQ_LAJE_Mezanino_Fundo",
        width=atrium_w,
        depth=back_bridge_depth,
        height=slab_thick,
        location=(0.0, back_bridge_center_y, slab_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(slab_back, collection)
    apply_material_by_name(slab_back, MatNames.LAJE_MEZANINO)
    objects.append(slab_back)

    # 5. Pisos de acabamento caminhável para as passarelas do Mezanino
    walkway_w = DERIVED["mz_walkway_width"]
    walkway_offset_x = DERIVED["mz_right_center_x"]
    mz_floor_z = mz.get("floor_z", 4.7)

    for side, sign in [("Esq", -1), ("Dir", 1)]:
        walk_floor = create_box(
            name=f"ARQ_PISO_Mezanino_Passarela_{side}",
            width=walkway_w,
            depth=total_inner_l,
            height=0.01,
            location=(sign * walkway_offset_x, 0.0, mz_floor_z + 0.001),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(walk_floor, collection)
        apply_material_by_name(walk_floor, MatNames.PISO_MEZANINO)
        objects.append(walk_floor)

    return objects


def create_food_court_floor(collection: bpy.types.Collection) -> bpy.types.Object:
    """
    Cria o piso da praça de alimentação no piso superior (Mezanino em Z=4.7m).
    """
    s = CONFIG["shopping"]
    fc = CONFIG["food_court"]
    mz = CONFIG.get("mezzanine", {})

    back_y = DERIVED["half_length"] - s["wall_thickness"]
    depth = fc["depth"]
    width = fc["width"]
    center_y = back_y - depth / 2.0 - fc["offset_from_back"]
    floor_z = mz.get("floor_z", 4.7)

    obj = create_box(
        name="ARQ_PISO_Praca",
        width=width,
        depth=depth,
        height=0.01,
        location=(0.0, center_y, floor_z + 0.002),
        centered_xy=True,
        base_at_zero=True,
    )

    link_to_collection(obj, collection)
    apply_material_by_name(obj, MatNames.PISO_PRACA)
    log_object_created("ARQ_PISO_Praca", "Piso Praça")
    return obj


def create_store_floors(
    collection: bpy.types.Collection,
) -> list:
    """
    Cria pisos individuais para cada loja, 2 mm acima da cota base do pavimento,
    com materiais e paginações específicas por segmento de loja.
    """
    floors = []
    for code, pos in DERIVED["store_positions"].items():
        base_z = CONFIG["mezzanine"]["floor_z"] if pos["is_mezzanine"] else 0.0
        obj = create_box(
            name=f"LOJA_{code}_Piso",
            width=pos["store_depth"],
            depth=pos["store_width"],
            height=0.01,
            location=(pos["center_x"], pos["center_y"], base_z + 0.002),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(obj, collection)
        apply_material_by_name(obj, pos["floor_mat"])
        floors.append(obj)

    return floors


def build_floors(collections: dict) -> dict:
    """
    Ponto de entrada principal do módulo.
    Cria todos os pisos e lajes do shopping nos dois pavimentos.
    """
    log_section("Criando Pisos e Laje do Mezanino")

    col_pisos = collections.get("PISOS")
    col_mezanino = collections.get("MEZANINO", col_pisos)
    col_lojas = collections.get("02_LOJAS")

    if not col_pisos:
        raise ValueError("Collection 'PISOS' não encontrada.")

    result = {}

    # Piso principal térreo
    result["main"] = create_main_floor(col_pisos)

    # Laje do Mezanino e passarelas
    if CONFIG["features"].get("mezzanine", True):
        result["mezzanine"] = create_mezzanine_slab(col_mezanino)
    else:
        result["mezzanine"] = []

    # Piso da praça de alimentação
    result["food_court"] = create_food_court_floor(col_pisos)

    # Pisos das lojas
    if (CONFIG["features"].get("stores", True)
            and CONFIG["features"].get("store_floors", True) and col_lojas):
        result["stores"] = create_store_floors(col_pisos)
    else:
        result["stores"] = []

    total = 1 + len(result["mezzanine"]) + 1 + len(result["stores"])
    log_section_end(f"Pisos e Lajes ({total} elementos)")
    return result
