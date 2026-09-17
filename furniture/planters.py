"""
furniture/planters.py — Vasos trapezoidais e jardineiras com vegetação composta

Gera:
  - Vasos trapezoidais no piso térreo (boca expandida) com folhagens em cachos múltiplos
  - Jardineiras suspensas com plantas pendentes contornando as bordas do mezanino
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_cylinder, create_sphere_ico, create_box, create_trapezoid_box
from utils.helpers import link_to_collection, apply_material_by_name, create_linked_instance
from utils.logging import log_object_created, log_section, log_section_end
from materials import MatNames


def create_planter_prototype() -> tuple:
    """Cria um vaso trapezoidal escultural e sua folhagem em múltiplos cachos como protótipo."""
    f_cfg = CONFIG["furniture"]
    p_radius = f_cfg.get("planter_radius", 0.35)
    p_height = f_cfg.get("planter_height", 0.55)

    # 1. Vaso trapezoidal (boca mais larga: 0.75m, base: 0.48m)
    pot = create_trapezoid_box(
        name="PROTO_VASO_Base",
        top_width=p_radius * 2.2,
        top_depth=p_radius * 2.2,
        bottom_width=p_radius * 1.4,
        bottom_depth=p_radius * 1.4,
        height=p_height,
        location=(0.0, 0.0, 0.0),
        base_at_zero=True,
    )
    apply_material_by_name(pot, MatNames.VASO)

    # 2. Terra / substrato escuro
    soil = create_box(
        name="PROTO_VASO_Terra",
        width=p_radius * 2.0,
        depth=p_radius * 2.0,
        height=0.04,
        location=(0.0, 0.0, p_height - 0.03),
        centered_xy=True,
        base_at_zero=True,
    )
    apply_material_by_name(soil, MatNames.VASO)

    # 3. Folhagem composta: Cacho principal central + 2 cachos laterais
    bush_main = create_sphere_ico(
        name="PROTO_PLANTA_Cacho_Principal",
        radius=p_radius * 1.25,
        subdivisions=2,
        location=(0.0, 0.0, p_height + 0.32),
    )
    apply_material_by_name(bush_main, MatNames.PLANTA)

    bush_side1 = create_sphere_ico(
        name="PROTO_PLANTA_Cacho_Esq",
        radius=p_radius * 0.85,
        subdivisions=2,
        location=(-0.16, -0.08, p_height + 0.18),
    )
    apply_material_by_name(bush_side1, MatNames.PLANTA)

    bush_side2 = create_sphere_ico(
        name="PROTO_PLANTA_Cacho_Dir",
        radius=p_radius * 0.80,
        subdivisions=2,
        location=(0.14, 0.10, p_height + 0.22),
    )
    apply_material_by_name(bush_side2, MatNames.PLANTA)

    return pot, soil, bush_main, bush_side1, bush_side2


def create_hanging_planters(collection: bpy.types.Collection) -> list:
    """Cria jardineiras suspensas nas bordas do vão central do mezanino."""
    mz = CONFIG.get("mezzanine", {})
    mz_slab_z = mz.get("height", 4.2)
    atrium_w = mz.get("atrium_opening", 5.0)
    half_aw = atrium_w / 2.0

    objects = []
    planter_w = 0.38
    planter_len = 3.0
    planter_h = 0.25

    y_positions = [-10.0, 0.0, 10.0]

    for side_code, sign in [("Esq", -1), ("Dir", 1)]:
        px = sign * (half_aw + planter_w / 2.0)
        for i, py in enumerate(y_positions):
            # Caixa da floreira trapezoidal
            box_name = f"MOB_Jardineira_Susp_{side_code}_{i+1:02d}"
            box = create_trapezoid_box(
                name=box_name,
                top_width=planter_w * 1.1,
                top_depth=planter_len,
                bottom_width=planter_w * 0.85,
                bottom_depth=planter_len * 0.95,
                height=planter_h,
                location=(px, py, mz_slab_z + 0.1),
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
                    name=f"MOB_Planta_Cipo_{side_code}_{i+1:02d}_{k+1}",
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

    pot_proto, soil_proto, b1_proto, b2_proto, b3_proto = create_planter_prototype()

    pot_proto.name = "MOB_VASO_01"
    pot_proto.location = (0.0, start_y, 0.0)
    link_to_collection(pot_proto, col_vasos)

    soil_proto.name = "MOB_TERRA_01"
    soil_proto.location = (0.0, start_y, 0.55 - 0.03)
    link_to_collection(soil_proto, col_vasos)

    b1_proto.name = "MOB_PLANTA_01_C1"
    b1_proto.location = (0.0, start_y, 0.55 + 0.32)
    link_to_collection(b1_proto, col_vasos)

    b2_proto.name = "MOB_PLANTA_01_C2"
    b2_proto.location = (-0.16, start_y - 0.08, 0.55 + 0.18)
    link_to_collection(b2_proto, col_vasos)

    b3_proto.name = "MOB_PLANTA_01_C3"
    b3_proto.location = (0.14, start_y + 0.10, 0.55 + 0.22)
    link_to_collection(b3_proto, col_vasos)

    all_objects = [pot_proto, soil_proto, b1_proto, b2_proto, b3_proto]

    for i in range(1, count):
        y_pos = start_y + i * step_y
        x_offset = -1.5 if (i % 2 == 0) else 1.5

        pot_inst = create_linked_instance(
            source_obj=pot_proto,
            name=f"MOB_VASO_{i+1:02d}",
            location=(x_offset, y_pos, 0.0),
            collection=col_vasos,
        )

        b1_inst = create_linked_instance(
            source_obj=b1_proto,
            name=f"MOB_PLANTA_{i+1:02d}_C1",
            location=(x_offset, y_pos, 0.55 + 0.32),
            collection=col_vasos,
        )

        b2_inst = create_linked_instance(
            source_obj=b2_proto,
            name=f"MOB_PLANTA_{i+1:02d}_C2",
            location=(x_offset - 0.16, y_pos - 0.08, 0.55 + 0.18),
            collection=col_vasos,
        )

        b3_inst = create_linked_instance(
            source_obj=b3_proto,
            name=f"MOB_PLANTA_{i+1:02d}_C3",
            location=(x_offset + 0.14, y_pos + 0.10, 0.55 + 0.22),
            collection=col_vasos,
        )

        all_objects.extend([pot_inst, b1_inst, b2_inst, b3_inst])

    # Jardineiras suspensas no mezanino
    hanging_objs = create_hanging_planters(col_vasos)
    all_objects.extend(hanging_objs)

    log_section_end(f"Paisagismo ({len(all_objects)} elementos)")
    return all_objects
