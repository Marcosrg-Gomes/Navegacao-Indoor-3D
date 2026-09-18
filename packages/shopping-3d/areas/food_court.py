"""
areas/food_court.py — Praça de alimentação no mezanino (Piso Superior)

Cria a área da praça de alimentação no piso superior do shopping (Z = 4.7m):
  - Balcão perimetral chanfrado em granito/mármore com coifa
  - Divisórias de balcão e separador frontal em vidro com corrimão de alumínio
  - Mesas com bandejas e cadeiras com assentos acolchoados
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_cylinder, create_rounded_box
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
    Cria balcões de praça de alimentação chanfrados no piso superior (Z=4.7m).
    """
    bounds = _get_food_court_bounds()
    mz = CONFIG.get("mezzanine", {})
    base_z = mz.get("floor_z", 4.7)
    counter_h = 1.12
    counter_t = 0.65

    objects = []

    # 1. Balcão de fundo (franquias) chanfrado
    back_counter = create_rounded_box(
        name="AREA_PRACA_Balcao_Fundo",
        width=bounds["width"],
        depth=counter_t,
        height=counter_h,
        bevel_radius=0.02,
        location=(0.0, bounds["back_y"] - counter_t / 2.0, base_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(back_counter, collection)
    apply_material_by_name(back_counter, MatNames.MARMORE)
    objects.append(back_counter)

    # 2. Balcão esquerdo
    left_depth = bounds["depth"] - counter_t
    left_counter = create_rounded_box(
        name="AREA_PRACA_Balcao_Esq",
        width=counter_t,
        depth=left_depth,
        height=counter_h,
        bevel_radius=0.02,
        location=(-bounds["half_width"] + counter_t / 2.0,
                  bounds["front_y"] + left_depth / 2.0, base_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(left_counter, collection)
    apply_material_by_name(left_counter, MatNames.MARMORE)
    objects.append(left_counter)

    # 3. Balcão direito
    right_counter = create_rounded_box(
        name="AREA_PRACA_Balcao_Dir",
        width=counter_t,
        depth=left_depth,
        height=counter_h,
        bevel_radius=0.02,
        location=(bounds["half_width"] - counter_t / 2.0,
                  bounds["front_y"] + left_depth / 2.0, base_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(right_counter, collection)
    apply_material_by_name(right_counter, MatNames.MARMORE)
    objects.append(right_counter)

    return objects


def create_food_court_separator(collection: bpy.types.Collection) -> list:
    """Cria o separador / guarda-corpo de vidro com corrimão da praça."""
    bounds = _get_food_court_bounds()
    mz = CONFIG.get("mezzanine", {})
    base_z = mz.get("floor_z", 4.7)
    sep_h = 1.05
    objects = []

    # Painel de vidro
    glass = create_box(
        name="AREA_PRACA_Separador_Vidro",
        width=bounds["width"],
        depth=0.015,
        height=sep_h - 0.05,
        location=(0.0, bounds["front_y"], base_z + 0.04),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(glass, collection)
    apply_material_by_name(glass, MatNames.VIDRO)
    objects.append(glass)

    # Corrimão de alumínio superior
    handrail = create_box(
        name="AREA_PRACA_Separador_Corrimao",
        width=bounds["width"],
        depth=0.06,
        height=0.04,
        location=(0.0, bounds["front_y"], base_z + sep_h - 0.02),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(handrail, collection)
    apply_material_by_name(handrail, MatNames.ALUMINIO)
    objects.append(handrail)

    return objects


def create_food_court_tables(collection: bpy.types.Collection) -> list:
    """Cria mesas e cadeiras com bandejas na praça de alimentação."""
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

    counter_t = 0.65
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

            # Mesa chanfrada em madeira
            t_name = f"AREA_PRACA_Mesa_{table_idx+1:02d}"
            mesa = create_rounded_box(
                name=t_name,
                width=table_w,
                depth=table_l,
                height=table_h,
                bevel_radius=0.015,
                location=(cx, cy, base_z),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(mesa, collection)
            apply_material_by_name(mesa, MatNames.MADEIRA)
            objects.append(mesa)

            # Bandeja de refeição na mesa
            bandeja = create_box(
                name=f"AREA_PRACA_Bandeja_{table_idx+1:02d}",
                width=0.28, depth=0.38, height=0.015,
                location=(cx, cy, base_z + table_h + 0.005),
                centered_xy=True, base_at_zero=True,
            )
            link_to_collection(bandeja, collection)
            apply_material_by_name(bandeja, MatNames.ROUPA_2 if (table_idx % 2 == 0) else MatNames.ROUPA_1)
            objects.append(bandeja)

            # Copo na mesa
            copo = create_cylinder(
                name=f"AREA_PRACA_Copo_{table_idx+1:02d}",
                radius=0.035, height=0.10, segments=10,
                location=(cx + 0.08, cy + 0.10, base_z + table_h + 0.015),
                base_at_zero=True,
            )
            link_to_collection(copo, collection)
            apply_material_by_name(copo, MatNames.VIDRO)
            objects.append(copo)

            # 4 Cadeiras com assento acolchoado
            chair_positions = [
                (cx, cy + table_l / 2.0 + chair_pad + chair_s / 2.0),
                (cx, cy - table_l / 2.0 - chair_pad - chair_s / 2.0),
                (cx - table_w / 2.0 - chair_pad - chair_s / 2.0, cy),
                (cx + table_w / 2.0 + chair_pad + chair_s / 2.0, cy),
            ]
            for ci, (chx, chy) in enumerate(chair_positions):
                ch_name = f"AREA_PRACA_Cadeira_{table_idx+1:02d}_{ci+1}"
                cadeira = create_rounded_box(
                    name=ch_name,
                    width=chair_s,
                    depth=chair_s,
                    height=chair_h,
                    bevel_radius=0.01,
                    location=(chx, chy, base_z),
                    centered_xy=True,
                    base_at_zero=True,
                )
                link_to_collection(cadeira, collection)
                apply_material_by_name(cadeira, MatNames.ACOLCHOADO)
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

    total = len(result["counters"]) + len(result["separator"]) + len(result["tables"])
    log_section_end(f"Praça de Alimentação ({total} objetos)")
    return result
