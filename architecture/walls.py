"""
architecture/walls.py — Criação das paredes do shopping

Gera:
  - 4 paredes externas (Norte/Sul/Leste/Oeste) com abertura para a entrada
  - Paredes internas divisórias entre lojas (lado esquerdo e direito)
  - Parede de fundo de cada loja

Convenção de orientação:
  Sul  = frente (entrada), Y = -half_length  (menor Y)
  Norte = fundo,           Y = +half_length  (maior Y)
  Oeste = esquerda,        X = -half_width
  Leste = direita,         X = +half_width
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_wall_with_opening
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_info, log_object_created, log_section, log_section_end
from materials import MatNames


# =============================================================================
# PAREDES EXTERNAS
# =============================================================================

def create_external_walls(collection: bpy.types.Collection) -> list:
    """
    Cria as 4 paredes externas do shopping.
    A parede sul (frente) tem abertura para a entrada principal.

    Args:
        collection: Collection PAREDES_EXTERNAS.

    Returns:
        Lista de todos os objetos de parede externa criados.
    """
    s = CONFIG["shopping"]
    ent = CONFIG["entrance"]

    half_w = DERIVED["half_width"]
    half_l = DERIVED["half_length"]
    wt = s["wall_thickness"]
    h = s["height"]

    objects = []

    # ------------------------------------------------------------------
    # PAREDE NORTE (fundo) — ao longo do eixo X
    # ------------------------------------------------------------------
    obj_norte = create_box(
        name="ARQ_PAREDE_EXT_Norte",
        width=s["width"],
        depth=wt,
        height=h,
        location=(0.0, half_l - wt / 2.0, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(obj_norte, collection)
    apply_material_by_name(obj_norte, MatNames.PAREDE)
    log_object_created("ARQ_PAREDE_EXT_Norte", "Parede")
    objects.append(obj_norte)

    # ------------------------------------------------------------------
    # PAREDE SUL (frente/entrada) — com abertura para entrada
    # ------------------------------------------------------------------
    wall_parts = create_wall_with_opening(
        name="ARQ_PAREDE_EXT_Sul",
        wall_length=s["width"],
        wall_height=h,
        wall_thickness=wt,
        opening_width=ent["width"],
        opening_height=ent["height"],
        opening_offset_x=0.0,         # Centralizado
        location=(0.0, -half_l + wt / 2.0, 0.0),
        axis="X",
    )
    for part in wall_parts:
        link_to_collection(part, collection)
        apply_material_by_name(part, MatNames.PAREDE)
        log_object_created(part.name, "Parede")
    objects.extend(wall_parts)

    # ------------------------------------------------------------------
    # PAREDE OESTE (esquerda) — ao longo do eixo Y
    # ------------------------------------------------------------------
    obj_oeste = create_box(
        name="ARQ_PAREDE_EXT_Oeste",
        width=wt,
        depth=s["length"],
        height=h,
        location=(-half_w + wt / 2.0, 0.0, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(obj_oeste, collection)
    apply_material_by_name(obj_oeste, MatNames.PAREDE)
    log_object_created("ARQ_PAREDE_EXT_Oeste", "Parede")
    objects.append(obj_oeste)

    # ------------------------------------------------------------------
    # PAREDE LESTE (direita) — ao longo do eixo Y
    # ------------------------------------------------------------------
    obj_leste = create_box(
        name="ARQ_PAREDE_EXT_Leste",
        width=wt,
        depth=s["length"],
        height=h,
        location=(half_w - wt / 2.0, 0.0, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(obj_leste, collection)
    apply_material_by_name(obj_leste, MatNames.PAREDE)
    log_object_created("ARQ_PAREDE_EXT_Leste", "Parede")
    objects.append(obj_leste)

    return objects


# =============================================================================
# PAREDES INTERNAS — DIVISÓRIAS ENTRE LOJAS
# =============================================================================

def create_store_dividers(collection: bpy.types.Collection) -> list:
    """
    Cria paredes divisórias entre lojas em ambos os lados do corredor.
    Cada divisória separa duas lojas adjacentes.

    Returns:
        Lista de objetos de parede divisória.
    """
    s = CONFIG["shopping"]
    st = CONFIG["stores"]
    corridor_half = CONFIG["corridor"]["width"] / 2.0

    store_depth = st["depth"]
    store_width = st["width"]
    div_t = st["wall_thickness"]
    store_h = s["height"]
    count = st["count_per_side"]
    start_y = DERIVED["store_start_y"]

    objects = []

    sides = [
        ("E", -(corridor_half + store_depth / 2.0)),   # Lado esquerdo — centro X
        ("D", +(corridor_half + store_depth / 2.0)),   # Lado direito — centro X
    ]

    for side_code, center_x in sides:
        # Número de divisórias = count - 1 (entre as lojas) + 2 (bordas externas)
        # Bordas externas já são as paredes Leste/Oeste — não recriar.
        # Criar apenas as divisórias internas: count - 1
        for i in range(count - 1):
            # Y da divisória: após a loja i
            div_y = start_y + (i + 1) * store_width + i * div_t + div_t / 2.0

            name = f"ARQ_PAREDE_INT_{side_code}{i+1:02d}_{side_code}{i+2:02d}"
            obj = create_box(
                name=name,
                width=store_depth,
                depth=div_t,
                height=store_h,
                location=(center_x, div_y, 0.0),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(obj, collection)
            apply_material_by_name(obj, MatNames.PAREDE)
            log_object_created(name, "Divisória")
            objects.append(obj)

    return objects


def create_store_back_walls(collection: bpy.types.Collection) -> list:
    """
    Cria as paredes de fundo de cada loja (paralelas ao corredor).
    Estas paredes separam o interior da loja do corredor de serviço / parede externa.

    Returns:
        Lista de objetos de parede de fundo.
    """
    s = CONFIG["shopping"]
    st = CONFIG["stores"]
    corridor_half = CONFIG["corridor"]["width"] / 2.0

    store_depth = st["depth"]
    store_width = st["width"]
    div_t = st["wall_thickness"]
    wt = s["wall_thickness"]
    half_w = DERIVED["half_width"]

    objects = []

    # Espessura da parede de fundo das lojas
    back_wall_t = 0.15

    # X da face de fundo das lojas (toca a parede externa)
    # Lado esquerdo: X = -(half_w - wt)
    # Lado direito:  X = +(half_w - wt)
    sides = [
        ("E", -(corridor_half + store_depth), -1),   # Lado esquerdo
        ("D", +(corridor_half + store_depth), +1),    # Lado direito
    ]

    start_y = DERIVED["store_start_y"]
    count = st["count_per_side"]

    for side_code, back_edge_x, sign in sides:
        # X do centro da parede de fundo
        # A parede de fundo vai de back_edge_x até back_edge_x ± back_wall_t
        wall_center_x = back_edge_x + sign * back_wall_t / 2.0

        # Uma parede de fundo contínua cobrindo todas as lojas do lado
        total_store_length = count * store_width + (count - 1) * div_t

        name = f"ARQ_PAREDE_FUNDO_{side_code}"
        obj = create_box(
            name=name,
            width=back_wall_t,
            depth=total_store_length,
            height=s["height"],
            location=(wall_center_x, start_y + total_store_length / 2.0, 0.0),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(obj, collection)
        apply_material_by_name(obj, MatNames.PAREDE)
        log_object_created(name, "Parede Fundo Lojas")
        objects.append(obj)

    return objects


def create_corridor_walls(collection: bpy.types.Collection) -> list:
    """
    Cria as paredes que delimitam o corredor central nas extremidades
    (onde não há lojas — frente/entrada e fundo/praça de alimentação).

    Returns:
        Lista de objetos.
    """
    # Esta função cria volumes de preenchimento onde o corredor encontra
    # a entrada e o fundo, fechando a caixa arquitetônica lateralmente.
    # Para o blockout inicial, as paredes externas já fazem este papel.
    # Retorna lista vazia — pode ser expandida nas fases posteriores.
    return []


# =============================================================================
# PONTO DE ENTRADA
# =============================================================================

def build_walls(collections: dict) -> dict:
    """
    Ponto de entrada principal do módulo.
    Cria todas as paredes do shopping.

    Args:
        collections: Dicionário de Collections retornado por scene_setup.

    Returns:
        Dicionário com listas de objetos por categoria.
    """
    log_section("Criando Paredes")

    col_ext = collections.get("PAREDES_EXTERNAS")
    col_int = collections.get("PAREDES_INTERNAS")

    if not col_ext:
        raise ValueError("Collection 'PAREDES_EXTERNAS' não encontrada.")
    if not col_int:
        raise ValueError("Collection 'PAREDES_INTERNAS' não encontrada.")

    result = {}

    # Paredes externas
    result["external"] = create_external_walls(col_ext)
    log_info(f"Paredes externas criadas: {len(result['external'])}")

    # Divisórias entre lojas
    if CONFIG["features"].get("stores", True):
        result["dividers"] = create_store_dividers(col_int)
        result["back_walls"] = create_store_back_walls(col_int)
        log_info(f"Divisórias criadas: {len(result['dividers'])}")
        log_info(f"Paredes de fundo criadas: {len(result['back_walls'])}")
    else:
        result["dividers"] = []
        result["back_walls"] = []

    total = sum(len(v) for v in result.values())
    log_section_end(f"Paredes ({total} objetos)")
    return result
