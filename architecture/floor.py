"""
architecture/floor.py — Criação do piso principal do shopping

Gera:
  - Piso principal do corredor e áreas comuns (MAT_Piso_Shopping)
  - Piso da praça de alimentação (MAT_Piso_Praca) — cor diferenciada
  - Faixas opcionais de delimitação de corredor (futuro)

Convenção de eixos:
  X = largura do shopping (centro em X=0)
  Y = comprimento (Y negativo = frente/entrada, Y positivo = fundo)
  Z = altura (piso em Z=0)
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_info, log_object_created, log_section, log_section_end
from materials import MatNames


def create_main_floor(collection: bpy.types.Collection) -> bpy.types.Object:
    """
    Cria o piso principal cobrindo toda a área interna do shopping.

    O piso é um plano espesso (laje) que cobre de parede a parede,
    excluindo a espessura das paredes externas.

    Args:
        collection: Collection PISOS onde o objeto será inserido.

    Returns:
        O objeto de piso criado.
    """
    s = CONFIG["shopping"]

    # Dimensões internas (descontando paredes externas)
    floor_width = s["width"] - 2 * s["wall_thickness"]
    floor_length = s["length"] - 2 * s["wall_thickness"]
    floor_thickness = s["floor_thickness"]

    # O piso fica logo abaixo de Z=0, a superfície caminhável está em Z=0
    obj = create_box(
        name="ARQ_PISO_Principal",
        width=floor_width,
        depth=floor_length,
        height=floor_thickness,
        location=(0.0, 0.0, -floor_thickness),
        centered_xy=True,
        base_at_zero=True,
    )

    link_to_collection(obj, collection)
    apply_material_by_name(obj, MatNames.PISO_SHOPPING)
    log_object_created("ARQ_PISO_Principal", "Piso")
    return obj


def create_food_court_floor(collection: bpy.types.Collection) -> bpy.types.Object:
    """
    Cria o piso da praça de alimentação com material diferenciado.
    Fica sobre o piso principal (Z=0.001 para evitar z-fighting).

    Args:
        collection: Collection PISOS.

    Returns:
        O objeto de piso da praça criado.
    """
    s = CONFIG["shopping"]
    fc = CONFIG["food_court"]

    # Posição: fundo do shopping
    # Y máximo interno = half_length - wall_thickness
    back_y = DERIVED["half_length"] - s["wall_thickness"]
    # O piso da praça começa a uma distância do fundo
    depth = fc["depth"]
    width = fc["width"]

    # Centro em Y da praça de alimentação
    center_y = back_y - depth / 2.0 - fc["offset_from_back"]

    obj = create_box(
        name="ARQ_PISO_Praca",
        width=width,
        depth=depth,
        height=0.01,        # Fina camada sobre o piso principal
        location=(0.0, center_y, 0.001),
        centered_xy=True,
        base_at_zero=True,
    )

    link_to_collection(obj, collection)
    apply_material_by_name(obj, MatNames.PISO_PRACA)
    log_object_created("ARQ_PISO_Praca", "Piso Praça")
    return obj


def create_store_floors(
    collection: bpy.types.Collection,
    stores_collection: bpy.types.Collection,
) -> list:
    """
    Cria pisos individuais para cada loja com material próprio.
    Cada piso fica levemente acima do piso principal (Z=0.001).

    Os pisos das lojas são criados aqui de forma centralizada;
    o store_builder.py pode opcionalmente referenciar ou criar o seu próprio.

    Args:
        collection: Collection PISOS (arquitetura).
        stores_collection: Collection 02_LOJAS.

    Returns:
        Lista de objetos de piso das lojas.
    """
    s = CONFIG["shopping"]
    st = CONFIG["stores"]
    corridor_half = CONFIG["corridor"]["width"] / 2.0
    half_w = DERIVED["half_width"]
    wall_t = s["wall_thickness"]
    store_depth = st["depth"]

    floors = []

    # Calcular o Y de início das lojas
    start_y = DERIVED["store_start_y"]
    store_width = st["width"]
    div_t = st["wall_thickness"]

    # X dos dois lados
    # Lado esquerdo: lojas vão de -half_w+wall_t até -corridor_half
    # Lado direito: lojas vão de +corridor_half até +half_w-wall_t
    sides = [
        ("E", -(corridor_half + store_depth / 2.0)),   # Centro X lado esquerdo
        ("D", +(corridor_half + store_depth / 2.0)),   # Centro X lado direito
    ]

    for side_code, center_x in sides:
        for i in range(st["count_per_side"]):
            # Centro Y de cada loja
            center_y = start_y + i * (store_width + div_t) + store_width / 2.0

            name = f"LOJA_{side_code}{i+1:02d}_Piso"
            obj = create_box(
                name=name,
                width=store_depth,
                depth=store_width,
                height=0.01,
                location=(center_x, center_y, 0.001),
                centered_xy=True,
                base_at_zero=True,
            )

            link_to_collection(obj, collection)
            apply_material_by_name(obj, MatNames.PISO_LOJA)
            log_object_created(name, "Piso Loja")
            floors.append(obj)

    return floors


def build_floors(collections: dict) -> dict:
    """
    Ponto de entrada principal do módulo.
    Cria todos os pisos do shopping.

    Args:
        collections: Dicionário de Collections retornado por scene_setup.create_collections().

    Returns:
        Dicionário com os objetos criados: {"main": obj, "food_court": obj, "stores": [...]}
    """
    log_section("Criando Pisos")

    col_pisos = collections.get("PISOS")
    col_lojas = collections.get("02_LOJAS")

    if not col_pisos:
        raise ValueError("Collection 'PISOS' não encontrada. Execute create_collections() primeiro.")

    result = {}

    # Piso principal
    result["main"] = create_main_floor(col_pisos)

    # Piso da praça de alimentação
    result["food_court"] = create_food_court_floor(col_pisos)

    # Pisos das lojas
    if CONFIG["features"].get("stores", True) and col_lojas:
        result["stores"] = create_store_floors(col_pisos, col_lojas)
    else:
        result["stores"] = []

    log_section_end(f"Pisos ({1 + 1 + len(result['stores'])} objetos)")
    return result
