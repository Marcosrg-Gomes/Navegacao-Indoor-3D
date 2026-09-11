"""
stores/interior_builder.py — Decoração e Mobiliário Interno Temático das 22 Lojas Abertas

Mobiliário temático procedural por categoria:
  - Moda & Calçados: manequins, araras, prateleiras, caixa POS, provadores e pufes.
  - Gastronomia: balcão em mármore, vitrine curva, menu boards e bistrôs.
  - Tecnologia: mesas de experiência, gadgets e display wall LED.
  - Joalherias & Perfumaria: vitrines baixas, prateleiras backlight e espelhos ovais.
  - Esporte: expositores de calçados em cascata.
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_cylinder
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_section, log_section_end
from materials import MatNames
from stores.signs import create_3d_text, STORE_BRANDS_MAP


STORE_CATEGORIES = {
    "E01": "ESPORTE",
    "E02": "MODA",
    "E03": "MODA",
    "E04": "BELEZA",
    "E05": "ESPORTE",
    "E06": "JOIAS",
    "D01": "MODA",
    "D02": "MODA",
    "D03": "BELEZA",
    "D04": "JOIAS",
    "D05": "TECH",
    "D06": "MODA",
    "ME01": "GASTRONOMIA",
    "ME02": "GASTRONOMIA",
    "ME03": "GASTRONOMIA",
    "ME04": "ESPORTE",
    "ME05": "MODA",
    "MD01": "GASTRONOMIA",
    "MD02": "GASTRONOMIA",
    "MD03": "MODA",
    "MD04": "MODA",
    "MD05": "MODA",
}


def _add(obj, col, mat, objs):
    link_to_collection(obj, col)
    apply_material_by_name(obj, mat)
    objs.append(obj)
    return obj


def _layout(sign: int, cx: float, cy: float, store_depth: float, corridor_half: float) -> dict:
    inner_x = sign * corridor_half
    into = sign
    return {
        "entrance_x": inner_x + into * 1.15,
        "mid_x": cx,
        "back_x": inner_x + into * (store_depth - 0.55),
        "into": into,
    }


def _brand_logo(store_code: str, x: float, y: float, z: float, col, objs, rot_z: float):
    brand = STORE_BRANDS_MAP.get(store_code, {}).get("name", store_code)
    txt = create_3d_text(
        name=f"INT_{store_code}_Logo",
        text=brand,
        location=(x, y, z),
        rotation_deg=(90.0, 0.0, rot_z),
        size=0.12,
        extrude=0.02,
        collection=col,
    )
    apply_material_by_name(txt, MatNames.LETREIRO)
    objs.append(txt)


def decorate_fashion_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half) -> list:
    objs = []
    lay = _layout(sign, cx, cy, store_depth, corridor_half)
    rot_z = 90.0 if sign < 0 else -90.0

    for i, dy in enumerate((-1.35, 1.35)):
        ped = create_cylinder(
            name=f"INT_{store_code}_Manequim_Ped_{i+1}",
            radius=0.22, height=0.12, segments=16,
            location=(lay["entrance_x"], cy + dy, base_z),
            base_at_zero=True,
        )
        _add(ped, col, MatNames.METAL, objs)
        torso = create_cylinder(
            name=f"INT_{store_code}_Manequim_Torso_{i+1}",
            radius=0.13, height=0.95, segments=12,
            location=(lay["entrance_x"], cy + dy, base_z + 0.55),
            base_at_zero=True,
        )
        _add(torso, col, MatNames.PAREDE, objs)
        cabeca = create_cylinder(
            name=f"INT_{store_code}_Manequim_Cabeca_{i+1}",
            radius=0.09, height=0.22, segments=12,
            location=(lay["entrance_x"], cy + dy, base_z + 1.52),
            base_at_zero=True,
        )
        _add(cabeca, col, MatNames.PAREDE, objs)

    arara = create_box(
        name=f"INT_{store_code}_Arara",
        width=0.38, depth=2.6, height=1.55,
        location=(lay["mid_x"], cy - 1.55, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(arara, col, MatNames.METAL, objs)

    prat = create_box(
        name=f"INT_{store_code}_Prateleira",
        width=0.28, depth=2.4, height=0.04,
        location=(lay["back_x"], cy + 0.4, base_z + 1.35),
        centered_xy=True, base_at_zero=True,
    )
    _add(prat, col, MatNames.MADEIRA, objs)

    painel = create_box(
        name=f"INT_{store_code}_Painel_Provador",
        width=0.12, depth=2.8, height=2.4,
        location=(lay["back_x"], cy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(painel, col, MatNames.MADEIRA, objs)

    caixa = create_box(
        name=f"INT_{store_code}_Balcao_Caixa",
        width=1.15, depth=0.62, height=1.02,
        location=(lay["mid_x"] + sign * 0.4, cy + 0.15, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(caixa, col, MatNames.BANCO_MADEIRA, objs)

    pos = create_box(
        name=f"INT_{store_code}_POS",
        width=0.28, depth=0.22, height=0.18,
        location=(lay["mid_x"] + sign * 0.4, cy + 0.15, base_z + 1.02),
        centered_xy=True, base_at_zero=True,
    )
    _add(pos, col, MatNames.METAL, objs)

    _brand_logo(store_code, lay["mid_x"] + sign * 0.15, cy + 0.15, base_z + 1.28, col, objs, rot_z)

    pufe = create_cylinder(
        name=f"INT_{store_code}_Pufe",
        radius=0.42, height=0.42, segments=16,
        location=(lay["entrance_x"] + sign * 1.4, cy, base_z),
        base_at_zero=True,
    )
    _add(pufe, col, MatNames.ACOLCHOADO, objs)
    return objs


def decorate_food_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half) -> list:
    objs = []
    lay = _layout(sign, cx, cy, store_depth, corridor_half)
    rot_z = 90.0 if sign < 0 else -90.0

    balcao = create_box(
        name=f"INT_{store_code}_Balcao_Marmore",
        width=1.05, depth=3.2, height=1.08,
        location=(lay["entrance_x"] + sign * 0.35, cy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(balcao, col, MatNames.MARMORE, objs)

    pos = create_box(
        name=f"INT_{store_code}_Caixa",
        width=0.30, depth=0.22, height=0.16,
        location=(lay["entrance_x"] + sign * 0.35, cy - 1.1, base_z + 1.08),
        centered_xy=True, base_at_zero=True,
    )
    _add(pos, col, MatNames.METAL, objs)

    vitrine = create_box(
        name=f"INT_{store_code}_Vitrine_Doces",
        width=0.72, depth=1.8, height=1.05,
        location=(lay["entrance_x"] + sign * 0.35, cy + 0.85, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(vitrine, col, MatNames.VIDRO, objs)

    curva = create_cylinder(
        name=f"INT_{store_code}_Vitrine_Curva",
        radius=0.38, height=1.05, segments=20,
        location=(lay["entrance_x"] + sign * 0.35, cy + 1.75, base_z),
        base_at_zero=True,
    )
    _add(curva, col, MatNames.VIDRO, objs)

    for i in range(3):
        my = cy - 1.05 + i * 0.85
        menu = create_box(
            name=f"INT_{store_code}_MenuBoard_{i+1}",
            width=0.04, depth=0.62, height=0.38,
            location=(lay["mid_x"], my, base_z + 2.45),
            centered_xy=True, base_at_zero=True,
        )
        _add(menu, col, MatNames.LED, objs)

    mesa = create_cylinder(
        name=f"INT_{store_code}_MesaBistro",
        radius=0.32, height=1.05, segments=16,
        location=(lay["back_x"] - sign * 1.1, cy + 1.35, base_z),
        base_at_zero=True,
    )
    _add(mesa, col, MatNames.METAL, objs)

    for bi, dy in enumerate((-0.42, 0.42)):
        banq = create_cylinder(
            name=f"INT_{store_code}_Banqueta_{bi+1}",
            radius=0.16, height=0.78, segments=12,
            location=(lay["back_x"] - sign * 1.1, cy + 1.35 + dy, base_z),
            base_at_zero=True,
        )
        _add(banq, col, MatNames.BANCO_MADEIRA, objs)

    _brand_logo(store_code, lay["back_x"], cy, base_z + 2.2, col, objs, rot_z)
    return objs


def decorate_tech_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half) -> list:
    objs = []
    lay = _layout(sign, cx, cy, store_depth, corridor_half)

    mesa = create_box(
        name=f"INT_{store_code}_Mesa_Tech",
        width=1.15, depth=2.7, height=0.88,
        location=(lay["mid_x"], cy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(mesa, col, MatNames.ALUMINIO, objs)

    for i, dy in enumerate((-0.9, -0.3, 0.3, 0.9)):
        phone = create_box(
            name=f"INT_{store_code}_Gadget_{i+1}",
            width=0.08, depth=0.16, height=0.02,
            location=(lay["mid_x"], cy + dy, base_z + 0.88),
            centered_xy=True, base_at_zero=True,
        )
        _add(phone, col, MatNames.METAL, objs)

    disp = create_box(
        name=f"INT_{store_code}_Display_Wall",
        width=0.12, depth=3.4, height=2.35,
        location=(lay["back_x"], cy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(disp, col, MatNames.FACHADA_LOJA, objs)

    led = create_box(
        name=f"INT_{store_code}_Display_LED",
        width=0.03, depth=3.2, height=2.15,
        location=(lay["back_x"] - sign * 0.08, cy, base_z + 0.12),
        centered_xy=True, base_at_zero=True,
    )
    _add(led, col, MatNames.LED, objs)
    return objs


def decorate_jewelry_beauty_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half) -> list:
    objs = []
    lay = _layout(sign, cx, cy, store_depth, corridor_half)

    vitrine = create_box(
        name=f"INT_{store_code}_Balcao_Joias",
        width=0.85, depth=2.55, height=0.92,
        location=(lay["entrance_x"] + sign * 0.4, cy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(vitrine, col, MatNames.VIDRO, objs)

    metal = create_box(
        name=f"INT_{store_code}_Balcao_Base",
        width=0.90, depth=2.60, height=0.18,
        location=(lay["entrance_x"] + sign * 0.4, cy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(metal, col, MatNames.METAL, objs)

    for i, hz in enumerate((1.15, 1.55, 1.95)):
        prat = create_box(
            name=f"INT_{store_code}_Prateleira_Backlight_{i+1}",
            width=0.22, depth=2.6, height=0.03,
            location=(lay["back_x"], cy, base_z + hz),
            centered_xy=True, base_at_zero=True,
        )
        _add(prat, col, MatNames.ALUMINIO, objs)
        glow = create_box(
            name=f"INT_{store_code}_Backlight_{i+1}",
            width=0.02, depth=2.5, height=0.28,
            location=(lay["back_x"] - sign * 0.10, cy, base_z + hz - 0.28),
            centered_xy=True, base_at_zero=True,
        )
        _add(glow, col, MatNames.LED, objs)

    for i, dy in enumerate((-0.7, 0.7)):
        esp = create_cylinder(
            name=f"INT_{store_code}_Espelho_Oval_{i+1}",
            radius=0.14, height=0.03, segments=20,
            location=(lay["entrance_x"] + sign * 0.05, cy + dy, base_z + 1.05),
            base_at_zero=True,
        )
        _add(esp, col, MatNames.VIDRO, objs)
    return objs


def decorate_sport_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half) -> list:
    objs = decorate_fashion_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half)
    lay = _layout(sign, cx, cy, store_depth, corridor_half)
    for i in range(4):
        step = create_box(
            name=f"INT_{store_code}_Expo_Calcado_{i+1}",
            width=0.55, depth=1.1, height=0.12,
            location=(lay["mid_x"], cy + 1.45, base_z + 0.18 + i * 0.22),
            centered_xy=True, base_at_zero=True,
        )
        _add(step, col, MatNames.MADEIRA, objs)
    return objs


def _decorate(code, cat, cx, cy, z, col, sign, depth, corridor_half):
    args = (code, cx, cy, z, col, sign, depth, corridor_half)
    if cat == "GASTRONOMIA":
        return decorate_food_store(*args)
    if cat == "TECH":
        return decorate_tech_store(*args)
    if cat in ("JOIAS", "BELEZA"):
        return decorate_jewelry_beauty_store(*args)
    if cat == "ESPORTE":
        return decorate_sport_store(*args)
    return decorate_fashion_store(*args)


def build_store_interiors(collections: dict) -> list:
    """Decora o interior de todas as 22 lojas abertas."""
    log_section("Criando Decoração e Mobiliário Interno das 22 Lojas")

    col_lojas = collections.get("02_LOJAS")
    if not col_lojas:
        raise ValueError("Collection '02_LOJAS' não encontrada.")

    st = CONFIG["stores"]
    mz = CONFIG.get("mezzanine", {})
    corridor_half = CONFIG["corridor"]["width"] / 2.0
    store_depth = st["depth"]
    store_width = st["width"]
    div_t = st["wall_thickness"]
    start_y = DERIVED["store_start_y"]
    count_ground = st["count_per_side"]
    count_mz = mz.get("count_per_side", 5)

    all_objects = []

    for side_code, sign in (("E", -1), ("D", 1)):
        cx = sign * (corridor_half + store_depth / 2.0)
        for i in range(count_ground):
            code = f"{side_code}{i+1:02d}"
            cy = start_y + i * (store_width + div_t) + store_width / 2.0
            store_col = bpy.data.collections.get(f"LOJA_{code}") or col_lojas
            all_objects.extend(_decorate(
                code, STORE_CATEGORIES.get(code, "MODA"),
                cx, cy, 0.0, store_col, sign, store_depth, corridor_half,
            ))

    mz_floor_z = mz.get("floor_z", 4.7)
    for side_code, sign in (("E", -1), ("D", 1)):
        cx = sign * (corridor_half + store_depth / 2.0)
        for i in range(count_mz):
            code = f"M{side_code}{i+1:02d}"
            cy = start_y + i * (store_width + div_t) + store_width / 2.0
            store_col = bpy.data.collections.get(f"LOJA_{code}") or col_lojas
            all_objects.extend(_decorate(
                code, STORE_CATEGORIES.get(code, "MODA"),
                cx, cy, mz_floor_z, store_col, sign, store_depth, corridor_half,
            ))

    log_section_end(f"Mobiliário Interno das Lojas ({len(all_objects)} objetos temáticos)")
    return all_objects
