"""
architecture/stairs.py — Escada monumental funcional de 2 lances com patamar

Gera:
  - Lance 1: Z=0.0m até Z=2.35m (13 degraus, acabamento em madeira/metal)
  - Patamar intermediário: Z=2.35m
  - Lance 2: Z=2.35m até Z=4.7m (13 degraus, chegando no mezanino)
  - Guarda-corpo de vidro com corrimão metálico
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_object_created, log_section, log_section_end, log_info
from materials import MatNames


def create_monumental_stairs(collection: bpy.types.Collection) -> list:
    """
    Cria escada monumental funcional de dois lances conectando o térreo ao mezanino.
    """
    s_cfg = CONFIG["stairs"]
    mz = CONFIG.get("mezzanine", {})
    target_z = mz.get("floor_z", 4.7)
    landing_z = target_z / 2.0  # 2.35m

    stair_w = s_cfg.get("width", 3.5) / 2.0 - 0.1  # largura de cada lance
    step_h = 0.18
    step_d = 0.28
    steps_per_flight = 13
    flight_depth = steps_per_flight * step_d  # ~3.64m
    landing_depth = 1.4

    # Posição no lado direito (Leste) do shopping, próximo ao fundo
    half_l = DERIVED["half_length"]
    wt = CONFIG["shopping"]["wall_thickness"]
    base_x = s_cfg.get("position_offset_x", 5.5)
    base_y = half_l - wt - s_cfg.get("position_offset_y", 6.0) - flight_depth - landing_depth

    objects = []

    # -------------------------------------------------------------------------
    # 1. LANCE 1 (Sobe em direção ao fundo Y+, lado esquerdo da escada)
    # -------------------------------------------------------------------------
    flight1_x = base_x - stair_w / 2.0 - 0.05
    for i in range(steps_per_flight):
        sy = base_y + i * step_d
        sz = i * step_h
        st = create_box(
            name=f"ARQ_ESCADA_L1_Degrau_{i+1:02d}",
            width=stair_w,
            depth=step_d,
            height=step_h,
            location=(flight1_x, sy, sz),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(st, collection)
        apply_material_by_name(st, MatNames.BANCO_MADEIRA)
        objects.append(st)

    # -------------------------------------------------------------------------
    # 2. PATAMAR INTERMEDIÁRIO (Z = landing_z)
    # -------------------------------------------------------------------------
    landing_y = base_y + flight_depth + landing_depth / 2.0
    landing = create_box(
        name="ARQ_ESCADA_Patamar",
        width=s_cfg.get("width", 3.5),
        depth=landing_depth,
        height=0.2,
        location=(base_x, landing_y, landing_z - 0.2),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(landing, collection)
    apply_material_by_name(landing, MatNames.LAJE_MEZANINO)
    objects.append(landing)

    # -------------------------------------------------------------------------
    # 3. LANCE 2 (Retorno em U ou subida contínua para Z=4.7m)
    # -------------------------------------------------------------------------
    flight2_x = base_x + stair_w / 2.0 + 0.05
    # Subida contínua a partir do patamar
    for i in range(steps_per_flight):
        sy = base_y + flight_depth + landing_depth + i * step_d
        sz = landing_z + i * step_h
        st = create_box(
            name=f"ARQ_ESCADA_L2_Degrau_{i+1:02d}",
            width=stair_w,
            depth=step_d,
            height=step_h,
            location=(flight2_x, sy, sz),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(st, collection)
        apply_material_by_name(st, MatNames.BANCO_MADEIRA)
        objects.append(st)

    # -------------------------------------------------------------------------
    # 4. GUARDA-CORPO LATERAL DE VIDRO
    # -------------------------------------------------------------------------
    total_stair_depth = flight_depth * 2 + landing_depth
    gc = create_box(
        name="ARQ_ESCADA_GuardaCorpo_Vidro",
        width=0.04,
        depth=total_stair_depth,
        height=1.1,
        location=(base_x - s_cfg.get("width", 3.5)/2.0, base_y + total_stair_depth/2.0, landing_z/2.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(gc, collection)
    apply_material_by_name(gc, MatNames.VIDRO)
    objects.append(gc)

    return objects


def build_stairs(collections: dict) -> dict:
    """Ponto de entrada do módulo de escada."""
    log_section("Criando Escada Monumental")

    col_escadas = collections.get("ESCADAS") or collections.get("01_ARQUITETURA")
    if not col_escadas:
        raise ValueError("Collection 'ESCADAS' não encontrada.")

    stairs_objs = create_monumental_stairs(col_escadas)

    result = {"stairs": stairs_objs}
    log_section_end(f"Escada Monumental ({len(stairs_objs)} elementos)")
    return result
