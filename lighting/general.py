"""
lighting/general.py — Iluminação geral do corredor e áreas comuns

Cria lâmpadas (Area Lights e Point Lights) distribuídas ao longo do corredor
central e na praça de alimentação para fornecer iluminação funcional e estética.
"""

import bpy
from config import CONFIG, DERIVED
from utils.helpers import link_to_collection
from utils.logging import log_object_created, log_section, log_section_end, log_info


def create_corridor_lights(collection: bpy.types.Collection) -> list:
    """
    Cria uma série de Area Lights no teto do corredor central,
    apontando para baixo (eixo -Z).
    """
    s = CONFIG["shopping"]
    l_cfg = CONFIG["lighting"]
    count = l_cfg.get("general_count", 10)
    energy = l_cfg.get("general_energy", 2500.0)
    size = l_cfg.get("general_size", 2.5)
    z_offset = l_cfg.get("general_height_offset", 0.15)

    light_z = s["height"] - z_offset
    half_l = DERIVED["half_length"]
    start_y = -half_l + 5.0
    end_y = half_l - 5.0
    step_y = (end_y - start_y) / max(count - 1, 1)

    objects = []

    for i in range(count):
        y_pos = start_y + i * step_y
        name = f"LUZ_GERAL_Corredor_{i+1:02d}"

        light_data = bpy.data.lights.new(name=name, type='AREA')
        light_data.energy = energy
        light_data.size = size
        light_data.color = (1.0, 0.98, 0.94)  # Branco suave agradável

        light_obj = bpy.data.objects.new(name=name, object_data=light_data)
        light_obj.location = (0.0, y_pos, light_z)

        link_to_collection(light_obj, collection)
        log_object_created(name, "Area Light")
        objects.append(light_obj)

    # Adicionar Sol direcional suave através da claraboia
    sun_data = bpy.data.lights.new(name="LUZ_SOL_Zenital", type='SUN')
    sun_data.energy = l_cfg.get("sun_energy", 3.5)
    sun_data.color = (1.0, 0.98, 0.92)
    sun_obj = bpy.data.objects.new(name="LUZ_SOL_Zenital", object_data=sun_data)
    sun_obj.location = (0.0, 0.0, s["height"] + 5.0)
    sun_obj.rotation_euler = (0.785, 0.2, 0.5) # Inclinado a ~45 graus
    link_to_collection(sun_obj, collection)
    objects.append(sun_obj)

    log_info(f"Luzes gerais e sol zenital criados: {len(objects)}")
    return objects


def create_food_court_lights(collection: bpy.types.Collection) -> list:
    """Cria iluminação suave e potente para a praça de alimentação."""
    s = CONFIG["shopping"]
    fc = CONFIG["food_court"]
    half_l = DERIVED["half_length"]
    wt = s["wall_thickness"]

    back_y = half_l - wt - fc["offset_from_back"]
    center_y = back_y - fc["depth"] / 2.0
    light_z = s["height"] - 0.2

    objects = []
    positions = [
        (-fc["width"] / 4.0, center_y),
        (fc["width"] / 4.0, center_y),
        (0.0, center_y),
    ]

    for i, (lx, ly) in enumerate(positions):
        name = f"LUZ_GERAL_Praca_{i+1:02d}"
        light_data = bpy.data.lights.new(name=name, type='AREA')
        light_data.energy = 2000.0
        light_data.size = 4.0
        light_data.color = (1.0, 0.95, 0.88)

        light_obj = bpy.data.objects.new(name=name, object_data=light_data)
        light_obj.location = (lx, ly, light_z)

        link_to_collection(light_obj, collection)
        log_object_created(name, "Area Light Praça")
        objects.append(light_obj)

    return objects



def build_general_lighting(collections: dict) -> dict:
    """Ponto de entrada do módulo de iluminação geral."""
    log_section("Criando Iluminação Geral")

    col_luz = collections.get("LUZ_GERAL")
    if not col_luz:
        raise ValueError("Collection 'LUZ_GERAL' não encontrada.")

    result = {
        "corridor": create_corridor_lights(col_luz),
        "food_court": create_food_court_lights(col_luz),
    }

    total = len(result["corridor"]) + len(result["food_court"])
    log_section_end(f"Iluminação Geral ({total} lâmpadas)")
    return result
