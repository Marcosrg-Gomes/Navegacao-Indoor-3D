"""
stores/interior_builder.py — Decoração e Mobiliário Interno Temático das 22 Lojas Abertas

Mobiliário temático detalhado com primitivas compostas por categoria:
  - Moda & Calçados: manequins anatômicos (5 volumes), araras tubulares com roupas coloridas,
    prateleiras, terminal POS com tela inclinada, provadores completos (nicho + cortina + banco) e pufes.
  - Gastronomia: balcão em mármore, vitrine curva oca com prateleiras, cubas com gelatos esféricos,
    menu boards com moldura e hastes, coifa em inox e bistrôs.
  - Tecnologia: mesas de experiência, smartphones/gadgets em suportes inclinados, parede canaletada e display LED.
  - Joalherias & Perfumaria: vitrines baixas com cúpula oca e veludo interno, prateleiras backlight e espelhos ovais.
  - Esporte: expositores de calçados em cascata com modelos de tênis estilizados.
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import (
    create_box,
    create_cylinder,
    create_sphere_ico,
    create_rounded_box,
    create_arch,
    create_cone,
    create_tube,
    create_glass_case,
)
from utils.helpers import link_to_collection, apply_material_by_name, set_object_rotation
from utils.logging import log_section, log_section_end
from materials import MatNames
from stores.signs import create_3d_text


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
    brand = DERIVED["store_positions"][store_code]["brand"]
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


def _create_mannequin(name_prefix: str, location: tuple, col, objs, is_sport: bool = False):
    """Cria um manequim anatômico composto por 5 volumes estilizados."""
    x, y, z = location

    # 1. Base pedestal metálica
    ped = create_cylinder(
        name=f"{name_prefix}_Pedestal",
        radius=0.18, height=0.05, segments=16,
        location=(x, y, z),
        base_at_zero=True,
    )
    _add(ped, col, MatNames.METAL, objs)

    # 2. Quadril / Pernas (tronco cônico inferior)
    quadril = create_cone(
        name=f"{name_prefix}_Quadril",
        radius_top=0.09, radius_bottom=0.13, height=0.60, segments=12,
        location=(x, y, z + 0.05),
        base_at_zero=True,
    )
    _add(quadril, col, MatNames.PAREDE, objs)

    # 3. Tronco cônico superior (ombros mais largos)
    torso = create_cone(
        name=f"{name_prefix}_Torso",
        radius_top=0.13, radius_bottom=0.09, height=0.70, segments=12,
        location=(x, y, z + 0.65),
        base_at_zero=True,
    )
    _add(torso, col, MatNames.PAREDE, objs)

    # 4. Pescoço
    neck = create_cylinder(
        name=f"{name_prefix}_Pescoco",
        radius=0.04, height=0.12, segments=10,
        location=(x, y, z + 1.35),
        base_at_zero=True,
    )
    _add(neck, col, MatNames.PAREDE, objs)

    # 5. Cabeça esférica / oval
    head = create_sphere_ico(
        name=f"{name_prefix}_Cabeca",
        radius=0.10, subdivisions=2,
        location=(x, y, z + 1.55),
    )
    _add(head, col, MatNames.PAREDE, objs)

    if is_sport:
        # Braço esportivo estilizado
        arm_l = create_cylinder(
            name=f"{name_prefix}_Braco_Esq",
            radius=0.025, height=0.45, segments=8,
            location=(x, y - 0.16, z + 1.05),
            base_at_zero=True,
        )
        set_object_rotation(arm_l, 0.0, 30.0, 0.0, degrees=True)
        _add(arm_l, col, MatNames.PAREDE, objs)


def _create_pos_terminal(name_prefix: str, location: tuple, col, objs):
    """Cria terminal de caixa POS com tela touch inclinada e leitor de cartão."""
    x, y, z = location

    # Base do POS / gaveta metálica
    pos_base = create_rounded_box(
        name=f"{name_prefix}_POS_Base",
        width=0.26, depth=0.22, height=0.06, bevel_radius=0.008,
        location=(x, y, z),
        centered_xy=True, base_at_zero=True,
    )
    _add(pos_base, col, MatNames.METAL, objs)

    # Suporte articulado
    suporte = create_cylinder(
        name=f"{name_prefix}_POS_Suporte",
        radius=0.02, height=0.10, segments=8,
        location=(x, y - 0.02, z + 0.06),
        base_at_zero=True,
    )
    _add(suporte, col, MatNames.METAL, objs)

    # Tela touch inclinada (~35°)
    screen = create_rounded_box(
        name=f"{name_prefix}_POS_Tela",
        width=0.22, depth=0.02, height=0.16, bevel_radius=0.006,
        location=(x, y - 0.02, z + 0.16),
        centered_xy=True, base_at_zero=False,
    )
    set_object_rotation(screen, -35.0, 0.0, 0.0, degrees=True)
    _add(screen, col, MatNames.LED, objs)

    # Leitor de cartão lateral
    pinpad = create_box(
        name=f"{name_prefix}_POS_Pinpad",
        width=0.08, depth=0.12, height=0.03,
        location=(x + 0.14, y, z + 0.02),
        centered_xy=True, base_at_zero=True,
    )
    _add(pinpad, col, MatNames.FACHADA_LOJA, objs)


def decorate_fashion_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half, store_width=4.5) -> list:
    objs = []
    lay = _layout(sign, cx, cy, store_depth, corridor_half)
    rot_z = 90.0 if sign < 0 else -90.0

    # 1. Dois manequins anatômicos (5 volumes cada)
    for i, dy in enumerate((-1.2, 1.2)):
        _create_mannequin(
            f"INT_{store_code}_Manequim_{i+1}",
            (lay["entrance_x"], cy + dy, base_z),
            col, objs, is_sport=False,
        )

    # 2. Arara em tubos metálicos + roupas penduradas coloridas
    arara_y = cy - store_width * 0.25
    arara_half = min(1.1, store_width * 0.18)
    # Pés verticais
    for pi, py_off in enumerate((-arara_half, arara_half)):
        post = create_cylinder(
            name=f"INT_{store_code}_Arara_Poste_{pi+1}",
            radius=0.016, height=1.50, segments=10,
            location=(lay["mid_x"], arara_y + py_off, base_z),
            base_at_zero=True,
        )
        _add(post, col, MatNames.METAL, objs)
    # Barra superior horizontal
    barra = create_cylinder(
        name=f"INT_{store_code}_Arara_Barra",
        radius=0.016, height=2 * arara_half + 0.03, segments=10,
        location=(lay["mid_x"], arara_y, base_z + 1.48),
        base_at_zero=False,
    )
    set_object_rotation(barra, 90.0, 0.0, 0.0, degrees=True)
    _add(barra, col, MatNames.METAL, objs)

    # Roupas penduradas (caixas finas com cores intercaladas)
    clothing_mats = [MatNames.ROUPA_1, MatNames.ROUPA_2, MatNames.ROUPA_3]
    for ci in range(6):
        ry = arara_y + arara_half * (-0.75 + ci * 0.30)
        cabide = create_box(
            name=f"INT_{store_code}_Roupa_{ci+1}",
            width=0.035, depth=min(0.32, arara_half * 0.28), height=0.62,
            location=(lay["mid_x"], ry, base_z + 0.82),
            centered_xy=True, base_at_zero=True,
        )
        _add(cabide, col, clothing_mats[ci % len(clothing_mats)], objs)

    # 3. Prateleiras na parede de fundo
    for si in range(3):
        prat = create_rounded_box(
            name=f"INT_{store_code}_Prateleira_{si+1}",
            width=0.28, depth=store_width * 0.65, height=0.035, bevel_radius=0.005,
            location=(lay["back_x"], cy + 0.2, base_z + 0.9 + si * 0.45),
            centered_xy=True, base_at_zero=True,
        )
        _add(prat, col, MatNames.MADEIRA, objs)

    # 4. Provador completo: nicho + cortina + banco
    prov_y = cy + store_width * 0.32
    div_prov = create_box(
        name=f"INT_{store_code}_Provador_Divisoria",
        width=1.10, depth=0.08, height=2.30,
        location=(lay["back_x"] - sign * 0.55, prov_y, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(div_prov, col, MatNames.MADEIRA, objs)

    cortina = create_box(
        name=f"INT_{store_code}_Provador_Cortina",
        width=0.04, depth=0.85, height=2.15,
        location=(lay["back_x"] - sign * 1.05, prov_y - 0.42, base_z + 0.08),
        centered_xy=True, base_at_zero=True,
    )
    _add(cortina, col, MatNames.ACOLCHOADO, objs)

    banco_prov = create_rounded_box(
        name=f"INT_{store_code}_Provador_Banco",
        width=0.35, depth=0.65, height=0.42, bevel_radius=0.015,
        location=(lay["back_x"] - sign * 0.55, prov_y - 0.42, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(banco_prov, col, MatNames.BANCO_MADEIRA, objs)

    # 5. Balcão de Caixa com POS
    caixa = create_rounded_box(
        name=f"INT_{store_code}_Balcao_Caixa",
        width=1.15, depth=0.62, height=1.02, bevel_radius=0.02,
        location=(lay["mid_x"] + sign * 0.4, cy + 0.15, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(caixa, col, MatNames.BANCO_MADEIRA, objs)

    _create_pos_terminal(
        f"INT_{store_code}_Caixa",
        (lay["mid_x"] + sign * 0.4, cy + 0.15, base_z + 1.02),
        col, objs,
    )

    _brand_logo(store_code, lay["mid_x"] + sign * 0.15, cy + 0.15, base_z + 1.28, col, objs, rot_z)

    # Pufe estofado
    pufe = create_cylinder(
        name=f"INT_{store_code}_Pufe",
        radius=0.42, height=0.42, segments=16,
        location=(lay["entrance_x"] + sign * 1.4, cy, base_z),
        base_at_zero=True,
    )
    _add(pufe, col, MatNames.ACOLCHOADO, objs)
    return objs


def decorate_food_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half, store_width=5.0) -> list:
    objs = []
    lay = _layout(sign, cx, cy, store_depth, corridor_half)
    rot_z = 90.0 if sign < 0 else -90.0

    # 1. Balcão frontal em mármore chanfrado
    balcao = create_rounded_box(
        name=f"INT_{store_code}_Balcao_Marmore",
        width=1.05, depth=store_width * 0.85, height=1.08, bevel_radius=0.02,
        location=(lay["entrance_x"] + sign * 0.35, cy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(balcao, col, MatNames.MARMORE, objs)

    # 2. Terminal POS
    _create_pos_terminal(
        f"INT_{store_code}_Caixa",
        (lay["entrance_x"] + sign * 0.35, cy - store_width * 0.25, base_z + 1.08),
        col, objs,
    )

    # 3. Vitrine curva de sobremesas / doces com arco oco
    vitrine_arco = create_arch(
        name=f"INT_{store_code}_Vitrine_Curva_Vidro",
        inner_radius=0.32, outer_radius=0.38, arch_height=0.38,
        angle_deg=180.0, segments=16, depth=1.60,
        location=(lay["entrance_x"] + sign * 0.35, cy + store_width * 0.18, base_z + 1.08),
    )
    _add(vitrine_arco, col, MatNames.VIDRO, objs)

    # 4. Gelatos / sobremesas em esferas coloridas sobre bandeja
    bandeja = create_box(
        name=f"INT_{store_code}_Bandeja_Gelato",
        width=0.45, depth=1.40, height=0.04,
        location=(lay["entrance_x"] + sign * 0.35, cy + store_width * 0.18, base_z + 1.08),
        centered_xy=True, base_at_zero=True,
    )
    _add(bandeja, col, MatNames.INOX, objs)

    gelato_mats = [MatNames.ROUPA_1, MatNames.ROUPA_2, MatNames.ROUPA_3, MatNames.VASO, MatNames.PLANTA]
    for gi in range(5):
        gy = cy + store_width * 0.18 - 0.52 + gi * 0.26
        gelato = create_sphere_ico(
            name=f"INT_{store_code}_Gelato_Bola_{gi+1}",
            radius=0.07, subdivisions=2,
            location=(lay["entrance_x"] + sign * 0.35, gy, base_z + 1.19),
        )
        _add(gelato, col, gelato_mats[gi % len(gelato_mats)], objs)

    # 5. Menu Boards suspensos com moldura metálica
    for i in range(3):
        my = cy - store_width * 0.28 + i * 0.72
        # Moldura metálica
        moldura = create_rounded_box(
            name=f"INT_{store_code}_MenuMoldura_{i+1}",
            width=0.05, depth=0.62, height=0.42, bevel_radius=0.008,
            location=(lay["mid_x"], my, base_z + 2.45),
            centered_xy=True, base_at_zero=True,
        )
        _add(moldura, col, MatNames.FACHADA_LOJA, objs)

        # Tela emissiva
        menu = create_box(
            name=f"INT_{store_code}_MenuBoard_{i+1}",
            width=0.02, depth=0.56, height=0.36,
            location=(lay["mid_x"] - sign * 0.02, my, base_z + 2.48),
            centered_xy=True, base_at_zero=True,
        )
        _add(menu, col, MatNames.LED, objs)

        # Haste pendente do teto
        haste = create_cylinder(
            name=f"INT_{store_code}_MenuHaste_{i+1}",
            radius=0.008, height=0.45, segments=8,
            location=(lay["mid_x"], my, base_z + 2.87),
            base_at_zero=False,
        )
        _add(haste, col, MatNames.METAL, objs)

    # 6. Coifa em Inox para Burger King / fast-food
    if "BK" in store_code or "BURGER" in store_code or "ME01" in store_code:
        coifa = create_box(
            name=f"INT_{store_code}_Coifa_Inox",
            width=1.40, depth=store_width * 0.70, height=0.25,
            location=(lay["back_x"] - sign * 0.60, cy, base_z + 2.20),
            centered_xy=True, base_at_zero=True,
        )
        _add(coifa, col, MatNames.INOX, objs)

    # 7. Mesa bistrô + banquetas
    bistro_y = cy + min(1.20, store_width / 2.0 - 0.65)
    mesa = create_cylinder(
        name=f"INT_{store_code}_MesaBistro",
        radius=0.32, height=1.05, segments=16,
        location=(lay["back_x"] - sign * 1.1, bistro_y, base_z),
        base_at_zero=True,
    )
    _add(mesa, col, MatNames.METAL, objs)

    for bi, dy in enumerate((-0.42, 0.42)):
        banq = create_cylinder(
            name=f"INT_{store_code}_Banqueta_{bi+1}",
            radius=0.16, height=0.78, segments=12,
            location=(lay["back_x"] - sign * 1.1, bistro_y + dy, base_z),
            base_at_zero=True,
        )
        _add(banq, col, MatNames.BANCO_MADEIRA, objs)

    _brand_logo(store_code, lay["back_x"], cy, base_z + 2.2, col, objs, rot_z)
    return objs


def decorate_tech_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half, store_width=3.8) -> list:
    objs = []
    lay = _layout(sign, cx, cy, store_depth, corridor_half)

    # 1. Mesa de experiência central chanfrada em alumínio
    mesa = create_rounded_box(
        name=f"INT_{store_code}_Mesa_Tech",
        width=1.15, depth=store_width * 0.75, height=0.88, bevel_radius=0.02,
        location=(lay["mid_x"], cy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(mesa, col, MatNames.ALUMINIO, objs)

    # 2. Smartphones / gadgets finos em suportes inclinados
    for i, dy in enumerate((-0.9, -0.3, 0.3, 0.9)):
        # Suporte inclinado
        suporte = create_box(
            name=f"INT_{store_code}_Suporte_{i+1}",
            width=0.08, depth=0.10, height=0.04,
            location=(lay["mid_x"], cy + dy, base_z + 0.88),
            centered_xy=True, base_at_zero=True,
        )
        _add(suporte, col, MatNames.METAL, objs)

        # Smartphone / gadget fino
        phone = create_box(
            name=f"INT_{store_code}_Gadget_{i+1}",
            width=0.08, depth=0.16, height=0.008,
            location=(lay["mid_x"], cy + dy, base_z + 0.92),
            centered_xy=True, base_at_zero=True,
        )
        set_object_rotation(phone, 20.0, 0.0, 0.0, degrees=True)
        _add(phone, col, MatNames.LED, objs)

    # 3. Parede canaletada lateral
    for ki in range(6):
        slat = create_box(
            name=f"INT_{store_code}_Canaletado_{ki+1}",
            width=0.025, depth=store_width * 0.60, height=0.03,
            location=(lay["back_x"] - sign * 0.40, cy, base_z + 0.90 + ki * 0.22),
            centered_xy=True, base_at_zero=True,
        )
        _add(slat, col, MatNames.ALUMINIO, objs)

    # 4. Display Wall LED
    disp = create_rounded_box(
        name=f"INT_{store_code}_Display_Wall",
        width=0.12, depth=store_width * 0.85, height=2.35, bevel_radius=0.015,
        location=(lay["back_x"], cy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(disp, col, MatNames.FACHADA_LOJA, objs)

    led = create_box(
        name=f"INT_{store_code}_Display_LED",
        width=0.03, depth=store_width * 0.80, height=2.15,
        location=(lay["back_x"] - sign * 0.08, cy, base_z + 0.10),
        centered_xy=True, base_at_zero=True,
    )
    _add(led, col, MatNames.LED, objs)

    # 5. Terminal POS
    _create_pos_terminal(
        f"INT_{store_code}_Caixa",
        (lay["mid_x"] + sign * 0.35, cy - store_width * 0.30, base_z + 0.88),
        col, objs,
    )
    return objs


def decorate_jewelry_beauty_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half, store_width=3.5) -> list:
    objs = []
    lay = _layout(sign, cx, cy, store_depth, corridor_half)

    # 1. Vitrine de joalheria: Base opaca de mármore + Cúpula de vidro oca
    base_vitrine = create_rounded_box(
        name=f"INT_{store_code}_Balcao_Base",
        width=0.85, depth=store_width * 0.70, height=0.72, bevel_radius=0.02,
        location=(lay["entrance_x"] + sign * 0.4, cy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _add(base_vitrine, col, MatNames.MARMORE, objs)

    # Cúpula de vidro transparente oca
    for tampo_vidro in create_glass_case(
        name=f"INT_{store_code}_Tampo_Vidro",
        width=0.82, depth=store_width * 0.68, height=0.28,
        location=(lay["entrance_x"] + sign * 0.4, cy, base_z + 0.72),
    ):
        _add(tampo_vidro, col, MatNames.VIDRO, objs)

    # Bandeja de veludo com joias/gemas
    bandeja_veludo = create_box(
        name=f"INT_{store_code}_Bandeja_Veludo",
        width=0.72, depth=store_width * 0.60, height=0.03,
        location=(lay["entrance_x"] + sign * 0.4, cy, base_z + 0.73),
        centered_xy=True, base_at_zero=True,
    )
    _add(bandeja_veludo, col, MatNames.VELUDO, objs)

    for ji in range(4):
        jy = cy - 0.45 + ji * 0.30
        gema = create_sphere_ico(
            name=f"INT_{store_code}_Gema_{ji+1}",
            radius=0.022, subdivisions=1,
            location=(lay["entrance_x"] + sign * 0.4, jy, base_z + 0.77),
        )
        _add(gema, col, MatNames.LED, objs)

    # 2. Prateleiras backlight na parede de fundo
    for i, hz in enumerate((1.15, 1.55, 1.95)):
        prat = create_rounded_box(
            name=f"INT_{store_code}_Prateleira_Backlight_{i+1}",
            width=0.22, depth=store_width * 0.75, height=0.03, bevel_radius=0.005,
            location=(lay["back_x"], cy, base_z + hz),
            centered_xy=True, base_at_zero=True,
        )
        _add(prat, col, MatNames.ALUMINIO, objs)

        glow = create_box(
            name=f"INT_{store_code}_Backlight_{i+1}",
            width=0.02, depth=store_width * 0.72, height=0.28,
            location=(lay["back_x"] - sign * 0.10, cy, base_z + hz - 0.28),
            centered_xy=True, base_at_zero=True,
        )
        _add(glow, col, MatNames.LED, objs)

    # 3. Espelhos ovais achatados com moldura chanfrada
    for i, dy in enumerate((-0.7, 0.7)):
        esp = create_cylinder(
            name=f"INT_{store_code}_Espelho_Oval_{i+1}",
            radius=0.18, height=0.02, segments=24,
            location=(lay["entrance_x"] + sign * 0.05, cy + dy, base_z + 1.05),
            base_at_zero=True,
        )
        set_object_rotation(esp, 90.0, 0.0, 90.0 if sign < 0 else -90.0, degrees=True)
        esp.scale.y = 1.4
        _add(esp, col, MatNames.ESPELHO, objs)

    # 4. Terminal POS
    _create_pos_terminal(
        f"INT_{store_code}_Caixa",
        (lay["entrance_x"] + sign * 0.4, cy - store_width * 0.25, base_z + 1.0),
        col, objs,
    )
    return objs


def decorate_sport_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half, store_width=6.5) -> list:
    objs = decorate_fashion_store(store_code, cx, cy, base_z, col, sign, store_depth, corridor_half, store_width)
    lay = _layout(sign, cx, cy, store_depth, corridor_half)

    # Expositores de calçados em cascata com modelos de tênis estilizados
    for i in range(4):
        # Degrau da cascata
        step = create_rounded_box(
            name=f"INT_{store_code}_Expo_Calcado_{i+1}",
            width=0.55, depth=1.20, height=0.12, bevel_radius=0.01,
            location=(lay["mid_x"], cy + 1.45, base_z + 0.18 + i * 0.22),
            centered_xy=True, base_at_zero=True,
        )
        _add(step, col, MatNames.MADEIRA, objs)

        # Modelo de tênis estilizado (Solado + Cabedal em couro/cor contrastante)
        for si, s_off in enumerate((-0.28, 0.28)):
            solado = create_box(
                name=f"INT_{store_code}_Tenis_Solado_{i+1}_{si+1}",
                width=0.10, depth=0.26, height=0.035,
                location=(lay["mid_x"] + s_off, cy + 1.45, base_z + 0.30 + i * 0.22),
                centered_xy=True, base_at_zero=True,
            )
            _add(solado, col, MatNames.ALUMINIO, objs)

            cabedal = create_box(
                name=f"INT_{store_code}_Tenis_Cabedal_{i+1}_{si+1}",
                width=0.08, depth=0.22, height=0.065,
                location=(lay["mid_x"] + s_off, cy + 1.45, base_z + 0.335 + i * 0.22),
                centered_xy=True, base_at_zero=True,
            )
            _add(cabedal, col, MatNames.COURO, objs)

    return objs


def _decorate(code, cat, cx, cy, z, col, sign, depth, corridor_half, width):
    args = (code, cx, cy, z, col, sign, depth, corridor_half, width)
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
    """Decora o interior de todas as 22 lojas abertas com riqueza de detalhes."""
    log_section("Criando Decoração e Mobiliário Interno das 22 Lojas")

    col_lojas = collections.get("02_LOJAS")
    if not col_lojas:
        raise ValueError("Collection '02_LOJAS' não encontrada.")

    st = CONFIG["stores"]
    mz = CONFIG.get("mezzanine", {})
    corridor_half = CONFIG["corridor"]["width"] / 2.0
    store_positions = DERIVED.get("store_positions", {})
    count_ground = st["count_per_side"]
    count_mz = mz.get("count_per_side", 5)

    all_objects = []

    # 1. Interiores do Térreo
    for side_code, sign in (("E", -1), ("D", 1)):
        for i in range(count_ground):
            code = f"{side_code}{i+1:02d}"
            info = store_positions.get(code, {})
            cx = info.get("center_x", sign * (corridor_half + st["depth"] / 2.0))
            cy = info.get("center_y", DERIVED["store_start_y"] + i * (st["width"] + st["wall_thickness"]) + st["width"] / 2.0)
            depth = info.get("store_depth", st["depth"])
            width = info.get("store_width", st["width"])
            cat = info.get("category", STORE_CATEGORIES.get(code, "MODA"))

            store_col = bpy.data.collections.get(f"LOJA_{code}") or col_lojas
            all_objects.extend(_decorate(
                code, cat, cx, cy, 0.0, store_col, sign, depth, corridor_half, width,
            ))

    # 2. Interiores do Mezanino
    mz_floor_z = mz.get("floor_z", 4.7)
    for side_code, sign in (("E", -1), ("D", 1)):
        for i in range(count_mz):
            code = f"M{side_code}{i+1:02d}"
            info = store_positions.get(code, {})
            cx = info.get("center_x", sign * (corridor_half + st["depth"] / 2.0))
            cy = info.get("center_y", DERIVED["store_start_y"] + i * (st["width"] + st["wall_thickness"]) + st["width"] / 2.0)
            depth = info.get("store_depth", st["depth"])
            width = info.get("store_width", st["width"])
            cat = info.get("category", STORE_CATEGORIES.get(code, "MODA"))

            store_col = bpy.data.collections.get(f"LOJA_{code}") or col_lojas
            all_objects.extend(_decorate(
                code, cat, cx, cy, mz_floor_z, store_col, sign, depth, corridor_half, width,
            ))

    log_section_end(f"Mobiliário Interno das Lojas ({len(all_objects)} objetos temáticos)")
    return all_objects
