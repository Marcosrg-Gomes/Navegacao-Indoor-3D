"""
areas/food_court.py — Praça de alimentação no mezanino (Piso Superior)

Cria a área da praça de alimentação no piso superior do shopping (Z = 4.7m):
  - Balcão perimetral de praça (volume que representa as franquias)
  - Divisórias de balcão
  - Guarda-corpo e separador frontal
  - Mesas e cadeiras distribuídas na praça
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_object_created, log_section, log_section_end, log_info
from materials import MatNames


def _get_food_court_bounds() -> dict:
    """Calcula os limites da praça de alimentação."""
    s = CONFIG["shopping"]
    fc = CONFIG["food_court"]
    half_l = DERIVED["half_length"]
    wt = s["wall_thickness"]

    back_y = half_l - wt
    fc_back_y = back_y - fc["offset_from_back"]
    fc_front_y = fc_back_y - fc["depth"]
    fc_center_y = (fc_front_y + fc_back_y) / 2.0

    return {
        "back_y": fc_back_y,
        "front_y": fc_front_y,
        "center_y": fc_center_y,
        "width": fc["width"],
        "depth": fc["depth"],
        "half_width": fc["width"] / 2.0,
    }


def create_food_court_counters(collection: bpy.types.Collection) -> list:
    """
    Cria balcões de praça de alimentação no piso superior (Z=4.7m).
    """
    bounds = _get_food_court_bounds()
    mz = CONFIG.get("mezzanine", {})
    base_z = mz.get("floor_z", 4.7)
    counter_h = 1.1
    counter_t = 0.6

    objects = []

    # Balcão de fundo (franquias)
    back_counter = create_box(
        name="AREA_PRACA_Balcao_Fundo",
        width=bounds["width"],
        depth=counter_t,
        height=counter_h,
        location=(0.0, bounds["back_y"] - counter_t / 2.0, base_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(back_counter, collection)
    apply_material_by_name(back_counter, MatNames.PAREDE)
    objects.append(back_counter)

    # Balcão esquerdo
    left_depth = bounds["depth"] - counter_t
    left_counter = create_box(
        name="AREA_PRACA_Balcao_Esq",
        width=counter_t,
        depth=left_depth,
        height=counter_h,
        location=(-bounds["half_width"] + counter_t / 2.0,
                  bounds["front_y"] + left_depth / 2.0, base_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(left_counter, collection)
    apply_material_by_name(left_counter, MatNames.PAREDE)
    objects.append(left_counter)

    # Balcão direito
    right_counter = create_box(
        name="AREA_PRACA_Balcao_Dir",
        width=counter_t,
        depth=left_depth,
        height=counter_h,
        location=(bounds["half_width"] - counter_t / 2.0,
                  bounds["front_y"] + left_depth / 2.0, base_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(right_counter, collection)
    apply_material_by_name(right_counter, MatNames.PAREDE)
    objects.append(right_counter)

    return objects


def create_food_court_separator(collection: bpy.types.Collection) -> bpy.types.Object:
    """Cria o separador / guarda-corpo da praça."""
    bounds = _get_food_court_bounds()
    mz = CONFIG.get("mezzanine", {})
    base_z = mz.get("floor_z", 4.7)
    sep_h = 1.1

    obj = create_box(
        name="AREA_PRACA_Separador",
        width=bounds["width"],
        depth=0.08,
        height=sep_h,
        location=(0.0, bounds["front_y"], base_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(obj, collection)
    apply_material_by_name(obj, MatNames.VIDRO)
    return obj


def create_food_court_tables(collection: bpy.types.Collection) -> list:
    """Cria mesas e cadeiras na praça de alimentação no mezanino."""
    fc = CONFIG["food_court"]
    tc = CONFIG["tables"]
    mz = CONFIG.get("mezzanine", {})
    base_z = mz.get("floor_z", 4.7)
    bounds = _get_food_court_bounds()

    table_w = tc["table_width"]
    table_l = tc["table_length"]
    table_h = tc["table_height"]
    chair_s = tc["chair_size"]
    chair_h = tc["chair_height"]
    chair_pad = 0.1

    objects = []
    table_count = fc["table_count"]

    cols = min(4, table_count)
    rows = (table_count + cols - 1) // cols

    counter_t = 0.6
    margin = 1.0
    avail_w = bounds["width"] - 2 * counter_t - 2 * margin
    avail_d = bounds["depth"] - counter_t - 2 * margin

    col_step = avail_w / max(cols, 1)
    row_step = avail_d / max(rows, 1)

    table_idx = 0
    for row in range(rows):
        for col in range(cols):
            if table_idx >= table_count:
                break

            cx = -avail_w / 2.0 + col_step * (col + 0.5)
            cy = bounds["front_y"] + margin + row_step * (row + 0.5)

            t_name = f"AREA_PRACA_Mesa_{table_idx+1:02d}"
            mesa = create_box(
                name=t_name,
                width=table_w,
                depth=table_l,
                height=table_h,
                location=(cx, cy, base_z),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(mesa, collection)
            apply_material_by_name(mesa, MatNames.MADEIRA)
            objects.append(mesa)

            chair_positions = [
                (cx, cy + table_l / 2.0 + chair_pad + chair_s / 2.0),
                (cx, cy - table_l / 2.0 - chair_pad - chair_s / 2.0),
                (cx - table_w / 2.0 - chair_pad - chair_s / 2.0, cy),
                (cx + table_w / 2.0 + chair_pad + chair_s / 2.0, cy),
            ]
            for ci, (chx, chy) in enumerate(chair_positions):
                ch_name = f"AREA_PRACA_Cadeira_{table_idx+1:02d}_{ci+1}"
                cadeira = create_box(
                    name=ch_name,
                    width=chair_s,
                    depth=chair_s,
                    height=chair_h,
                    location=(chx, chy, base_z),
                    centered_xy=True,
                    base_at_zero=True,
                )
                link_to_collection(cadeira, collection)
                apply_material_by_name(cadeira, MatNames.BANCO_MADEIRA)
                objects.append(cadeira)

            table_idx += 1

    return objects


def build_food_court(collections: dict) -> dict:
    """Ponto de entrada da praça de alimentação."""
    log_section("Criando Praça de Alimentação (Piso Superior - Mezanino)")

    col_praca = collections.get("PRACA_ALIMENTACAO") or collections.get("03_AREAS")
    if not col_praca:
        raise ValueError("Collection 'PRACA_ALIMENTACAO' não encontrada.")

    result = {
        "counters": create_food_court_counters(col_praca),
        "separator": create_food_court_separator(col_praca),
        "tables": create_food_court_tables(col_praca),
    }

    total = len(result["counters"]) + 1 + len(result["tables"])
    log_section_end(f"Praça de Alimentação ({total} objetos)")
    return result
