"""
furniture/bins.py — Lixeiras do shopping

Cria lixeiras cilíndricas modernas e distribui ao longo do corredor.
Usa instâncias vinculadas (linked duplicates) para otimização de memória.
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_cylinder
from utils.helpers import link_to_collection, apply_material_by_name, create_linked_instance
from utils.logging import log_object_created, log_section, log_section_end
from materials import MatNames


def build_bins(collections: dict) -> list:
    """Cria e distribui lixeiras no corredor."""
    log_section("Criando Lixeiras")

    col_lixeiras = collections.get("LIXEIRAS")
    if not col_lixeiras:
        raise ValueError("Collection 'LIXEIRAS' não encontrada.")

    f_cfg = CONFIG["furniture"]
    count = f_cfg.get("bin_count", 8)
    radius = f_cfg.get("bin_radius", 0.2)
    height = f_cfg.get("bin_height", 0.9)
    corridor_half = CONFIG["corridor"]["width"] / 2.0

    half_l = DERIVED["half_length"]
    start_y = -half_l + 8.0
    end_y = half_l - 12.0
    step_y = (end_y - start_y) / max((count // 2) - 1, 1)

    # Protótipo
    proto = create_cylinder(
        name="MOB_LIXEIRA_01",
        radius=radius,
        height=height,
        segments=16,
        location=(-corridor_half + 0.5, start_y, 0.0),
        base_at_zero=True,
    )
    apply_material_by_name(proto, MatNames.LIXEIRA)
    link_to_collection(proto, col_lixeiras)
    log_object_created(proto.name, "Lixeira (Protótipo)")

    bins = [proto]

    # Gerar pares em ambos os lados do corredor
    idx = 2
    for i in range(count // 2):
        y_pos = start_y + i * step_y
        for side, side_x in [("E", -corridor_half + 0.5), ("D", corridor_half - 0.5)]:
            if idx == 2 and side == "E":
                continue # Já é o protótipo
            name = f"MOB_LIXEIRA_{idx:02d}"
            inst = create_linked_instance(
                source_obj=proto,
                name=name,
                location=(side_x, y_pos, 0.0),
                collection=col_lixeiras,
            )
            log_object_created(name, "Lixeira (Instância)")
            bins.append(inst)
            idx += 1

    log_section_end(f"Lixeiras ({len(bins)} distribuídas)")
    return bins
