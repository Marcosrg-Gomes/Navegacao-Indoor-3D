"""
architecture/stairs.py — Escada decorativa do shopping

Cria uma escada de degraus individuais posicionada no fundo do shopping,
ao lado da praça de alimentação. Elemento decorativo/escultural —
não conecta a um segundo pavimento real.

Cada degrau é um box criado via create_box(), posicionado com offset
acumulativo em Y e Z conforme a norma ABNT (h=18cm, d=28cm).
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_object_created, log_section, log_section_end, log_info
from materials import MatNames


def create_stair_structure(collection: bpy.types.Collection) -> list:
    """
    Cria todos os degraus da escada.

    A escada sobe em direção ao fundo (Y positivo) e em altura (Z positivo).
    Posicionada no lado direito do fundo do shopping.

    Args:
        collection: Collection ESCADAS.

    Returns:
        Lista de objetos de degrau criados.
    """
    s_cfg = CONFIG["stairs"]
    s = CONFIG["shopping"]
    half_l = DERIVED["half_length"]
    half_w = DERIVED["half_width"]

    step_count = s_cfg["step_count"]
    step_h = s_cfg["step_height"]
    step_d = s_cfg["step_depth"]
    stair_width = s_cfg["width"]
    wt = s["wall_thickness"]

    # Posição de origem da escada
    # X: lado direito do shopping, recuado da parede
    origin_x = s_cfg["position_offset_x"]
    # Y: a partir do fundo, indo para a frente
    origin_y = half_l - wt - s_cfg["position_offset_y"] - step_d * step_count
    # Z: começa no piso
    origin_z = 0.0

    objects = []

    for i in range(step_count):
        # Cada degrau é mais alto e mais recuado (Y+) que o anterior
        step_y = origin_y + i * step_d
        step_z = origin_z + i * step_h

        # O degrau i cobre toda a altura acumulada (como uma pirâmide sólida)
        # Isso dá aparência sólida sem geometria interna visível
        degrau_height = step_h * (step_count - i)   # mais alto na frente

        name = f"ARQ_ESCADA_Degrau_{i+1:02d}"
        obj = create_box(
            name=name,
            width=stair_width,
            depth=step_d,
            height=degrau_height,
            location=(origin_x, step_y, step_z),
            centered_xy=False,
            base_at_zero=True,
        )

        link_to_collection(obj, collection)
        apply_material_by_name(obj, MatNames.MADEIRA)
        objects.append(obj)

    log_info(f"Degraus criados: {len(objects)}")

    # Criar estrutura base (volume sólido abaixo da escada)
    total_depth = step_count * step_d
    total_height = step_count * step_h

    base_obj = create_box(
        name="ARQ_ESCADA_Base",
        width=stair_width,
        depth=total_depth,
        height=total_height,
        location=(origin_x, origin_y, 0.0),
        centered_xy=False,
        base_at_zero=True,
    )
    link_to_collection(base_obj, collection)
    apply_material_by_name(base_obj, MatNames.PAREDE)
    log_object_created("ARQ_ESCADA_Base", "Base Escada")
    objects.append(base_obj)

    return objects


def create_stair_railing(collection: bpy.types.Collection) -> list:
    """
    Cria guarda-corpo simplificado da escada (dois volumes laterais).

    Returns:
        Lista com os objetos de guarda-corpo.
    """
    s_cfg = CONFIG["stairs"]
    half_l = DERIVED["half_length"]
    s = CONFIG["shopping"]
    wt = s["wall_thickness"]

    step_count = s_cfg["step_count"]
    step_h = s_cfg["step_height"]
    step_d = s_cfg["step_depth"]
    stair_width = s_cfg["width"]
    origin_x = s_cfg["position_offset_x"]
    origin_y = half_l - wt - s_cfg["position_offset_y"] - step_d * step_count

    total_depth = step_count * step_d
    total_height = step_count * step_h
    railing_h = 1.05  # Altura do guarda-corpo (norma: min 1.05 m)
    railing_t = 0.08  # Espessura do guarda-corpo

    objects = []

    for side, x_offset in [("Esq", -railing_t), ("Dir", stair_width)]:
        name = f"ARQ_ESCADA_Guarda_{side}"
        obj = create_box(
            name=name,
            width=railing_t,
            depth=total_depth,
            height=total_height + railing_h,
            location=(origin_x + x_offset, origin_y, 0.0),
            centered_xy=False,
            base_at_zero=True,
        )
        link_to_collection(obj, collection)
        apply_material_by_name(obj, MatNames.METAL)
        log_object_created(name, "Guarda-corpo")
        objects.append(obj)

    return objects


def build_stairs(collections: dict) -> dict:
    """Ponto de entrada principal do módulo."""
    log_section("Criando Escada")

    col_escadas = collections.get("ESCADAS")
    if not col_escadas:
        raise ValueError("Collection 'ESCADAS' não encontrada.")

    steps = create_stair_structure(col_escadas)
    railings = create_stair_railing(col_escadas)

    result = {"steps": steps, "railings": railings}
    log_section_end(f"Escada ({len(steps) + len(railings)} objetos)")
    return result
