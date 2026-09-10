"""
areas/restrooms.py — Sanitários do shopping

Cria bloco de sanitários posicionado no fundo esquerdo do shopping:
  - Bloco externo (paredes)
  - Divisória interna (masculino/feminino)
  - Portas de cada sanitário
  - Placa indicativa simplificada
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name
from utils.logging import log_object_created, log_section, log_section_end
from materials import MatNames


def _get_restroom_origin() -> tuple:
    """
    Calcula a posição de origem (canto inferior-esquerdo) do bloco de sanitários.
    Posicionado no fundo esquerdo do shopping.

    Returns:
        (origin_x, origin_y) — canto frontal-esquerdo do bloco.
    """
    rr = CONFIG["restrooms"]
    s = CONFIG["shopping"]
    half_l = DERIVED["half_length"]
    half_w = DERIVED["half_width"]
    wt = s["wall_thickness"]

    # Lado esquerdo interno
    origin_x = -half_w + wt
    # Fundo interno, recuado pelo offset
    origin_y = half_l - wt - rr["depth"] - rr["position_offset_y"]

    return (origin_x, origin_y)


def create_restroom_walls(collection: bpy.types.Collection) -> list:
    """
    Cria as paredes externas do bloco de sanitários.
    As paredes externas já são as paredes do shopping —
    aqui criamos apenas as paredes internas do bloco.

    Returns:
        Lista de objetos criados.
    """
    rr = CONFIG["restrooms"]
    s = CONFIG["shopping"]
    wt = s["wall_thickness"]
    rr_wt = rr["wall_thickness"]
    height = s["height"]

    ox, oy = _get_restroom_origin()
    rr_w = rr["width"]
    rr_d = rr["depth"]

    objects = []

    # Parede frontal do bloco (separa sanitários do corredor)
    front_wall = create_box(
        name="AREA_WC_Parede_Frontal",
        width=rr_w,
        depth=rr_wt,
        height=height,
        location=(ox + rr_w / 2.0, oy, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(front_wall, collection)
    apply_material_by_name(front_wall, MatNames.PAREDE)
    log_object_created("AREA_WC_Parede_Frontal", "Parede WC")
    objects.append(front_wall)

    # Parede divisória central (entre masculino e feminino)
    div_wall = create_box(
        name="AREA_WC_Divisoria",
        width=rr_wt,
        depth=rr_d,
        height=height,
        location=(ox + rr_w / 2.0, oy + rr_d / 2.0, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(div_wall, collection)
    apply_material_by_name(div_wall, MatNames.PAREDE)
    log_object_created("AREA_WC_Divisoria", "Divisória WC")
    objects.append(div_wall)

    # Parede direita (separa sanitários da área de escada/circulação)
    right_wall = create_box(
        name="AREA_WC_Parede_Dir",
        width=rr_wt,
        depth=rr_d,
        height=height,
        location=(ox + rr_w, oy + rr_d / 2.0, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(right_wall, collection)
    apply_material_by_name(right_wall, MatNames.PAREDE)
    log_object_created("AREA_WC_Parede_Dir", "Parede WC")
    objects.append(right_wall)

    return objects


def create_restroom_doors(collection: bpy.types.Collection) -> list:
    """
    Cria as portas dos sanitários (masculino e feminino).

    Returns:
        Lista com 2 objetos de porta.
    """
    rr = CONFIG["restrooms"]
    s = CONFIG["shopping"]
    height = s["height"]

    ox, oy = _get_restroom_origin()
    rr_w = rr["width"]
    rr_d = rr["depth"]
    door_w = rr["door_width"]
    door_h = rr["door_height"]
    door_t = 0.05

    objects = []

    # Porta do sanitário masculino (lado esquerdo — X menor)
    door_m = create_box(
        name="AREA_WC_Porta_Masc",
        width=door_t,
        depth=door_w,
        height=door_h,
        location=(ox + door_t, oy + rr_w / 4.0, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(door_m, collection)
    apply_material_by_name(door_m, MatNames.PORTA)
    log_object_created("AREA_WC_Porta_Masc", "Porta WC")
    objects.append(door_m)

    # Porta do sanitário feminino (lado direito — X maior)
    door_f = create_box(
        name="AREA_WC_Porta_Fem",
        width=door_t,
        depth=door_w,
        height=door_h,
        location=(ox + door_t, oy + 3 * rr_w / 4.0, 0.0),
        centered_xy=True,
        base_at_zero=True,
    )
    link_to_collection(door_f, collection)
    apply_material_by_name(door_f, MatNames.PORTA)
    log_object_created("AREA_WC_Porta_Fem", "Porta WC")
    objects.append(door_f)

    return objects


def create_restroom_signs(collection: bpy.types.Collection) -> list:
    """
    Cria placas indicativas simplificadas (M e F) acima das portas.
    São boxes finos com material de letreiro.

    Returns:
        Lista com 2 objetos de placa.
    """
    ox, oy = _get_restroom_origin()
    rr = CONFIG["restrooms"]
    s = CONFIG["shopping"]
    sign_h = 0.3
    sign_w = 0.4
    sign_t = 0.05
    z_sign = s["height"] - sign_h - 0.2  # Próximo ao teto

    objects = []

    for label, y_pos in [("M", oy + rr["width"] / 4.0),
                          ("F", oy + 3 * rr["width"] / 4.0)]:
        name = f"AREA_WC_Placa_{label}"
        obj = create_box(
            name=name,
            width=sign_t,
            depth=sign_w,
            height=sign_h,
            location=(ox + sign_t, y_pos, z_sign),
            centered_xy=True,
            base_at_zero=True,
        )
        link_to_collection(obj, collection)
        apply_material_by_name(obj, MatNames.LETREIRO)
        log_object_created(name, "Placa WC")
        objects.append(obj)

    return objects


def build_restrooms(collections: dict) -> dict:
    """Ponto de entrada principal do módulo."""
    log_section("Criando Sanitários")

    col_wc = collections.get("SANITARIOS")
    if not col_wc:
        raise ValueError("Collection 'SANITARIOS' não encontrada.")

    result = {
        "walls": create_restroom_walls(col_wc),
        "doors": create_restroom_doors(col_wc),
        "signs": create_restroom_signs(col_wc),
    }

    total = sum(len(v) for v in result.values())
    log_section_end(f"Sanitários ({total} objetos)")
    return result
