"""
architecture/entrance.py — Criação da entrada principal do shopping

Gera:
  - Hall de entrada (piso e estrutura)
  - Marquise externa
  - Colunas decorativas da entrada
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_cylinder
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_object_created, log_section, log_section_end
from materials import MatNames


def create_entrance_canopy(collection: bpy.types.Collection) -> bpy.types.Object:
    """
    Cria a marquise externa acima da entrada.
    Posicionada na frente da parede sul, acima da abertura.

    Args:
        collection: Collection ENTRADA.

    Returns:
        Objeto da marquise.
    """
    s = CONFIG["shopping"]
    ent = CONFIG["entrance"]
    half_l = DERIVED["half_length"]
    wt = s["wall_thickness"]

    obj = create_box(
        name="ARQ_ENTRADA_Marquise",
        width=ent["width"] + 2.0,            # Mais larga que a abertura
        depth=ent["canopy_depth"],
        height=ent["canopy_height"],
        location=(0.0, -half_l - ent["canopy_depth"] / 2.0, ent["height"]),
        centered_xy=True,
        base_at_zero=True,
    )

    link_to_collection(obj, collection)
    apply_material_by_name(obj, MatNames.METAL)
    log_object_created("ARQ_ENTRADA_Marquise", "Marquise")
    return obj


def create_entrance_columns(collection: bpy.types.Collection) -> list:
    """
    Cria 2 colunas decorativas flanqueando a entrada.

    Returns:
        Lista com os 2 objetos de coluna.
    """
    ent = CONFIG["entrance"]
    s = CONFIG["shopping"]
    half_l = DERIVED["half_length"]
    col_height = ent["height"]
    col_radius = 0.2
    offset_x = ent["width"] / 2.0 + 0.4   # Ligeiramente além da borda da abertura

    objects = []
    for side, x in [("Esq", -offset_x), ("Dir", offset_x)]:
        name = f"ARQ_ENTRADA_Coluna_{side}"
        obj = create_cylinder(
            name=name,
            radius=col_radius,
            height=col_height,
            segments=12,
            location=(x, -half_l, 0.0),
            base_at_zero=True,
        )
        link_to_collection(obj, collection)
        apply_material_by_name(obj, MatNames.METAL)
        log_object_created(name, "Coluna Entrada")
        objects.append(obj)

    return objects


def create_entrance_floor(collection: bpy.types.Collection) -> bpy.types.Object:
    """
    Cria o piso do hall de entrada (dentro do shopping, na área da abertura).

    Returns:
        Objeto do piso da entrada.
    """
    ent = CONFIG["entrance"]
    s = CONFIG["shopping"]
    half_l = DERIVED["half_length"]
    wt = s["wall_thickness"]

    obj = create_box(
        name="ARQ_ENTRADA_Piso",
        width=ent["width"],
        depth=ent["depth"],
        height=0.01,
        location=(0.0, -half_l + wt + ent["depth"] / 2.0, 0.001),
        centered_xy=True,
        base_at_zero=True,
    )

    link_to_collection(obj, collection)
    apply_material_by_name(obj, MatNames.PISO_SHOPPING)
    log_object_created("ARQ_ENTRADA_Piso", "Piso Entrada")
    return obj


def build_entrance(collections: dict) -> dict:
    """Ponto de entrada principal do módulo."""
    log_section("Criando Entrada Principal")

    col_entrada = collections.get("ENTRADA")
    if not col_entrada:
        raise ValueError("Collection 'ENTRADA' não encontrada.")

    result = {
        "canopy": create_entrance_canopy(col_entrada),
        "columns": create_entrance_columns(col_entrada),
        "floor": create_entrance_floor(col_entrada),
    }

    log_section_end("Entrada Principal")
    return result
