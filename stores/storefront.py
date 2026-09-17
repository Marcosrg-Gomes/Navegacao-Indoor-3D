"""
stores/storefront.py — Vitrine de lojas abertas (Open Storefronts) com perfil arquitetônico real

Cria:
  - Pórtico em U verdadeiro (perfil em L/T composto, com cantos e acabamentos nobres)
  - Caixilhos finos de alumínio (40–50 mm) com peitoril e vidro fino realista (12 mm)
  - Caixa de cortina rolo como tubo cilíndrico + caixa chanfrada
  - Soleira de transição em mármore chanfrada
  - Fachadas diferenciadas por segmento de loja (Moda, Food, Joias, Tech)
"""

import bpy
from math import radians
from config import CONFIG
from utils.geometry import create_box, create_cylinder, create_rounded_box
from utils.helpers import link_to_collection, apply_material_by_name
from materials import MatNames


PORTICO_FINISHES = {
    "MODA": MatNames.MADEIRA,
    "ESPORTE": MatNames.ALUMINIO,
    "BELEZA": MatNames.MARMORE,
    "JOIAS": MatNames.MARMORE,
    "TECH": MatNames.ALUMINIO,
    "GASTRONOMIA": MatNames.MADEIRA,
}


PORTICO_THICKNESS = 0.08
GLASS_FRAME_WIDTH = 0.045


def _portico_material(category: str) -> str:
    """Seleciona acabamento de acordo com a categoria da loja."""
    return PORTICO_FINISHES.get(category, MatNames.MADEIRA)


def _storefront_dimensions(store_width: float, category: str) -> dict:
    """Compartilha o vão livre entre vidro, cortina de rolo e soleira."""
    glazing_width = store_width - 2 * PORTICO_THICKNESS
    wing_ratio = {"GASTRONOMIA": 0.08, "JOIAS": 0.38, "BELEZA": 0.38}.get(category, 0.22)
    wing_width = min(glazing_width * wing_ratio,
                     (glazing_width - CONFIG["stores"]["door_width"]) / 2.0)
    if wing_width <= 2 * GLASS_FRAME_WIDTH:
        raise ValueError("Fachada estreita demais para o vão de entrada e os caixilhos.")
    return {
        "glazing_width": glazing_width,
        "wing_width": wing_width,
        "opening_width": glazing_width - 2 * wing_width,
    }


