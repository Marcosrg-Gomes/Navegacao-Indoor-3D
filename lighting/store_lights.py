"""
lighting/store_lights.py — Spots em trilho direcionais e sanca invertida das 22 lojas abertas

Gera:
  - Trilhos eletrificados com spots cônicos direcionais
  - Fontes de luz SPOT apontadas para vitrines e produtos
  - Fita LED indireta na sanca de gesso (perímetro interno adaptado às dimensões reais da loja)
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_cylinder, create_cone
from utils.helpers import link_to_collection, apply_material_by_name, set_object_rotation
from utils.logging import log_section, log_section_end, log_info
from materials import MatNames


def _add(obj, collection, mat, objects):
    link_to_collection(obj, collection)
    apply_material_by_name(obj, mat)
    objects.append(obj)


def _store_fixture(store_code, center_x, center_y, light_z, energy, collection, objects, store_width=4.5, store_depth=8.0):
    # 1. Trilho eletrificado preto
    trilho = create_box(
        name=f"ILUM_{store_code}_Trilho",
        width=0.07, depth=store_width * 0.75, height=0.035,
        location=(center_x, center_y, light_z + 0.12),
        centered_xy=True, base_at_zero=True,
    )
    _add(trilho, collection, MatNames.FACHADA_LOJA, objects)

    # 2. Spots cônicos direcionais em metal
    for i, dy in enumerate((-store_width * 0.26, 0.0, store_width * 0.26)):
        spot_cone = create_cone(
            name=f"ILUM_{store_code}_SpotCone_{i+1}",
            radius_top=0.04, radius_bottom=0.07, height=0.12, segments=12,
            location=(center_x, center_y + dy, light_z),
            base_at_zero=True,
        )
        _add(spot_cone, collection, MatNames.METAL, objects)

    # 3. Sanca perimetral em LED
    sanca_w = max(store_depth * 0.72, 3.2)
    sanca_d = max(store_width * 0.78, 2.8)
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

    # 4. Fonte de luz direcional SPOT no Blender
    name = f"LUZ_LOJA_{store_code}"
    light_data = bpy.data.lights.new(name=name, type='SPOT')
    light_data.energy = energy
    light_data.color = (1.0, 0.96, 0.90)
    light_data.spot_size = 1.25   # ~70 graus
    light_data.spot_blend = 0.45
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
    store_positions = DERIVED.get("store_positions", {})
    count_ground = st["count_per_side"]
    count_mz = mz.get("count_per_side", 5)
    energy = l_cfg.get("store_energy", 850.0)
    z_offset = l_cfg.get("store_height_offset", 0.4)

    objects = []
    light_z_ground = st["storefront_height"] + 0.8 - z_offset

    # 1. Luzes Térreo
    for side_code in ("E", "D"):
        for i in range(count_ground):
            store_code = f"{side_code}{i+1:02d}"
            info = store_positions.get(store_code, {})
            cx = info.get("center_x", (-1 if side_code == "E" else 1) * (corridor_half + st["depth"] / 2.0))
            cy = info.get("center_y", DERIVED["store_start_y"] + i * (st["width"] + st["wall_thickness"]) + st["width"] / 2.0)
            sw = info.get("store_width", st["width"])
            sd = info.get("store_depth", st["depth"])

            _store_fixture(store_code, cx, cy, light_z_ground, energy, collection, objects, sw, sd)

    # 2. Luzes Mezanino
    mz_floor_z = mz.get("floor_z", 4.7)
    light_z_mz = mz_floor_z + st["storefront_height"] + 0.8 - z_offset
    for side_code in ("E", "D"):
        for i in range(count_mz):
            store_code = f"M{side_code}{i+1:02d}"
            info = store_positions.get(store_code, {})
            cx = info.get("center_x", (-1 if side_code == "E" else 1) * (corridor_half + st["depth"] / 2.0))
            cy = info.get("center_y", DERIVED["store_start_y"] + i * (st["width"] + st["wall_thickness"]) + st["width"] / 2.0)
            sw = info.get("store_width", st["width"])
            sd = info.get("store_depth", st["depth"])

            _store_fixture(store_code, cx, cy, light_z_mz, energy, collection, objects, sw, sd)

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
