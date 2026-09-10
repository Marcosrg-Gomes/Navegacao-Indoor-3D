"""
furniture/planters.py — Vasos de plantas decorativas para o shopping

Cria vasos cilíndricos com folhagens (esferas de baixa resolução)
distribuídos pelo shopping para compor o paisagismo interno.
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_cylinder, create_sphere_ico
from utils.helpers import link_to_collection, apply_material_by_name, create_linked_instance
from utils.logging import log_object_created, log_section, log_section_end
from materials import MatNames


def create_planter_prototype() -> tuple:
    """Cria um vaso e sua folhagem como protótipo."""
    f_cfg = CONFIG["furniture"]
    p_radius = f_cfg.get("planter_radius", 0.35)
    p_height = f_cfg.get("planter_height", 0.5)
    plant_h = f_cfg.get("plant_height", 0.8)

    # Vaso
    pot = create_cylinder(
        name="PROTO_VASO_Base",
        radius=p_radius,
        height=p_height,
        segments=16,
        location=(0.0, 0.0, 0.0),
        base_at_zero=True,
    )
    apply_material_by_name(pot, MatNames.VASO)

    # Folhagem / Arbusto
    bush = create_sphere_ico(
        name="PROTO_PLANTA_Folhagem",
        radius=p_radius * 1.3,
        subdivisions=2,
        location=(0.0, 0.0, p_height + plant_h * 0.4),
    )
    apply_material_by_name(bush, MatNames.PLANTA)

    return pot, bush


def build_planters(collections: dict) -> list:
    """Distribui vasos de plantas pelo shopping."""
    log_section("Criando Vasos de Plantas")

    col_vasos = collections.get("VASOS")
    if not col_vasos:
        raise ValueError("Collection 'VASOS' não encontrada.")

    f_cfg = CONFIG["furniture"]
    count = f_cfg.get("planter_count", 6)
    half_l = DERIVED["half_length"]

    start_y = -half_l + 12.0
    end_y = half_l - 14.0
    step_y = (end_y - start_y) / max(count - 1, 1)

    pot_proto, bush_proto = create_planter_prototype()

    # Primeiro par no início
    pot_proto.name = "MOB_VASO_01"
    pot_proto.location = (0.0, start_y, 0.0)
    link_to_collection(pot_proto, col_vasos)

    bush_proto.name = "MOB_PLANTA_01"
    bush_proto.location = (0.0, start_y, 0.5 + 0.32)
    link_to_collection(bush_proto, col_vasos)

    all_objects = [pot_proto, bush_proto]

    for i in range(1, count):
        y_pos = start_y + i * step_y
        x_offset = -1.5 if (i % 2 == 0) else 1.5

        pot_inst = create_linked_instance(
            source_obj=pot_proto,
            name=f"MOB_VASO_{i+1:02d}",
            location=(x_offset, y_pos, 0.0),
            collection=col_vasos,
        )

        bush_inst = create_linked_instance(
            source_obj=bush_proto,
            name=f"MOB_PLANTA_{i+1:02d}",
            location=(x_offset, y_pos, 0.5 + 0.32),
            collection=col_vasos,
        )

        all_objects.extend([pot_inst, bush_inst])

    log_section_end(f"Vasos e Plantas ({count} conjuntos)")
    return all_objects
