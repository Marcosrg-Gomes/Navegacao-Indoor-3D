"""
furniture/totems.py — Totens Digitais Interativos / Diretório do Shopping

Gera:
  - 2 Totens digitais verticais com bordas chanfradas e recuo da tela
  - Moldura chanfrada em alumínio e tela touch emissiva com grelha de mapa
  - 1 Totem no hall do Térreo (Z=0.0m)
  - 1 Totem na galeria do Mezanino (Z=4.7m)
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box, create_cylinder, create_rounded_box
from utils.helpers import link_to_collection, apply_material_by_name, set_object_rotation
from utils.logging import log_object_created, log_section, log_section_end
from materials import MatNames
from stores.signs import create_3d_text


def create_single_totem(name: str, location: tuple, collection: bpy.types.Collection) -> list:
    """Cria um totem digital interativo completo com chanfro, recuo e grelha."""
    x, y, z = location
    objects = []

    # 1. Base metálica chanfrada
    base = create_rounded_box(
        name=f"{name}_Base",
        width=0.92,
        depth=0.52,
        height=0.08,
        bevel_radius=0.015,
        location=(x, y, z),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(base, collection)
    apply_material_by_name(base, MatNames.METAL)
    objects.append(base)

    # 2. Corpo do Totem chanfrado
    body = create_rounded_box(
        name=f"{name}_Corpo",
        width=0.76,
        depth=0.16,
        height=1.85,
        bevel_radius=0.02,
        location=(x, y, z + 0.08),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(body, collection)
    apply_material_by_name(body, MatNames.FACHADA_LOJA)
    objects.append(body)

    # 3. Recuo / nicho da tela (recess)
    nicho = create_box(
        name=f"{name}_Nicho",
        width=0.68,
        depth=0.02,
        height=1.20,
        location=(x, y - 0.075, z + 0.58),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(nicho, collection)
    apply_material_by_name(nicho, MatNames.FACHADA_LOJA)
    objects.append(nicho)

    # 4. Moldura de alumínio ao redor da tela
    frame = create_rounded_box(
        name=f"{name}_Moldura",
        width=0.64,
        depth=0.03,
        height=1.14,
        bevel_radius=0.008,
        location=(x, y - 0.08, z + 0.61),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(frame, collection)
    apply_material_by_name(frame, MatNames.ALUMINIO)
    objects.append(frame)

    # 5. Tela touch emissiva
    screen = create_box(
        name=f"{name}_Tela",
        width=0.58,
        depth=0.01,
        height=1.04,
        location=(x, y - 0.09, z + 0.66),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(screen, collection)
    apply_material_by_name(screen, MatNames.LED)
    objects.append(screen)

    # 6. Grelha visual de mapa (divisores de piso / lojas na tela)
    for gi in (0.92, 1.18, 1.44):
        grid_line = create_box(
            name=f"{name}_Grelha_{int(gi*100)}",
            width=0.50,
            depth=0.005,
            height=0.008,
            location=(x, y - 0.096, z + gi),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(grid_line, collection)
        apply_material_by_name(grid_line, MatNames.ALUMINIO)
        objects.append(grid_line)

    # 7. Leitor / sensor na base da tela
    reader = create_cylinder(
        name=f"{name}_Sensor",
        radius=0.025,
        height=0.04,
        segments=12,
        location=(x, y - 0.085, z + 0.52),
        base_at_zero=True,
    )
    link_to_collection(reader, collection)
    apply_material_by_name(reader, MatNames.ALUMINIO)
    objects.append(reader)

    # 8. Texto 3D "MAPA DO SHOPPING"
    txt = create_3d_text(
        name=f"{name}_Texto",
        text="MAPA DO SHOPPING",
        location=(x, y - 0.09, z + 1.78),
        rotation_deg=(90.0, 0.0, 0.0),
        size=0.055,
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
