"""
furniture/kiosks.py — Quiosques tipo ilha no corredor térreo com cobertura piramidal

Gera:
  - 3 Quiosques comerciais centrais ("Café & Arte", "Sorveteria Gelato", "Ótica Visão")
  - Balcão periférico chanfrado em madeira/metal
  - Vitrines expositoras de vidro com prateleiras e produtos internos
  - Cobertura piramidal suspensa com 4 pilaretes metálicos e fita LED perimetral
  - Letreiro 3D volumétrico na fachada da cobertura
"""

import bpy
from config import CONFIG
from utils.geometry import create_box, create_cylinder, create_rounded_box, create_trapezoid_box, create_glass_case
from utils.helpers import link_to_collection, apply_material_by_name, set_object_rotation
from utils.logging import log_info, log_object_created, log_section, log_section_end
from materials import create_principled_material, MatNames
from stores.signs import create_3d_text


def create_single_kiosk(
    name: str,
    brand_name: str,
    brand_color: tuple,
    center_y: float,
    collection: bpy.types.Collection,
) -> list:
    """
    Cria um quiosque completo tipo ilha com cobertura piramidal e prateleiras.
    """
    k_cfg = CONFIG.get("kiosks", {})
    w = k_cfg.get("width", 2.5)
    d = k_cfg.get("depth", 2.0)
    counter_h = k_cfg.get("height", 1.1)
    canopy_z = 2.45

    objects = []

    # 1. Balcão Principal chanfrado (Base)
    counter = create_rounded_box(
        name=f"QUIOSQUE_{name}_Balcao",
        width=w,
        depth=d,
        height=counter_h,
        bevel_radius=0.02,
        location=(0.0, center_y, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(counter, collection)
    apply_material_by_name(counter, MatNames.BANCO_MADEIRA)
    objects.append(counter)

    # 2. Vitrine Expositora com prateleiras e produtos internos
    for glass_box in create_glass_case(
        name=f"QUIOSQUE_{name}_Vidro",
        width=w * 0.85,
        depth=d * 0.85,
        height=0.42,
        location=(0.0, center_y, counter_h),
    ):
        link_to_collection(glass_box, collection)
        apply_material_by_name(glass_box, MatNames.VIDRO)
        objects.append(glass_box)

    # Prateleira interna da vitrine
    prat_interna = create_box(
        name=f"QUIOSQUE_{name}_Prat_Interna",
        width=w * 0.78,
        depth=d * 0.78,
        height=0.02,
        location=(0.0, center_y, counter_h + 0.20),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(prat_interna, collection)
    apply_material_by_name(prat_interna, MatNames.ALUMINIO)
    objects.append(prat_interna)

    # Pequenos produtos em exposição
    for pi, px in enumerate((-0.55, 0.0, 0.55)):
        prod = create_cylinder(
            name=f"QUIOSQUE_{name}_Prod_{pi+1}",
            radius=0.06,
            height=0.12,
            segments=10,
            location=(px, center_y, counter_h + 0.22),
            base_at_zero=True,
        )
        link_to_collection(prod, collection)
        apply_material_by_name(prod, MatNames.LOUCA)
        objects.append(prod)

    # 3. 4 Colunas Metálicas de Suporte da Cobertura
    col_r = 0.022
    half_cw = w / 2.0 - 0.1
    half_cd = d / 2.0 - 0.1
    for i, (dx, dy) in enumerate([(-half_cw, -half_cd), (half_cw, -half_cd), (-half_cw, half_cd), (half_cw, half_cd)]):
        col = create_cylinder(
            name=f"QUIOSQUE_{name}_Coluna_{i+1}",
            radius=col_r,
            height=canopy_z,
            location=(dx, center_y + dy, 0.0),
            base_at_zero=True,
        )
        link_to_collection(col, collection)
        apply_material_by_name(col, MatNames.METAL)
        objects.append(col)

    # 4. Cobertura piramidal elegante (cone truncado piramidal / trapezoid)
    canopy = create_trapezoid_box(
        name=f"QUIOSQUE_{name}_Cobertura_Piramidal",
        top_width=w * 0.35,
        top_depth=d * 0.35,
        bottom_width=w + 0.25,
        bottom_depth=d + 0.25,
        height=0.45,
        location=(0.0, center_y, canopy_z),
        base_at_zero=True,
    )
    link_to_collection(canopy, collection)
    apply_material_by_name(canopy, MatNames.FACHADA_LOJA)
    objects.append(canopy)

    # 5. Fita LED no perímetro sob a cobertura
    led_canopy = create_box(
        name=f"QUIOSQUE_{name}_LED_Canopy",
        width=w + 0.20,
        depth=d + 0.20,
        height=0.02,
        location=(0.0, center_y, canopy_z - 0.01),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(led_canopy, collection)
    apply_material_by_name(led_canopy, MatNames.LED)
    objects.append(led_canopy)

    # 6. Letreiro 3D na Fachada da Cobertura
    mat_name = f"MAT_QUIOSQUE_{name}"
    create_principled_material(
        name=mat_name,
        color=(1.0, 1.0, 1.0, 1.0),
        emission=brand_color,
        emission_strength=4.0,
        roughness=0.2,
    )

    sign_text = create_3d_text(
        name=f"DEC_TEXTO_QUIOSQUE_{name}",
        text=brand_name,
        location=(0.0, center_y - (d / 2.0 + 0.15), canopy_z + 0.15),
        rotation_deg=(90.0, 0.0, 0.0),
        size=0.18,
        extrude=0.02,
        collection=collection,
    )
    apply_material_by_name(sign_text, mat_name)
    objects.append(sign_text)

    return objects


def build_kiosks(collections: dict) -> list:
    """
    Cria os quiosques no corredor central térreo.
    """
    log_section("Criando Quiosques Ilha no Corredor Térreo")

    col_quiosques = collections.get("QUIOSQUES") or collections.get("04_MOBILIARIO")
    if not col_quiosques:
        col_quiosques = list(collections.values())[0]

    k_cfg = CONFIG.get("kiosks", {})
    names = k_cfg.get("names", ["Café & Arte", "Sorveteria Gelato", "Ótica Visão"])
    colors = k_cfg.get("colors", [
        (1.0, 0.7, 0.3, 1.0),
        (0.3, 0.8, 1.0, 1.0),
        (0.3, 1.0, 0.5, 1.0),
    ])

    y_positions = [-16.0, -9.0, 14.0]

    all_kiosks = []
    for i, (name, col, y) in enumerate(zip(names, colors, y_positions)):
        prefix = f"K{i+1:02d}"
        objs = create_single_kiosk(
            name=prefix,
            brand_name=name,
            brand_color=col[:3],
            center_y=y,
            collection=col_quiosques,
        )
        all_kiosks.extend(objs)

    log_section_end(f"Quiosques ({len(all_kiosks)} objetos)")
    return all_kiosks
