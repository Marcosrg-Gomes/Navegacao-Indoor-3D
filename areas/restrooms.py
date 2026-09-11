"""
areas/restrooms.py — Sanitários do shopping (4 Banheiros nos 2 Pavimentos)

Gera:
  - Térreo (Z=0.0m):
      1. Sanitário Masculino Térreo (bancada quartzo, cubas, espelho LED,
         3 mictórios com divisórias de vidro escurecido, 2 cabines)
      2. Sanitário Feminino Térreo (bancada dupla de sobrepor, camarim com
         espelhos circulares, 3 cabines)
  - Mezanino (Z=4.7m):
      3. Sanitário Masculino PCD (acesso amplo, barras ABNT NBR 9050)
      4. Sanitário Feminino Família (fraldário, pia infantil, poltrona)
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_cylinder, create_wall_with_opening
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_section, log_section_end
from materials import MatNames
from stores.signs import create_3d_text


def _link(obj, collection, mat, objects):
    link_to_collection(obj, collection)
    apply_material_by_name(obj, mat)
    objects.append(obj)
    return obj


def _room_shell(prefix, ox, oy, w, d, h, base_z, door_off_y, door_w, collection, objects):
    """Paredes, piso e abertura de porta de um bloco sanitário."""
    wt = 0.12
    front_y = oy - d / 2.0
    back_y = oy + d / 2.0

    floor = create_box(
        name=f"{prefix}_Piso",
        width=w, depth=d, height=0.04,
        location=(ox, oy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _link(floor, collection, MatNames.PISO_MEZANINO, objects)

    back = create_box(
        name=f"{prefix}_Parede_Fundo",
        width=w, depth=wt, height=h,
        location=(ox, back_y, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _link(back, collection, MatNames.PAREDE, objects)

    left = create_box(
        name=f"{prefix}_Parede_Esq",
        width=wt, depth=d, height=h,
        location=(ox - w / 2.0, oy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _link(left, collection, MatNames.PAREDE, objects)

    right = create_box(
        name=f"{prefix}_Parede_Dir",
        width=wt, depth=d, height=h,
        location=(ox + w / 2.0, oy, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _link(right, collection, MatNames.PAREDE, objects)

    parts = create_wall_with_opening(
        name=f"{prefix}_Parede_Frontal",
        wall_length=w,
        wall_height=h,
        wall_thickness=wt,
        opening_width=door_w,
        opening_height=2.3,
        opening_offset_x=door_off_y,
        location=(ox, front_y, base_z),
        axis="X",
    )
    for part in parts:
        _link(part, collection, MatNames.PAREDE, objects)

    porta = create_box(
        name=f"{prefix}_Porta",
        width=0.05, depth=door_w * 0.92, height=2.25,
        location=(ox + door_off_y, front_y, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _link(porta, collection, MatNames.PORTA, objects)
    return front_y


def _stalls(prefix, x, y0, base_z, n, collection, objects, door_mat=MatNames.ALUMINIO):
    """Cabines privativas alinhadas no eixo Y."""
    stall_w, stall_d, stall_h = 0.90, 1.35, 2.0
    for i in range(n):
        cy = y0 + i * (stall_w + 0.04)
        wall = create_box(
            name=f"{prefix}_Cabine_{i+1}_Divisoria",
            width=stall_d, depth=0.03, height=stall_h,
            location=(x, cy + stall_w / 2.0, base_z),
            centered_xy=True, base_at_zero=True,
        )
        _link(wall, collection, MatNames.PAREDE, objects)

        door = create_box(
            name=f"{prefix}_Cabine_{i+1}_Porta",
            width=0.04, depth=stall_w * 0.72, height=1.85,
            location=(x - stall_d / 2.0, cy, base_z + 0.08),
            centered_xy=True, base_at_zero=True,
        )
        _link(door, collection, door_mat, objects)

        vaso = create_box(
            name=f"{prefix}_Cabine_{i+1}_Vaso",
            width=0.42, depth=0.55, height=0.42,
            location=(x + 0.25, cy, base_z),
            centered_xy=True, base_at_zero=True,
        )
        _link(vaso, collection, MatNames.LOUCA, objects)


def _sinks_on_counter(prefix, cx, cy, base_z, n, span, collection, objects):
    """Cubas de sobrepor sobre a bancada."""
    for i in range(n):
        t = (i / max(n - 1, 1)) - 0.5
        cuba = create_cylinder(
            name=f"{prefix}_Cuba_{i+1}",
            radius=0.16, height=0.12, segments=20,
            location=(cx, cy + t * span, base_z + 0.85),
            base_at_zero=True,
        )
        _link(cuba, collection, MatNames.LOUCA, objects)


def _sign(name, text, loc, collection, objects, size=0.16):
    placa = create_3d_text(
        name=name, text=text, location=loc,
        rotation_deg=(90.0, 0.0, 0.0), size=size, collection=collection,
    )
    apply_material_by_name(placa, MatNames.LETREIRO)
    objects.append(placa)


def create_ground_restrooms(collection: bpy.types.Collection) -> list:
    """Cria os 2 banheiros do pavimento térreo (Masculino e Feminino)."""
    s = CONFIG["shopping"]
    half_l = DERIVED["half_length"]
    half_w = DERIVED["half_width"]
    wt = s["wall_thickness"]
    ground_h = CONFIG.get("mezzanine", {}).get("height", 4.2)

    block_w, block_d = 6.4, 5.2
    objects = []
    block_y = half_l - wt - block_d / 2.0 - 0.8

    # -------------------------------------------------------------------------
    # 1. SANITÁRIO MASCULINO TÉRREO
    # -------------------------------------------------------------------------
    ox_m = -half_w + wt + block_w / 2.0 + 0.2
    front_m = _room_shell(
        "AREA_WC_T_Masc", ox_m, block_y, block_w, block_d, ground_h, 0.0,
        door_off_y=1.6, door_w=1.0, collection=collection, objects=objects,
    )

    bancada_m = create_box(
        name="AREA_WC_T_Masc_Bancada",
        width=0.62, depth=2.6, height=0.88,
        location=(ox_m - 2.2, block_y + 0.4, 0.0),
        centered_xy=True, base_at_zero=True,
    )
    _link(bancada_m, collection, MatNames.QUARTZO, objects)
    _sinks_on_counter("AREA_WC_T_Masc", ox_m - 2.2, block_y + 0.4, 0.0, 2, 1.5, collection, objects)

    espelho_m = create_box(
        name="AREA_WC_T_Masc_Espelho_LED",
        width=0.04, depth=2.5, height=1.15,
        location=(ox_m - 2.48, block_y + 0.4, 1.05),
        centered_xy=True, base_at_zero=True,
    )
    _link(espelho_m, collection, MatNames.VIDRO, objects)

    fita = create_box(
        name="AREA_WC_T_Masc_FitaLED",
        width=0.03, depth=2.5, height=0.04,
        location=(ox_m - 2.46, block_y + 0.4, 2.18),
        centered_xy=True, base_at_zero=True,
    )
    _link(fita, collection, MatNames.LED, objects)

    for i in range(3):
        my = block_y - 1.55 + i * 0.85
        mict = create_box(
            name=f"AREA_WC_T_Masc_Mictorio_{i+1}",
            width=0.32, depth=0.28, height=0.68,
            location=(ox_m + 0.15, my, 0.52),
            centered_xy=True, base_at_zero=True,
        )
        _link(mict, collection, MatNames.LOUCA, objects)

        div_vidro = create_box(
            name=f"AREA_WC_T_Masc_DivisoriaVidro_{i+1}",
            width=0.55, depth=0.03, height=1.15,
            location=(ox_m + 0.15, my + 0.38, 0.45),
            centered_xy=True, base_at_zero=True,
        )
        _link(div_vidro, collection, MatNames.VIDRO_ESCURO, objects)

    _stalls("AREA_WC_T_Masc", ox_m + 1.85, block_y - 0.9, 0.0, 2, collection, objects)
    _sign(
        "AREA_WC_T_Masc_Placa", "WC MASCULINO",
        (ox_m + 1.6, front_m - 0.12, 2.45), collection, objects,
    )

    # -------------------------------------------------------------------------
    # 2. SANITÁRIO FEMININO TÉRREO
    # -------------------------------------------------------------------------
    ox_f = half_w - wt - block_w / 2.0 - 0.2
    front_f = _room_shell(
        "AREA_WC_T_Fem", ox_f, block_y, block_w, block_d, ground_h, 0.0,
        door_off_y=-1.6, door_w=1.0, collection=collection, objects=objects,
    )

    bancada_f = create_box(
        name="AREA_WC_T_Fem_Bancada",
        width=0.62, depth=2.8, height=0.88,
        location=(ox_f + 2.15, block_y + 0.35, 0.0),
        centered_xy=True, base_at_zero=True,
    )
    _link(bancada_f, collection, MatNames.QUARTZO, objects)
    _sinks_on_counter("AREA_WC_T_Fem", ox_f + 2.15, block_y + 0.35, 0.0, 2, 1.7, collection, objects)

    camarim = create_box(
        name="AREA_WC_T_Fem_Camarim",
        width=0.48, depth=2.1, height=0.78,
        location=(ox_f - 0.2, block_y + 0.9, 0.0),
        centered_xy=True, base_at_zero=True,
    )
    _link(camarim, collection, MatNames.BANCO_MADEIRA, objects)

    for i in range(3):
        my = block_y + 0.2 + i * 0.7
        esp = create_cylinder(
            name=f"AREA_WC_T_Fem_Espelho_Circular_{i+1}",
            radius=0.18, height=0.03, segments=24,
            location=(ox_f - 0.42, my, 1.35),
            base_at_zero=True,
        )
        _link(esp, collection, MatNames.VIDRO, objects)
        led = create_cylinder(
            name=f"AREA_WC_T_Fem_Espelho_LED_{i+1}",
            radius=0.20, height=0.02, segments=24,
            location=(ox_f - 0.43, my, 1.34),
            base_at_zero=True,
        )
        _link(led, collection, MatNames.LED, objects)

    _stalls("AREA_WC_T_Fem", ox_f - 1.9, block_y - 1.35, 0.0, 3, collection, objects)
    _sign(
        "AREA_WC_T_Fem_Placa", "WC FEMININO",
        (ox_f - 1.6, front_f - 0.12, 2.45), collection, objects,
    )

    return objects


def create_mezzanine_restrooms(collection: bpy.types.Collection) -> list:
    """Cria os 2 banheiros do piso superior (Masculino PCD e Feminino Família)."""
    s = CONFIG["shopping"]
    mz = CONFIG.get("mezzanine", {})
    half_l = DERIVED["half_length"]
    half_w = DERIVED["half_width"]
    wt = s["wall_thickness"]
    base_z = mz.get("floor_z", 4.7)
    upper_h = s["height"] - base_z

    block_w, block_d = 5.6, 4.6
    objects = []
    block_y = half_l - wt - block_d / 2.0 - 0.4

    # -------------------------------------------------------------------------
    # 3. SANITÁRIO MASCULINO MEZANINO PCD (acesso amplo, sem desnível)
    # -------------------------------------------------------------------------
    ox_m = -half_w + wt + block_w / 2.0 + 0.15
    front_m = _room_shell(
        "AREA_WC_M_Masc_PCD", ox_m, block_y, block_w, block_d, upper_h, base_z,
        door_off_y=1.35, door_w=1.20, collection=collection, objects=objects,
    )

    vaso_pcd = create_box(
        name="AREA_WC_M_PCD_Vaso",
        width=0.50, depth=0.70, height=0.48,
        location=(ox_m - 1.55, block_y + 0.7, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _link(vaso_pcd, collection, MatNames.LOUCA, objects)

    barra_h = create_box(
        name="AREA_WC_M_PCD_BarraApoio_H",
        width=0.80, depth=0.05, height=0.05,
        location=(ox_m - 1.55, block_y + 1.15, base_z + 0.75),
        centered_xy=True, base_at_zero=True,
    )
    _link(barra_h, collection, MatNames.METAL, objects)

    barra_l = create_box(
        name="AREA_WC_M_PCD_BarraApoio_L",
        width=0.05, depth=0.70, height=0.05,
        location=(ox_m - 2.05, block_y + 0.7, base_z + 0.75),
        centered_xy=True, base_at_zero=True,
    )
    _link(barra_l, collection, MatNames.METAL, objects)

    barra_v = create_box(
        name="AREA_WC_M_PCD_BarraApoio_V",
        width=0.05, depth=0.05, height=0.70,
        location=(ox_m - 2.05, block_y + 1.05, base_z + 0.40),
        centered_xy=True, base_at_zero=True,
    )
    _link(barra_v, collection, MatNames.METAL, objects)

    pia_pcd = create_box(
        name="AREA_WC_M_PCD_Pia",
        width=0.55, depth=0.70, height=0.12,
        location=(ox_m + 1.4, block_y + 0.6, base_z + 0.78),
        centered_xy=True, base_at_zero=True,
    )
    _link(pia_pcd, collection, MatNames.QUARTZO, objects)

    cuba_pcd = create_cylinder(
        name="AREA_WC_M_PCD_Cuba",
        radius=0.17, height=0.10, segments=20,
        location=(ox_m + 1.4, block_y + 0.6, base_z + 0.88),
        base_at_zero=True,
    )
    _link(cuba_pcd, collection, MatNames.LOUCA, objects)

    _sign(
        "AREA_WC_M_Masc_Placa", "WC MASCULINO / PCD",
        (ox_m + 1.35, front_m - 0.12, base_z + 2.45), collection, objects, size=0.14,
    )

    # -------------------------------------------------------------------------
    # 4. SANITÁRIO FEMININO MEZANINO + ESPAÇO FAMÍLIA / FRALDÁRIO
    # -------------------------------------------------------------------------
    ox_f = half_w - wt - block_w / 2.0 - 0.15
    front_f = _room_shell(
        "AREA_WC_M_Fem_Familia", ox_f, block_y, block_w, block_d, upper_h, base_z,
        door_off_y=-1.35, door_w=1.10, collection=collection, objects=objects,
    )

    fraldario = create_box(
        name="AREA_WC_M_Fraldario_Bancada",
        width=0.70, depth=1.55, height=0.90,
        location=(ox_f + 1.45, block_y + 0.55, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _link(fraldario, collection, MatNames.BANCO_MADEIRA, objects)

    colchao = create_box(
        name="AREA_WC_M_Fraldario_Colchao",
        width=0.62, depth=1.40, height=0.08,
        location=(ox_f + 1.45, block_y + 0.55, base_z + 0.90),
        centered_xy=True, base_at_zero=True,
    )
    _link(colchao, collection, MatNames.ACOLCHOADO, objects)

    pia_inf = create_box(
        name="AREA_WC_M_Pia_Infantil",
        width=0.42, depth=0.48, height=0.10,
        location=(ox_f + 0.15, block_y + 0.9, base_z + 0.55),
        centered_xy=True, base_at_zero=True,
    )
    _link(pia_inf, collection, MatNames.QUARTZO, objects)

    cuba_inf = create_cylinder(
        name="AREA_WC_M_Cuba_Infantil",
        radius=0.12, height=0.08, segments=16,
        location=(ox_f + 0.15, block_y + 0.9, base_z + 0.64),
        base_at_zero=True,
    )
    _link(cuba_inf, collection, MatNames.LOUCA, objects)

    poltrona = create_box(
        name="AREA_WC_M_Poltrona_Amamentacao",
        width=0.78, depth=0.82, height=0.48,
        location=(ox_f - 1.55, block_y + 0.85, base_z),
        centered_xy=True, base_at_zero=True,
    )
    _link(poltrona, collection, MatNames.ACOLCHOADO, objects)

    encosto = create_box(
        name="AREA_WC_M_Poltrona_Encosto",
        width=0.12, depth=0.82, height=0.70,
        location=(ox_f - 1.88, block_y + 0.85, base_z + 0.48),
        centered_xy=True, base_at_zero=True,
    )
    _link(encosto, collection, MatNames.ACOLCHOADO, objects)

    _stalls("AREA_WC_M_Fem_Familia", ox_f - 0.35, block_y - 1.35, base_z, 2, collection, objects)
    _sign(
        "AREA_WC_M_Fem_Placa", "WC FEMININO / FAMÍLIA",
        (ox_f - 1.35, front_f - 0.12, base_z + 2.45), collection, objects, size=0.13,
    )

    return objects


def build_restrooms(collections: dict) -> dict:
    """Ponto de entrada do módulo de sanitários (4 banheiros)."""
    log_section("Criando 4 Sanitários Completos (Térreo e Mezanino)")

    col_wc = collections.get("SANITARIOS") or collections.get("03_AREAS")
    if not col_wc:
        raise ValueError("Collection 'SANITARIOS' não encontrada.")

    result = {
        "ground_restrooms": create_ground_restrooms(col_wc),
        "mezzanine_restrooms": create_mezzanine_restrooms(col_wc),
    }

    total = len(result["ground_restrooms"]) + len(result["mezzanine_restrooms"])
    log_section_end(f"Sanitários ({total} objetos nos 4 banheiros)")
    return result
