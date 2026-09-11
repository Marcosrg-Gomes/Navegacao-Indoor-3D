"""
furniture/kiosks.py — Quiosques tipo ilha no corredor térreo

Gera:
  - 3 Quiosques comerciais centrais ("Café & Arte", "Sorveteria Gelato", "Ótica Visão")
  - Balcão periférico em madeira/metal
  - Vitrines expositoras de vidro
  - Cobertura suspensa com 4 pilaretes metálicos
  - Letreiro 3D individual no topo da cobertura
"""

import bpy
from config import CONFIG
from utils.geometry import create_box, create_cylinder
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
    Cria um quiosque completo tipo ilha.
    """
    k_cfg = CONFIG.get("kiosks", {})
    w = k_cfg.get("width", 2.5)
    d = k_cfg.get("depth", 2.0)
    counter_h = k_cfg.get("height", 1.1)
    canopy_z = 2.4

    objects = []

    # 1. Balcão Principal (Base)
    counter = create_box(
        name=f"QUIOSQUE_{name}_Balcao",
        width=w,
        depth=d,
        height=counter_h,
        location=(0.0, center_y, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(counter, collection)
    apply_material_by_name(counter, MatNames.BANCO_MADEIRA)
    objects.append(counter)

    # 2. Vitrine Expositora de Vidro sobre o balcão
    glass_box = create_box(
        name=f"QUIOSQUE_{name}_Vidro",
        width=w * 0.85,
        depth=d * 0.85,
        height=0.4,
        location=(0.0, center_y, counter_h),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(glass_box, collection)
    apply_material_by_name(glass_box, MatNames.VIDRO)
    objects.append(glass_box)

    # 3. 4 Colunas Metálicas de Suporte da Cobertura
    col_r = 0.025
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

    # 4. Cobertura do Quiosque
    canopy = create_box(
        name=f"QUIOSQUE_{name}_Cobertura",
        width=w + 0.2,
        depth=d + 0.2,
        height=0.08,
        location=(0.0, center_y, canopy_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(canopy, collection)
    apply_material_by_name(canopy, MatNames.FACHADA_LOJA)
    objects.append(canopy)

    # 5. Letreiro 3D no Topo da Cobertura
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
        location=(0.0, center_y - (d / 2.0 + 0.12), canopy_z + 0.15),
        rotation_deg=(90.0, 0.0, 0.0),
        size=0.22,
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

    # Posições longitudinais no corredor térreo (evitando as escadas rolantes em Y=-4.5 a Y=4.5)
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
