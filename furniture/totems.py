"""
furniture/totems.py — Totens Digitais Interativos / Diretório do Shopping

Gera:
  - 2 Totens digitais verticais com tela touch emissiva e moldura metálica
  - 1 Totem no hall do Térreo (Z=0.0m)
  - 1 Totem na galeria do Mezanino (Z=4.7m)
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name, set_object_rotation
from utils.logging import log_object_created, log_section, log_section_end
from materials import MatNames
from stores.signs import create_3d_text


def create_single_totem(name: str, location: tuple, collection: bpy.types.Collection) -> list:
    """Cria um totem digital interativo completo."""
    x, y, z = location
    objects = []

    # 1. Base metálica pesada
    base = create_box(
        name=f"{name}_Base",
        width=0.9,
        depth=0.5,
        height=0.08,
        location=(x, y, z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(base, collection)
    apply_material_by_name(base, MatNames.METAL)
    objects.append(base)

    # 2. Corpo do Totem (Pedestal vertical esguio)
    body = create_box(
        name=f"{name}_Corpo",
        width=0.75,
        depth=0.15,
        height=1.85,
        location=(x, y, z + 0.08),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(body, collection)
    apply_material_by_name(body, MatNames.FACHADA_LOJA)
    objects.append(body)

    frame = create_box(
        name=f"{name}_Moldura",
        width=0.66,
        depth=0.04,
        height=1.12,
        location=(x, y - 0.07, z + 0.62),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(frame, collection)
    apply_material_by_name(frame, MatNames.ALUMINIO)
    objects.append(frame)

    screen = create_box(
        name=f"{name}_Tela",
        width=0.58,
        depth=0.02,
        height=1.02,
        location=(x, y - 0.09, z + 0.66),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(screen, collection)
    apply_material_by_name(screen, MatNames.LED)
    objects.append(screen)

    # 4. Texto 3D "GUIA / MAPA"
    txt = create_3d_text(
        name=f"{name}_Texto",
        text="MAPA DO SHOPPING",
        location=(x, y - 0.09, z + 1.78),
        rotation_deg=(90.0, 0.0, 0.0),
        size=0.06,
        extrude=0.01,
        collection=collection,
    )
    apply_material_by_name(txt, MatNames.LETREIRO)
    objects.append(txt)

    return objects


def build_totems(collections: dict) -> list:
    """Cria os totens interativos de sinalização."""
    log_section("Criando Totens Digitais de Sinalização")

    col_totens = collections.get("TOTENS") or collections.get("04_MOBILIARIO") or list(collections.values())[0]

    mz = CONFIG.get("mezzanine", {})
    mz_floor_z = mz.get("floor_z", 4.7)

    totem_objs = []

    # Totem 1: Térreo (próximo à entrada)
    t1 = create_single_totem("MOB_TOTEM_Terreo", (0.0, -20.0, 0.0), col_totens)
    totem_objs.extend(t1)

    # Totem 2: Mezanino (próximo à circulação/praça)
    t2 = create_single_totem("MOB_TOTEM_Mezanino", (1.8, 14.0, mz_floor_z), col_totens)
    totem_objs.extend(t2)

    log_section_end(f"Totens Digitais ({len(totem_objs)} objetos)")
    return totem_objs
