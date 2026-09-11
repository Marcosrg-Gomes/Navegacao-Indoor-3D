"""
lighting/store_lights.py — Spots em trilho e sanca invertida das 22 lojas abertas

Gera:
  - Trilhos eletrificados pretos com spots direcionais
  - Fita LED indireta na sanca de gesso (perímetro interno)
  - Pontos de luz funcionais no teto das lojas
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_cylinder
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_section, log_section_end, log_info
from materials import MatNames


def _add(obj, collection, mat, objects):
    link_to_collection(obj, collection)
    apply_material_by_name(obj, mat)
    objects.append(obj)


def _store_fixture(store_code, center_x, center_y, light_z, energy, collection, objects):
    store_width = CONFIG["stores"]["width"]

    trilho = create_box(
        name=f"ILUM_{store_code}_Trilho",
        width=0.07, depth=store_width * 0.72, height=0.035,
        location=(center_x, center_y, light_z + 0.12),
        centered_xy=True, base_at_zero=True,
    )
    _add(trilho, collection, MatNames.FACHADA_LOJA, objects)

    for i, dy in enumerate((-1.1, 0.0, 1.1)):
        spot = create_cylinder(
            name=f"ILUM_{store_code}_Spot_{i+1}",
            radius=0.06, height=0.10, segments=12,
            location=(center_x, center_y + dy, light_z + 0.02),
            base_at_zero=True,
        )
        _add(spot, collection, MatNames.METAL, objects)

    sanca_w = 3.6
    sanca_d = store_width * 0.82
    for name, w, d, x, y in (
        ("N", sanca_w, 0.06, center_x, center_y + sanca_d / 2.0),
        ("S", sanca_w, 0.06, center_x, center_y - sanca_d / 2.0),
        ("L", 0.06, sanca_d, center_x - sanca_w / 2.0, center_y),
        ("O", 0.06, sanca_d, center_x + sanca_w / 2.0, center_y),
    ):
        led = create_box(
            name=f"ILUM_{store_code}_Sanca_{name}",
            width=w, depth=d, height=0.03,
            location=(x, y, light_z + 0.18),
            centered_xy=True, base_at_zero=True,
        )
        _add(led, collection, MatNames.LED, objects)

    name = f"LUZ_LOJA_{store_code}"
    light_data = bpy.data.lights.new(name=name, type='POINT')
    light_data.energy = energy
    light_data.color = (1.0, 0.96, 0.90)
    light_data.shadow_soft_size = 0.35
    light_obj = bpy.data.objects.new(name=name, object_data=light_data)
    light_obj.location = (center_x, center_y, light_z)
    link_to_collection(light_obj, collection)
    objects.append(light_obj)


def create_store_lights(collection: bpy.types.Collection) -> list:
    st = CONFIG["stores"]
    mz = CONFIG.get("mezzanine", {})
    l_cfg = CONFIG["lighting"]

    corridor_half = CONFIG["corridor"]["width"] / 2.0
    store_depth = st["depth"]
    store_width = st["width"]
    div_t = st["wall_thickness"]
    start_y = DERIVED["store_start_y"]
    count_ground = st["count_per_side"]
    count_mz = mz.get("count_per_side", 5)
    energy = l_cfg.get("store_energy", 850.0)
    z_offset = l_cfg.get("store_height_offset", 0.4)

    objects = []
    sides = [
        ("E", -(corridor_half + store_depth / 2.0)),
        ("D", +(corridor_half + store_depth / 2.0)),
    ]

    light_z_ground = st["storefront_height"] + 0.8 - z_offset
    for side_code, center_x in sides:
        for i in range(count_ground):
            store_code = f"{side_code}{i+1:02d}"
            center_y = start_y + i * (store_width + div_t) + store_width / 2.0
            _store_fixture(store_code, center_x, center_y, light_z_ground, energy, collection, objects)

    mz_floor_z = mz.get("floor_z", 4.7)
    light_z_mz = mz_floor_z + st["storefront_height"] + 0.8 - z_offset
    for side_code, center_x in sides:
        for i in range(count_mz):
            store_code = f"M{side_code}{i+1:02d}"
            center_y = start_y + i * (store_width + div_t) + store_width / 2.0
            _store_fixture(store_code, center_x, center_y, light_z_mz, energy, collection, objects)

    log_info(f"Luzes, trilhos e sancas de lojas: {len(objects)} elementos")
    return objects


def build_store_lighting(collections: dict) -> dict:
    log_section("Criando Iluminação, Trilhos e Sancas das Lojas (22 Lojas)")

    col_luz_lojas = collections.get("LUZ_LOJAS")
    if not col_luz_lojas:
        raise ValueError("Collection 'LUZ_LOJAS' não encontrada.")

    lights = create_store_lights(col_luz_lojas)
    log_section_end(f"Iluminação das Lojas ({len(lights)} elementos)")
    return {"store_lights": lights}
