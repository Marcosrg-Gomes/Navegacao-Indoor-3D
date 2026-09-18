"""
architecture/guardrails.py — Criação do guarda-corpo panorâmico de vidro do mezanino

Gera:
  - Painéis de vidro de segurança laminado (H=1.1m, T=0.04m, MAT_Vidro) contornando o vão central
  - Corrimão metálico contínuo escovado no topo (MAT_Metal)
  - Montantes metálicos de fixação a cada intervalo regular
"""

import bpy
from math import ceil
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_cylinder
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_info, log_object_created, log_section, log_section_end
from materials import MatNames


def create_guardrail_section(
    name_prefix: str,
    length: float,
    start_pos: tuple,
    axis: str,
    collection: bpy.types.Collection,
    include_end_posts: bool = True,
) -> list:
    """
    Cria uma seção de guarda-corpo linear com vidro, corrimão superior e montantes.

    Args:
        name_prefix: Prefixo do nome dos objetos.
        length: Comprimento da seção.
        start_pos: Posição inicial (X, Y, Z).
        axis: 'Y' para seções longitudinais ou 'X' para transversais.
        collection: Collection onde inserir os objetos.
        include_end_posts: Desative nas travessas para compartilhar os postes dos cantos.
    """
    mz = CONFIG.get("mezzanine", {})
    gh = mz.get("guardrail_height", 1.1)
    gt = mz.get("guardrail_thickness", 0.04)
    base_z = start_pos[2]

    objects = []

    # 1. Painel de Vidro Principal
    if axis == 'Y':
        glass_w = gt
        glass_d = length
        center_x = start_pos[0]
        center_y = start_pos[1] + length / 2.0
        handrail_w = 0.06
        handrail_d = length
    else:
        glass_w = length
        glass_d = gt
        center_x = start_pos[0] + length / 2.0
        center_y = start_pos[1]
        handrail_w = length
        handrail_d = 0.06

    glass_obj = create_box(
        name=f"{name_prefix}_Vidro",
        width=glass_w,
        depth=glass_d,
        height=gh,
        location=(center_x, center_y, base_z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(glass_obj, collection)
    apply_material_by_name(glass_obj, MatNames.VIDRO)
    objects.append(glass_obj)

    # 2. Corrimão Metálico no Topo
    handrail_h = 0.04
    handrail_obj = create_box(
        name=f"{name_prefix}_Corrimao",
        width=handrail_w,
        depth=handrail_d,
        height=handrail_h,
        location=(center_x, center_y, base_z + gh),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(handrail_obj, collection)
    apply_material_by_name(handrail_obj, MatNames.METAL)
    objects.append(handrail_obj)

    # 3. Montantes Metálicos (postes verticais)
    post_spacing = 3.0
    num_posts = max(ceil(length / post_spacing) + 1, 2)
    step = length / max(num_posts - 1, 1)

    for i in range(num_posts):
        if not include_end_posts and i in (0, num_posts - 1):
            continue
        if axis == 'Y':
            px = center_x
            py = start_pos[1] + i * step
        else:
            px = start_pos[0] + i * step
            py = center_y

        post = create_cylinder(
            name=f"{name_prefix}_Poste_{i+1:02d}",
            radius=0.025,
            height=gh + handrail_h,
            location=(px, py, base_z),
            base_at_zero=True,
        )
        link_to_collection(post, collection)
        apply_material_by_name(post, MatNames.METAL)
        objects.append(post)

    return objects


def build_guardrails(collections: dict) -> dict:
    """
    Cria todos os guarda-corpos do vão central do mezanino (átrio).
    """
    log_section("Criando Guarda-Corpos Panorâmicos de Vidro")

    col_gc = collections.get("GUARDACORPOS") or collections.get("MEZANINO") or collections.get("01_ARQUITETURA")
    if not col_gc:
        col_gc = list(collections.values())[0]

    mz = CONFIG.get("mezzanine", {})
    base_z = mz.get("floor_z", 4.7)

    # Assentar vidro e postes sobre a laje, junto aos limites reais do vão.
    edge_offset = max(0.03, mz.get("guardrail_thickness", 0.04) / 2.0)
    left_x = DERIVED["mz_corridor_left_x"] - edge_offset
    right_x = DERIVED["mz_corridor_right_x"] + edge_offset
    front_y = DERIVED["mz_atrium_start_y"] - edge_offset
    back_y = DERIVED["mz_atrium_end_y"] + edge_offset
    objects = []
    for side, axis, length, x, y in (
        ("Esq", 'Y', back_y - front_y, left_x, front_y),
        ("Dir", 'Y', back_y - front_y, right_x, front_y),
        ("Frente", 'X', right_x - left_x, left_x, front_y),
        ("Fundo", 'X', right_x - left_x, left_x, back_y),
    ):
        objects.extend(create_guardrail_section(
            name_prefix=f"ARQ_GC_Mezanino_{side}",
            length=length, start_pos=(x, y, base_z), axis=axis,
            collection=col_gc, include_end_posts=(axis == 'Y'),
        ))

    log_section_end(f"Guarda-Corpos ({len(objects)} elementos)")
    return {"guardrails": objects}