def create_storefront_glass(
    store_name: str,
    center_x: float,
    center_y: float,
    store_width: float,
    collection: bpy.types.Collection,
    base_z: float = 0.0,
    category: str = "MODA",
) -> list:
    """
    Painéis de vidro laterais da fachada com caixilhos finos de alumínio (40–50 mm)
    e peitoril inferior, configurados por segmento.
    """
    st = CONFIG["stores"]
    glass_thickness = 0.012  # Vidro laminado realista fino (12 mm)
    glass_height = st["storefront_height"]
    frame_w = GLASS_FRAME_WIDTH
    dimensions = _storefront_dimensions(store_width, category)
    vitrine_width = dimensions["glazing_width"]
    wing_glass_w = dimensions["wing_width"]
    offset_y = (vitrine_width / 2.0) - (wing_glass_w / 2.0)

    objects = []

    for side, side_offset in (("Esq", -offset_y), ("Dir", +offset_y)):
        py = center_y + side_offset

        # 1. Vidro fino
        glass = create_box(
            name=f"LOJA_{store_name}_Vitrine_{side}",
            width=glass_thickness,
            depth=wing_glass_w - 2 * frame_w,
            height=glass_height - 0.08,
            location=(center_x, py, base_z + 0.04),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(glass, collection)
        apply_material_by_name(glass, MatNames.VIDRO)
        objects.append(glass)

        # 2. Caixilho inferior (peitoril metálico/alumínio)
        peitoril = create_box(
            name=f"LOJA_{store_name}_Peitoril_{side}",
            width=0.06,
            depth=wing_glass_w,
            height=0.04,
            location=(center_x, py, base_z),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(peitoril, collection)
        apply_material_by_name(peitoril, MatNames.ALUMINIO)
        objects.append(peitoril)

        # 3. Travessa superior e montantes cobrindo as quatro bordas do vidro.
        top_frame = create_box(
            name=f"LOJA_{store_name}_CaixilhoTopo_{side}",
            width=0.06, depth=wing_glass_w, height=0.04,
            location=(center_x, py, base_z + glass_height - 0.04),
            centered_xy=True, base_at_zero=True,
        )
        link_to_collection(top_frame, collection)
        apply_material_by_name(top_frame, MatNames.ALUMINIO)
        objects.append(top_frame)
        for label, direction in (("Externo", -1 if side == "Esq" else 1),
                                 ("Interno", 1 if side == "Esq" else -1)):
            mullion = create_box(
                name=f"LOJA_{store_name}_Montante_{side}_{label}",
                width=0.05,
                depth=frame_w,
                height=glass_height,
                location=(center_x, py + (wing_glass_w / 2.0 - frame_w / 2.0) * direction, base_z),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(mullion, collection)
            apply_material_by_name(mullion, MatNames.ALUMINIO)
            objects.append(mullion)

    return objects


def create_storefront_frame(
    store_name: str,
    center_x: float,
    center_y: float,
    store_width: float,
    collection: bpy.types.Collection,
    base_z: float = 0.0,
    category: str = "MODA",
    recuo: float = 0.0,
) -> list:
    """
    Pórtico em U verdadeiro com perfil refinado, cortina rolo tubular e soleira chanfrada.
    """
    st = CONFIG["stores"]
    h = st["storefront_height"]
    frame_t = PORTICO_THICKNESS
    frame_depth = 0.16
    toward_corridor = 0.06 if center_x < 0 else -0.06
    fx = center_x + toward_corridor
    finish = _portico_material(category)
    open_span = _storefront_dimensions(store_width, category)["opening_width"]

    objects = []

    # 1. Verga superior do pórtico (chanfrada)
    verga = create_rounded_box(
        name=f"LOJA_{store_name}_Portico_Topo",
        width=frame_depth,
        depth=store_width,
        height=frame_t,
        bevel_radius=0.015,
        location=(fx, center_y, base_z + h - frame_t),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(verga, collection)
    apply_material_by_name(verga, finish)
    objects.append(verga)

    # 2. Montantes laterais verticais
    for side, y_offset in (
        ("L", -(store_width / 2.0 - frame_t / 2.0)),
        ("R", +(store_width / 2.0 - frame_t / 2.0)),
    ):
        mont = create_rounded_box(
            name=f"LOJA_{store_name}_Portico_{side}",
            width=frame_depth,
            depth=frame_t,
            height=h,
            bevel_radius=0.015,
            location=(fx, center_y + y_offset, base_z),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(mont, collection)
        apply_material_by_name(mont, finish)
        objects.append(mont)

    # 3. Cortina de rolo: Tubo cilíndrico + Caixa chanfrada
    caixa_rolo = create_rounded_box(
        name=f"LOJA_{store_name}_CaixaRolo",
        width=0.18,
        depth=open_span,
        height=0.12,
        bevel_radius=0.015,
        location=(fx, center_y, base_z + h - 0.02),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(caixa_rolo, collection)
    apply_material_by_name(caixa_rolo, MatNames.ALUMINIO)
    objects.append(caixa_rolo)

    tubo_rolo = create_cylinder(
        name=f"LOJA_{store_name}_TuboRolo",
        radius=0.035,
        height=open_span * 0.96,
        segments=12,
        location=(fx, center_y, base_z + h - 0.06),
        base_at_zero=False,
    )
    tubo_rolo.rotation_euler.x = radians(90.0)
    link_to_collection(tubo_rolo, collection)
    apply_material_by_name(tubo_rolo, MatNames.METAL)
    objects.append(tubo_rolo)

    # 4. Soleira de transição em mármore chanfrada
    soleira = create_rounded_box(
        name=f"LOJA_{store_name}_Soleira",
        width=0.38,
        depth=open_span,
        height=0.018,
        bevel_radius=0.005,
        location=(center_x, center_y, base_z + 0.002),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(soleira, collection)
    apply_material_by_name(soleira, MatNames.MARMORE)
    objects.append(soleira)

    # 5. Piso do nicho de recuo (se recuo > 0)
    if recuo > 0.01:
        sign = -1 if center_x < 0 else 1
        nicho_piso = create_box(
            name=f"LOJA_{store_name}_NichoPiso",
            width=recuo,
            depth=store_width,
            height=0.012,
            location=(center_x - sign * recuo / 2.0, center_y, base_z + 0.001),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(nicho_piso, collection)
        apply_material_by_name(nicho_piso, MatNames.MARMORE)
        objects.append(nicho_piso)

    return objects
