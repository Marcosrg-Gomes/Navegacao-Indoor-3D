"""
lighting/general.py — Iluminação geral do corredor, pendentes do átrio e fitas LED

Gera:
  - Area Lights superiores ao longo da claraboia (Z = 9.0m)
  - Area Lights embutidas sob o forro do mezanino para o térreo (Z = 4.1m)
  - Pendentes esculturais suspensos (Halo Rings com material MAT_Pendente) no vão do átrio
  - Fitas LED decorativas contornando a face inferior da laje
  - Sol zenital suave através da claraboia
  - Iluminação dedicada da praça de alimentação
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_cylinder, create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_object_created, log_section, log_section_end, log_info
from materials import MatNames


def create_corridor_lights(collection: bpy.types.Collection) -> list:
    """Cria Area Lights no topo da claraboia e sol zenital."""
    s = CONFIG["shopping"]
    l_cfg = CONFIG["lighting"]
    count = l_cfg.get("general_count", 10)
    energy = l_cfg.get("general_energy", 2500.0)
    size = l_cfg.get("general_size", 2.5)

    light_z = s["height"] - 0.2
    half_l = DERIVED["half_length"]
    start_y = -half_l + 5.0
    end_y = half_l - 5.0
    step_y = (end_y - start_y) / max(count - 1, 1)

    objects = []

    for i in range(count):
        y_pos = start_y + i * step_y
        name = f"LUZ_GERAL_Superior_{i+1:02d}"

        light_data = bpy.data.lights.new(name=name, type='AREA')
        light_data.energy = energy
        light_data.size = size
        light_data.color = (1.0, 0.98, 0.94)

        light_obj = bpy.data.objects.new(name=name, object_data=light_data)
        light_obj.location = (0.0, y_pos, light_z)

        link_to_collection(light_obj, collection)
        objects.append(light_obj)

    # Sol zenital através da claraboia
    sun_data = bpy.data.lights.new(name="LUZ_SOL_Zenital", type='SUN')
    sun_data.energy = l_cfg.get("sun_energy", 3.5)
    sun_data.color = (1.0, 0.98, 0.92)
    sun_obj = bpy.data.objects.new(name="LUZ_SOL_Zenital", object_data=sun_data)
    sun_obj.location = (0.0, 0.0, s["height"] + 5.0)
    sun_obj.rotation_euler = (0.785, 0.2, 0.5)
    link_to_collection(sun_obj, collection)
    objects.append(sun_obj)

    return objects


def create_ground_ceiling_lights(collection: bpy.types.Collection) -> list:
    """Cria luminárias embutidas no forro sob o mezanino (iluminando o térreo)."""
    mz = CONFIG.get("mezzanine", {})
    slab_z = mz.get("height", 4.2)
    light_z = slab_z - 0.05
    half_l = DERIVED["half_length"]
    start_y = -half_l + 6.0
    end_y = half_l - 6.0
    count = 8
    step_y = (end_y - start_y) / max(count - 1, 1)

    objects = []

    # Linhas de luz sob as passarelas esquerda e direita
    for side_code, sign in [("Esq", -1), ("Dir", 1)]:
        lx = sign * 4.5
        for i in range(count):
            y_pos = start_y + i * step_y
            name = f"LUZ_Terreo_Forro_{side_code}_{i+1:02d}"

            light_data = bpy.data.lights.new(name=name, type='AREA')
            light_data.energy = 800.0
            light_data.size = 1.2
            light_data.color = (1.0, 0.97, 0.92)

            light_obj = bpy.data.objects.new(name=name, object_data=light_data)
            light_obj.location = (lx, y_pos, light_z)

            link_to_collection(light_obj, collection)
            objects.append(light_obj)

    return objects


def create_atrium_pendants(collection: bpy.types.Collection) -> list:
    """
    Cria pendentes esculturais (Halo Rings) suspensos por cabos metálicos no átrio.
    """
    s = CONFIG["shopping"]
    pendant_count = 5
    half_l = DERIVED["half_length"]
    start_y = -12.0
    end_y = 12.0
    step_y = (end_y - start_y) / max(pendant_count - 1, 1)
    ceiling_z = s["height"]

    objects = []

    for i in range(pendant_count):
        py = start_y + i * step_y
        pz = 6.2 - (0.4 if i % 2 == 1 else 0.0)
        radius = 0.85 if i % 2 == 0 else 0.60

        # Anel emissivo (Halo Ring)
        ring_name = f"DEC_PENDENTE_Halo_{i+1:02d}"
        ring = create_cylinder(
            name=ring_name,
            radius=radius,
            height=0.08,
            location=(0.0, py, pz),
            vertices=24,
            base_at_zero=False,
        )
        link_to_collection(ring, collection)
        apply_material_by_name(ring, MatNames.PENDENTE)
        objects.append(ring)

        # Cabo fino metálico de sustentação até o teto
        cable_h = ceiling_z - pz
        cable_name = f"DEC_PENDENTE_Cabo_{i+1:02d}"
        cable = create_cylinder(
            name=cable_name,
            radius=0.01,
            height=cable_h,
            location=(0.0, py, pz + cable_h / 2.0),
            vertices=8,
            base_at_zero=False,
        )
        link_to_collection(cable, collection)
        apply_material_by_name(cable, MatNames.METAL)
        objects.append(cable)

        # Luz pontual quente emitida pelo centro do lustre
        light_data = bpy.data.lights.new(name=f"LUZ_Pendente_{i+1:02d}", type='POINT')
        light_data.energy = 600.0
        light_data.color = (1.0, 0.88, 0.65)
        light_obj = bpy.data.objects.new(name=f"LUZ_Pendente_{i+1:02d}", object_data=light_data)
        light_obj.location = (0.0, py, pz)
        link_to_collection(light_obj, collection)
        objects.append(light_obj)

    return objects


def create_led_strips(collection: bpy.types.Collection) -> list:
    """
    Cria fitas de LED contornando a borda inferior da laje do mezanino.
    """
    mz = CONFIG.get("mezzanine", {})
    slab_z = mz.get("height", 4.2)
    atrium_w = mz.get("atrium_opening", 5.0)
    atrium_start_y = DERIVED["mz_atrium_start_y"]
    atrium_end_y = DERIVED["mz_atrium_end_y"]
    atrium_len = atrium_end_y - atrium_start_y
    center_y = (atrium_start_y + atrium_end_y) / 2.0

    objects = []

    half_aw = atrium_w / 2.0
    for side_code, sign in [("Esq", -1), ("Dir", 1)]:
        led_name = f"DEC_LED_Fita_{side_code}"
        led = create_box(
            name=led_name,
            width=0.04,
            depth=atrium_len,
            height=0.02,
            location=(sign * (half_aw + 0.02), center_y, slab_z - 0.01),
            centered_xy=True,
            base_at_zero=False,
        )
        link_to_collection(led, collection)
        apply_material_by_name(led, MatNames.LED)
        objects.append(led)

    return objects


def create_food_court_lights(collection: bpy.types.Collection) -> list:
    """Cria iluminação suave para a praça de alimentação no piso superior."""
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
        light_data.energy = 2200.0
        light_data.size = 4.0
        light_data.color = (1.0, 0.95, 0.88)

        light_obj = bpy.data.objects.new(name=name, object_data=light_data)
        light_obj.location = (lx, ly, light_z)

        link_to_collection(light_obj, collection)
        objects.append(light_obj)

    return objects


def build_general_lighting(collections: dict) -> dict:
    """Ponto de entrada do módulo de iluminação geral e pendentes."""
    log_section("Criando Iluminação Geral, Pendentes e Fitas LED")

    col_luz = collections.get("LUZ_GERAL")
    col_pendentes = collections.get("PENDENTES") or collections.get("05_DECORACAO") or col_luz

    if not col_luz:
        raise ValueError("Collection 'LUZ_GERAL' não encontrada.")

    result = {
        "corridor": create_corridor_lights(col_luz),
        "ground_ceiling": create_ground_ceiling_lights(col_luz),
        "food_court": create_food_court_lights(col_luz),
        "pendants": create_atrium_pendants(col_pendentes),
        "led_strips": create_led_strips(col_pendentes),
    }

    total = sum(len(v) for v in result.values())
    log_section_end(f"Iluminação e Pendentes ({total} elementos)")
    return result
