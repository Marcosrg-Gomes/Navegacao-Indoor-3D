"""
architecture/walls.py — Criação das paredes do shopping (Dois Pavimentos)

Gera:
  - 4 paredes externas (Norte/Sul/Leste/Oeste) com abertura para a entrada
  - Paredes internas divisórias entre lojas do térreo (Z: 0 a 4.2m)
  - Paredes internas divisórias entre lojas do mezanino (Z: 4.7m a 9.2m)
  - Parede de fundo de cada pavimento

Convenção de orientação:
  Sul  = frente (entrada), Y = -half_length  (menor Y)
  Norte = fundo,           Y = +half_length  (maior Y)
  Oeste = esquerda,        X = -half_width
  Leste = direita,         X = +half_width
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_wall_with_opening
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_info, log_object_created, log_section, log_section_end
from materials import MatNames


# =============================================================================
# PAREDES EXTERNAS
# =============================================================================

def create_external_walls(collection: bpy.types.Collection) -> list:
    """
    Cria as 4 paredes externas do shopping com altura total (9.2m).
    A parede sul (frente) tem abertura para a entrada principal.
    """
    s = CONFIG["shopping"]
    ent = CONFIG["entrance"]

    half_w = DERIVED["half_width"]
    half_l = DERIVED["half_length"]
    wt = s["wall_thickness"]
    h = s["height"]

    objects = []

    # 1. PAREDE NORTE (fundo)
    obj_norte = create_box(
        name="ARQ_PAREDE_EXT_Norte",
        width=s["width"],
        depth=wt,
        height=h,
        location=(0.0, half_l - wt / 2.0, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(obj_norte, collection)
    apply_material_by_name(obj_norte, MatNames.PAREDE)
    log_object_created("ARQ_PAREDE_EXT_Norte", "Parede")
    objects.append(obj_norte)

    # 2. PAREDE SUL (frente/entrada com abertura)
    wall_parts = create_wall_with_opening(
        name="ARQ_PAREDE_EXT_Sul",
        wall_length=s["width"],
        wall_height=h,
        wall_thickness=wt,
        opening_width=ent["width"],
        opening_height=ent["height"],
        opening_offset_x=0.0,
        location=(0.0, -half_l + wt / 2.0, 0.0),
        axis="X",
    )
    for part in wall_parts:
        link_to_collection(part, collection)
        apply_material_by_name(part, MatNames.PAREDE)
        log_object_created(part.name, "Parede")
    objects.extend(wall_parts)

    # 3. PAREDE OESTE (esquerda)
    obj_oeste = create_box(
        name="ARQ_PAREDE_EXT_Oeste",
        width=wt,
        depth=s["length"],
        height=h,
        location=(-half_w + wt / 2.0, 0.0, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(obj_oeste, collection)
    apply_material_by_name(obj_oeste, MatNames.PAREDE)
    log_object_created("ARQ_PAREDE_EXT_Oeste", "Parede")
    objects.append(obj_oeste)

    # 4. PAREDE LESTE (direita)
    obj_leste = create_box(
        name="ARQ_PAREDE_EXT_Leste",
        width=wt,
        depth=s["length"],
        height=h,
        location=(half_w - wt / 2.0, 0.0, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(obj_leste, collection)
    apply_material_by_name(obj_leste, MatNames.PAREDE)
    log_object_created("ARQ_PAREDE_EXT_Leste", "Parede")
    objects.append(obj_leste)

    return objects


# =============================================================================
# PAREDES INTERNAS — DIVISÓRIAS ENTRE LOJAS
# =============================================================================

def create_store_dividers(collection: bpy.types.Collection) -> list:
    """
    Cria paredes divisórias entre lojas do térreo e mezanino respeitando larguras individuais.
    """
    s = CONFIG["shopping"]
    st = CONFIG["stores"]
    mz = CONFIG.get("mezzanine", {})
    corridor_half = CONFIG["corridor"]["width"] / 2.0
    store_positions = DERIVED.get("store_positions", {})

    store_depth = st["depth"]
    div_t = st["wall_thickness"]

    ground_h = mz.get("height", 4.2)
    upper_base_z = mz.get("floor_z", 4.7)
    upper_h = s["height"] - upper_base_z

    objects = []

    # 1. Divisórias do Térreo (E01..E06 e D01..D06)
    count_ground = st["count_per_side"]
    for side_code in ("E", "D"):
        sign = -1 if side_code == "E" else 1
        for i in range(count_ground - 1):
            c1 = f"{side_code}{i+1:02d}"
            c2 = f"{side_code}{i+2:02d}"
            info1 = store_positions.get(c1, {})
            info2 = store_positions.get(c2, {})
            sd = max(info1.get("store_depth", store_depth), info2.get("store_depth", store_depth))
            center_x = sign * (corridor_half + sd / 2.0)
            div_y = (info1.get("end_y", 0.0) + info2.get("start_y", 0.0)) / 2.0 if (c1 in store_positions and c2 in store_positions) else (DERIVED["store_start_y"] + (i + 1) * st["width"] + i * div_t + div_t / 2.0)

            name = f"ARQ_PAREDE_INT_T_{side_code}{i+1:02d}_{side_code}{i+2:02d}"
            obj = create_box(
                name=name,
                width=sd,
                depth=div_t,
                height=ground_h,
                location=(center_x, div_y, 0.0),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(obj, collection)
            apply_material_by_name(obj, MatNames.PAREDE)
            objects.append(obj)

    # 2. Divisórias do Mezanino (ME01..ME05 e MD01..MD05)
    count_mz = mz.get("count_per_side", 5)
    for side_code in ("E", "D"):
        sign = -1 if side_code == "E" else 1
        for i in range(count_mz - 1):
            c1 = f"M{side_code}{i+1:02d}"
            c2 = f"M{side_code}{i+2:02d}"
            info1 = store_positions.get(c1, {})
            info2 = store_positions.get(c2, {})
            sd = max(info1.get("store_depth", store_depth), info2.get("store_depth", store_depth))
            center_x = sign * (corridor_half + sd / 2.0)
            div_y = (info1.get("end_y", 0.0) + info2.get("start_y", 0.0)) / 2.0 if (c1 in store_positions and c2 in store_positions) else (DERIVED["store_start_y"] + (i + 1) * st["width"] + i * div_t + div_t / 2.0)

            name = f"ARQ_PAREDE_INT_M_{side_code}{i+1:02d}_{side_code}{i+2:02d}"
            obj = create_box(
                name=name,
                width=sd,
                depth=div_t,
                height=upper_h,
                location=(center_x, div_y, upper_base_z),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(obj, collection)
            apply_material_by_name(obj, MatNames.PAREDE)
            objects.append(obj)

    return objects


def create_store_back_walls(collection: bpy.types.Collection) -> list:
    """Fecha cada loja na profundidade e largura definidas pelo layout comum."""
    s = CONFIG["shopping"]
    mz = CONFIG["mezzanine"]
    thickness = CONFIG["stores"]["wall_thickness"]
    objects = []

    for code, pos in DERIVED["store_positions"].items():
        sign = -1 if pos["side"] == "E" else 1
        base_z = mz["floor_z"] if pos["is_mezzanine"] else 0.0
        ceiling_z = s["height"] if pos["is_mezzanine"] else mz["height"]
        obj = create_box(
            name=f"ARQ_PAREDE_FUNDO_{code}",
            width=thickness,
            depth=pos["store_width"] + thickness,
            height=ceiling_z - base_z,
            location=(pos["outer_x"] + sign * thickness / 2.0,
                      pos["center_y"], base_z),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(obj, collection)
        apply_material_by_name(obj, MatNames.PAREDE)
        objects.append(obj)

    return objects


# =============================================================================
# PONTO DE ENTRADA
# =============================================================================

def build_walls(collections: dict) -> dict:
    """
    Cria todas as paredes do shopping em ambos os pavimentos.
    """
    log_section("Criando Paredes")

    col_ext = collections.get("PAREDES_EXTERNAS")
    col_int = collections.get("PAREDES_INTERNAS")

    if not col_ext:
        raise ValueError("Collection 'PAREDES_EXTERNAS' não encontrada.")
    if not col_int:
        raise ValueError("Collection 'PAREDES_INTERNAS' não encontrada.")

    result = {}

    result["external"] = create_external_walls(col_ext)
    log_info(f"Paredes externas criadas: {len(result['external'])}")

    if CONFIG["features"].get("stores", True):
        result["dividers"] = create_store_dividers(col_int)
        result["back_walls"] = create_store_back_walls(col_int)
        log_info(f"Divisórias criadas: {len(result['dividers'])}")
        log_info(f"Paredes de fundo criadas: {len(result['back_walls'])}")
    else:
        result["dividers"] = []
        result["back_walls"] = []

    total = sum(len(v) for v in result.values())
    log_section_end(f"Paredes ({total} objetos)")
    return result
