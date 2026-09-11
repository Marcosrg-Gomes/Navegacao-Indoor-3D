"""
architecture/guardrails.py — Criação do guarda-corpo panorâmico de vidro do mezanino

Gera:
  - Painéis de vidro de segurança laminado (H=1.1m, T=0.04m, MAT_Vidro) contornando o vão central
  - Corrimão metálico contínuo escovado no topo (MAT_Metal)
  - Montantes metálicos de fixação a cada intervalo regular
"""

import bpy
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
) -> list:
    """
    Cria uma seção de guarda-corpo linear com vidro, corrimão superior e montantes.

    Args:
        name_prefix: Prefixo do nome dos objetos.
        length: Comprimento da seção.
        start_pos: Posição inicial (X, Y, Z).
        axis: 'Y' para seções longitudinais ou 'X' para transversais.
        collection: Collection onde inserir os objetos.
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
    num_posts = max(int(length / post_spacing) + 1, 2)
    step = length / max(num_posts - 1, 1)

    for i in range(num_posts):
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

    s = CONFIG["shopping"]
    mz = CONFIG.get("mezzanine", {})
    wt = s["wall_thickness"]
    atrium_w = mz.get("atrium_opening", 5.0)
    base_z = mz.get("floor_z", 4.7)

    # Vão longitudinal do átrio
    atrium_start_y = DERIVED["store_start_y"] - 1.0
    total_len = s["length"] - 2 * wt
    atrium_len = total_len * 0.65  # Vão cobre a maior parte central

    half_atrium_w = atrium_w / 2.0
    half_atrium_l = atrium_len / 2.0

    objects = []

    # 1. Guarda-corpo Lateral Esquerdo (longitudinal)
    gc_esq = create_guardrail_section(
        name_prefix="ARQ_GC_Mezanino_Esq",
        length=atrium_len,
        start_pos=(-half_atrium_w, -half_atrium_l, base_z),
        axis='Y',
        collection=col_gc,
    )
    objects.extend(gc_esq)

    # 2. Guarda-corpo Lateral Direito (longitudinal)
    gc_dir = create_guardrail_section(
        name_prefix="ARQ_GC_Mezanino_Dir",
        length=atrium_len,
        start_pos=(+half_atrium_w, -half_atrium_l, base_z),
        axis='Y',
        collection=col_gc,
    )
    objects.extend(gc_dir)

    # 3. Guarda-corpo Frontal (transversal com abertura central para escada/circulação)
    gc_front_l = create_guardrail_section(
        name_prefix="ARQ_GC_Mezanino_Frente_Esq",
        length=half_atrium_w - 0.8,
        start_pos=(-half_atrium_w, -half_atrium_l, base_z),
        axis='X',
        collection=col_gc,
    )
    objects.extend(gc_front_l)

    gc_front_r = create_guardrail_section(
        name_prefix="ARQ_GC_Mezanino_Frente_Dir",
        length=half_atrium_w - 0.8,
        start_pos=(0.8, -half_atrium_l, base_z),
        axis='X',
        collection=col_gc,
    )
    objects.extend(gc_front_r)

    # 4. Guarda-corpo Fundo (transversal em frente à praça de alimentação)
    gc_back = create_guardrail_section(
        name_prefix="ARQ_GC_Mezanino_Fundo",
        length=atrium_w,
        start_pos=(-half_atrium_w, half_atrium_l, base_z),
        axis='X',
        collection=col_gc,
    )
    objects.extend(gc_back)

    log_section_end(f"Guarda-Corpos ({len(objects)} elementos)")
    return {"guardrails": objects}
