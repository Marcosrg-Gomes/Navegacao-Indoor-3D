"""
lighting/store_lights.py — Iluminação interna individual para cada loja

Cria lâmpadas pontuais (Point/Spot/Area) no centro do teto de cada loja
para destacar os interiores e as vitrines.
"""

import bpy
from config import CONFIG, DERIVED
from utils.helpers import link_to_collection
from utils.logging import log_object_created, log_section, log_section_end, log_info


def create_store_lights(collection: bpy.types.Collection) -> list:
    """
    Cria uma luz no teto de cada uma das lojas (lados E e D).

    Args:
        collection: Collection LUZ_LOJAS.

    Returns:
        Lista de objetos de luz criados.
    """
    st = CONFIG["stores"]
    s = CONFIG["shopping"]
    l_cfg = CONFIG["lighting"]

    corridor_half = CONFIG["corridor"]["width"] / 2.0
    store_depth = st["depth"]
    store_width = st["width"]
    div_t = st["wall_thickness"]
    start_y = DERIVED["store_start_y"]
    count = st["count_per_side"]

    energy = l_cfg.get("store_energy", 250.0)
    light_type = l_cfg.get("store_light_type", "POINT")
    z_offset = l_cfg.get("store_height_offset", 0.5)

    # Altura da luz da loja (abaixo do forro da loja)
    store_h = st["storefront_height"] + 0.8
    light_z = store_h - z_offset

    objects = []

    sides = [
        ("E", -(corridor_half + store_depth / 2.0)),
        ("D", +(corridor_half + store_depth / 2.0)),
    ]

    for side_code, center_x in sides:
        for i in range(count):
            store_code = f"{side_code}{i+1:02d}"
            center_y = start_y + i * (store_width + div_t) + store_width / 2.0
            name = f"LUZ_LOJA_{store_code}"

            light_data = bpy.data.lights.new(name=name, type=light_type)
            light_data.energy = energy
            light_data.color = (1.0, 0.95, 0.9)  # Tom agradável de vitrine

            if light_type == 'POINT':
                light_data.shadow_soft_size = 0.3
            elif light_type == 'AREA':
                light_data.size = 1.5

            light_obj = bpy.data.objects.new(name=name, object_data=light_data)
            light_obj.location = (center_x, center_y, light_z)

            link_to_collection(light_obj, collection)
            log_object_created(name, f"Luz Loja ({light_type})")
            objects.append(light_obj)

    log_info(f"Luzes de lojas criadas: {len(objects)}")
    return objects


def build_store_lighting(collections: dict) -> dict:
    """Ponto de entrada do módulo de iluminação das lojas."""
    log_section("Criando Iluminação das Lojas")

    col_luz_lojas = collections.get("LUZ_LOJAS")
    if not col_luz_lojas:
        raise ValueError("Collection 'LUZ_LOJAS' não encontrada.")

    lights = create_store_lights(col_luz_lojas)
    log_section_end(f"Iluminação das Lojas ({len(lights)} lâmpadas)")
    return {"store_lights": lights}
