"""
architecture/vertical_circulation.py — Circulação Vertical Integrada (Escadas Rolantes e Elevador Panorâmico)

Gera:
  - Par de escadas rolantes centrais (subida / descida) conectando o Térreo ao Mezanino (Z=0 a Z=4.7m)
  - Elevador panorâmico de vidro cilíndrico com colunas de aço e cabine iluminada
"""

import bpy
import math
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_cylinder
from utils.helpers import link_to_collection, apply_material_by_name, set_object_rotation
from utils.logging import log_info, log_object_created, log_section, log_section_end
from materials import MatNames


# =============================================================================
# ESCADAS ROLANTES (PAR SUBIDA / DESCIDA)
# =============================================================================

def create_single_escalator(
    name_prefix: str,
    start_point: tuple, # (X, Y, Z_base)
    length_y: float,
    height_z: float,
    width_x: float,
    collection: bpy.types.Collection,
) -> list:
    """
    Cria uma escada rolante completa com estrutura inclinada, degraus,
    balustradas de vidro e corrimão.
    """
    objects = []
    sx, sy, sz = start_point

    # 1. Estrutura Principal Inclinada (Truss / Caixa)
    # Inclinação suave de Z=0 a Z=4.7m
    angle_rad = math.atan2(height_z, length_y)
    diag_length = math.sqrt(length_y**2 + height_z**2)
    center_y = sy + length_y / 2.0
    center_z = sz + height_z / 2.0

    truss = create_box(
        name=f"{name_prefix}_Estrutura",
        width=width_x,
        depth=diag_length,
        height=0.4,
        location=(sx, center_y, center_z),
        centered_xy=True,
        base_at_zero=False,
    )
    # Rotação no eixo X para acompanhar a inclinação
    set_object_rotation(truss, (math.degrees(angle_rad), 0.0, 0.0))
    link_to_collection(truss, collection)
    apply_material_by_name(truss, MatNames.ESCADA_ROLANTE)
    objects.append(truss)

    # 2. Degraus Escalonados (Steps)
    num_steps = 18
    step_dy = length_y / num_steps
    step_dz = height_z / num_steps
    step_depth = step_dy * 1.2
    step_height = step_dz

    for i in range(num_steps):
        step_y = sy + (i + 0.5) * step_dy
        step_z = sz + i * step_dz
        st = create_box(
            name=f"{name_prefix}_Degrau_{i+1:02d}",
            width=width_x * 0.85,
            depth=step_depth,
            height=step_height,
            location=(sx, step_y, step_z),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(st, collection)
        apply_material_by_name(st, MatNames.METAL)
        objects.append(st)

    # 3. Balustradas de Vidro Laterais (Guarda-corpos da escada rolante)
    glass_h = 0.9
    for side_offset, side_name in [(-width_x / 2.0, "Esq"), (width_x / 2.0, "Dir")]:
        glass = create_box(
            name=f"{name_prefix}_Vidro_{side_name}",
            width=0.03,
            depth=diag_length,
            height=glass_h,
            location=(sx + side_offset, center_y, center_z + glass_h / 2.0),
            centered_xy=True,
            base_at_zero=False,
        )
        set_object_rotation(glass, (math.degrees(angle_rad), 0.0, 0.0))
        link_to_collection(glass, collection)
        apply_material_by_name(glass, MatNames.VIDRO)
        objects.append(glass)

        # Corrimão no topo do vidro
        handrail = create_box(
            name=f"{name_prefix}_Corrimao_{side_name}",
            width=0.08,
            depth=diag_length,
            height=0.05,
            location=(sx + side_offset, center_y, center_z + glass_h),
            centered_xy=True,
            base_at_zero=False,
        )
        set_object_rotation(handrail, (math.degrees(angle_rad), 0.0, 0.0))
        link_to_collection(handrail, collection)
        apply_material_by_name(handrail, MatNames.PORTA) # Emborrachado escuro
        objects.append(handrail)

    # 4. Patamares horizontais de entrada (térreo) e saída (mezanino)
    plat_len = 1.2
    # Base Térreo
    plat_bottom = create_box(
        name=f"{name_prefix}_Plat_Terreo",
        width=width_x + 0.1,
        depth=plat_len,
        height=0.2,
        location=(sx, sy - plat_len / 2.0, sz),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(plat_bottom, collection)
    apply_material_by_name(plat_bottom, MatNames.ESCADA_ROLANTE)
    objects.append(plat_bottom)

    # Base Mezanino
    plat_top = create_box(
        name=f"{name_prefix}_Plat_Mezanino",
        width=width_x + 0.1,
        depth=plat_len,
        height=0.2,
        location=(sx, sy + length_y + plat_len / 2.0, sz + height_z - 0.2),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(plat_top, collection)
    apply_material_by_name(plat_top, MatNames.ESCADA_ROLANTE)
    objects.append(plat_top)

    return objects


def create_escalators(collection: bpy.types.Collection) -> list:
    """
    Cria um par centralizado de escadas rolantes (uma de subida, outra de descida).
    """
    mz = CONFIG.get("mezzanine", {})
    height_z = mz.get("floor_z", 4.7)
    length_y = 9.0  # Comprimento da rampa
    esc_w = 1.2
    spacing_x = 0.3
    start_y = -4.5  # Centralizada longitudinalmente no átrio

    objects = []

    # Escada 1: Lado Esquerdo (Subida)
    x_left = -(esc_w / 2.0 + spacing_x / 2.0)
    esc_up = create_single_escalator(
        name_prefix="ARQ_ESCADA_ROLANTE_Subida",
        start_point=(x_left, start_y, 0.0),
        length_y=length_y,
        height_z=height_z,
        width_x=esc_w,
        collection=collection,
    )
    objects.extend(esc_up)

    # Escada 2: Lado Direito (Descida)
    x_right = (esc_w / 2.0 + spacing_x / 2.0)
    esc_down = create_single_escalator(
        name_prefix="ARQ_ESCADA_ROLANTE_Descida",
        start_point=(x_right, start_y, 0.0),
        length_y=length_y,
        height_z=height_z,
        width_x=esc_w,
        collection=collection,
    )
    objects.extend(esc_down)

    return objects


# =============================================================================
# ELEVADOR PANORÂMICO
# =============================================================================

def create_panoramic_elevator(collection: bpy.types.Collection) -> list:
    """
    Cria uma torre panorâmica de elevador de vidro cilíndrico com colunas de aço.
    Localizado no átrio, próximo à praça e escadas rolantes.
    """
    s = CONFIG["shopping"]
    mz = CONFIG.get("mezzanine", {})
    total_h = s["height"] - 0.5
    mz_floor_z = mz.get("floor_z", 4.7)

    radius = 1.4
    center_pos = (0.0, 8.5, 0.0) # Posicionado ao norte do átrio
    cx, cy, cz = center_pos

    objects = []

    # 1. Torre de Vidro Externa (Eixo / Shaft Panorâmico)
    shaft = create_cylinder(
        name="ARQ_ELEVADOR_Torre_Vidro",
        radius=radius,
        height=total_h,
        location=(cx, cy, cz),
        vertices=24,
        base_at_zero=True,
    )
    link_to_collection(shaft, collection)
    apply_material_by_name(shaft, MatNames.ELEVADOR_VIDRO)
    objects.append(shaft)

    # 2. 4 Colunas Estruturais de Aço ao redor do cilindro
    col_r = 0.06
    for angle_deg in [45, 135, 225, 315]:
        rad = math.radians(angle_deg)
        col_x = cx + (radius + 0.05) * math.cos(rad)
        col_y = cy + (radius + 0.05) * math.sin(rad)
        col = create_cylinder(
            name=f"ARQ_ELEVADOR_Coluna_{angle_deg}",
            radius=col_r,
            height=total_h,
            location=(col_x, col_y, cz),
            vertices=12,
            base_at_zero=True,
        )
        link_to_collection(col, collection)
        apply_material_by_name(col, MatNames.METAL)
        objects.append(col)

    # 3. Anéis Estruturais de Travamento Metálicos
    for ring_z in [0.0, mz.get("height", 4.2), total_h]:
        ring = create_cylinder(
            name=f"ARQ_ELEVADOR_Anel_Z_{int(ring_z)}",
            radius=radius + 0.08,
            height=0.2,
            location=(cx, cy, ring_z),
            vertices=24,
            base_at_zero=True,
        )
        link_to_collection(ring, collection)
        apply_material_by_name(ring, MatNames.METAL)
        objects.append(ring)

    # 4. Cabine Panorâmica (Suspensa em meia altura para visual cinematográfico)
    cabin_z = 2.0
    cabin_h = 2.6
    cabin = create_cylinder(
        name="ARQ_ELEVADOR_Cabine",
        radius=radius * 0.85,
        height=cabin_h,
        location=(cx, cy, cabin_z),
        vertices=20,
        base_at_zero=True,
    )
    link_to_collection(cabin, collection)
    apply_material_by_name(cabin, MatNames.VIDRO)
    objects.append(cabin)

    # Teto e Piso da Cabine
    cabin_base = create_cylinder(
        name="ARQ_ELEVADOR_Cabine_Base",
        radius=radius * 0.88,
        height=0.1,
        location=(cx, cy, cabin_z),
        vertices=20,
        base_at_zero=True,
    )
    link_to_collection(cabin_base, collection)
    apply_material_by_name(cabin_base, MatNames.METAL)
    objects.append(cabin_base)

    cabin_top = create_cylinder(
        name="ARQ_ELEVADOR_Cabine_Teto",
        radius=radius * 0.88,
        height=0.1,
        location=(cx, cy, cabin_z + cabin_h - 0.1),
        vertices=20,
        base_at_zero=True,
    )
    link_to_collection(cabin_top, collection)
    apply_material_by_name(cabin_top, MatNames.METAL)
    objects.append(cabin_top)

    return objects


# =============================================================================
# PONTO DE ENTRADA
# =============================================================================

def build_vertical_circulation(collections: dict) -> dict:
    """
    Ponto de entrada do sistema de circulação vertical.
    """
    log_section("Criando Circulação Vertical (Escadas Rolantes e Elevador)")

    col_vert = collections.get("07_CIRCULACAO_VERTICAL") or collections.get("01_ARQUITETURA")
    col_escadas = collections.get("ESCADAS_ROLANTES", col_vert)
    col_elevador = collections.get("ELEVADOR", col_vert)

    result = {}

    result["escalators"] = create_escalators(col_escadas)
    result["elevator"] = create_panoramic_elevator(col_elevador)

    total = len(result["escalators"]) + len(result["elevator"])
    log_section_end(f"Circulação Vertical ({total} objetos)")
    return result
