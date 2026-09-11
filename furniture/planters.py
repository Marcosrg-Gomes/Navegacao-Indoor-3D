"""
furniture/planters.py — Vasos de plantas e jardineiras suspensas do mezanino

Gera:
  - Vasos esculturais no piso térreo com folhagens
  - Jardineiras suspensas com plantas pendentes contornando as bordas do mezanino
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_cylinder, create_sphere_ico, create_box
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


def create_hanging_planters(collection: bpy.types.Collection) -> list:
    """Cria jardineiras suspensas nas bordas do vão central do mezanino."""
    mz = CONFIG.get("mezzanine", {})
    mz_slab_z = mz.get("height", 4.2)
    atrium_w = mz.get("atrium_opening", 5.0)
    half_aw = atrium_w / 2.0

    objects = []
    planter_w = 0.35
    planter_len = 3.0
    planter_h = 0.25

    y_positions = [-10.0, 0.0, 10.0]

    for side_code, sign in [("Esq", -1), ("Dir", 1)]:
        px = sign * (half_aw + planter_w / 2.0)
        for i, py in enumerate(y_positions):
            # Caixa da floreira
            box_name = f"MOB_Jardineira_Susp_{side_code}_{i+1:02d}"
            box = create_box(
                name=box_name,
                width=planter_w,
                depth=planter_len,
                height=planter_h,
                location=(px, py, mz_slab_z + 0.1),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(box, collection)
            apply_material_by_name(box, MatNames.VASO)
            objects.append(box)

            foliage = create_box(
                name=f"MOB_Planta_Pendente_{side_code}_{i+1:02d}",
                width=planter_w * 1.15,
                depth=planter_len * 0.92,
                height=0.28,
                location=(px, py, mz_slab_z + 0.18),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(foliage, collection)
            apply_material_by_name(foliage, MatNames.PLANTA)
            objects.append(foliage)

            # Jiboias / samambaias caindo em direção ao átrio
            for k in range(5):
                drop_y = py - planter_len / 2.0 + 0.35 + k * 0.55
                trail = create_sphere_ico(
                    name=f"MOB_Planta_Cacho_{side_code}_{i+1:02d}_{k+1}",
                    radius=0.16,
                    subdivisions=1,
                    location=(px - sign * 0.22, drop_y, mz_slab_z - 0.18 - (k % 2) * 0.12),
                )
                link_to_collection(trail, collection)
                apply_material_by_name(trail, MatNames.PLANTA)
                objects.append(trail)

                vine = create_cylinder(
                    name=f"MOB_Planta_Cipó_{side_code}_{i+1:02d}_{k+1}",
                    radius=0.035,
                    height=0.55,
                    segments=8,
                    location=(px - sign * 0.18, drop_y, mz_slab_z - 0.45),
                    base_at_zero=True,
                )
                link_to_collection(vine, collection)
                apply_material_by_name(vine, MatNames.PLANTA)
                objects.append(vine)

    return objects


def build_planters(collections: dict) -> list:
    """Distribui vasos de plantas e jardineiras suspensas pelo shopping."""
    log_section("Criando Vasos de Plantas e Jardineiras Suspensas")

    col_vasos = collections.get("VASOS") or collections.get("PLANTAS") or list(collections.values())[0]

    f_cfg = CONFIG["furniture"]
    count = f_cfg.get("planter_count", 6)
    half_l = DERIVED["half_length"]

    start_y = -half_l + 12.0
    end_y = half_l - 14.0
    step_y = (end_y - start_y) / max(count - 1, 1)

    pot_proto, bush_proto = create_planter_prototype()

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

    # Jardineiras suspensas no mezanino
    hanging_objs = create_hanging_planters(col_vasos)
    all_objects.extend(hanging_objs)

    log_section_end(f"Paisagismo ({len(all_objects)} elementos)")
    return all_objects
