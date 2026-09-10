"""
stores/signs.py — Letreiros 3D e Identidade Visual das Lojas

Cria letreiros com tipografia 3D real (bpy.data.curves font), marcas exclusivas,
paletas de cores emissivas individuais e painéis de suporte chanfrados.
"""

import bpy
import math
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name, set_object_rotation
from utils.logging import log_object_created, log_section, log_section_end
from materials import create_principled_material, MatNames


# Catálogo de Marcas Fictícias e Paletas de Cores Emissivas
STORE_BRANDS = [
    # Lado Esquerdo (E01 a E06)
    {"name": "AURA MODA",     "color": (1.0, 0.85, 0.70), "strength": 4.0}, # Warm Gold
    {"name": "BYTE TECH",     "color": (0.2, 0.80, 1.00), "strength": 5.0}, # Cyber Cyan
    {"name": "URBAN COFFEE",  "color": (1.0, 0.60, 0.20), "strength": 4.0}, # Amber
    {"name": "NEXUS GAMES",   "color": (0.8, 0.20, 1.00), "strength": 5.0}, # Neon Purple
    {"name": "LIVRARIA DOM",  "color": (1.0, 0.95, 0.85), "strength": 3.5}, # Soft White
    {"name": "OPTICA VISION", "color": (0.3, 1.00, 0.60), "strength": 4.5}, # Mint
    # Lado Direito (D01 a D06)
    {"name": "CHIC BOUTIQUE", "color": (1.0, 0.40, 0.60), "strength": 4.0}, # Rose
    {"name": "SOUND BEAT",    "color": (1.0, 0.20, 0.20), "strength": 4.5}, # Crimson Red
    {"name": "TERRA VERDE",   "color": (0.4, 0.90, 0.30), "strength": 4.0}, # Emerald
    {"name": "VITA PHARMA",   "color": (0.2, 0.60, 1.00), "strength": 4.0}, # Blue
    {"name": "JEWEL GOLD",    "color": (1.0, 0.90, 0.40), "strength": 5.0}, # Rich Gold
    {"name": "FAST BURGER",   "color": (1.0, 0.50, 0.10), "strength": 4.5}, # Orange
]


def create_3d_text(
    name: str,
    text: str,
    location: tuple,
    rotation_deg: tuple,
    size: float = 0.35,
    extrude: float = 0.04,
    bevel_depth: float = 0.005,
    collection: bpy.types.Collection = None,
) -> bpy.types.Object:
    """Cria um objeto de Texto 3D volumétrico real."""
    curve_data = bpy.data.curves.new(name=name, type='FONT')
    curve_data.body = text
    curve_data.size = size
    curve_data.extrude = extrude
    curve_data.bevel_depth = bevel_depth
    curve_data.align_x = 'CENTER'
    curve_data.align_y = 'CENTER'

    text_obj = bpy.data.objects.new(name=name, object_data=curve_data)
    text_obj.location = location
    set_object_rotation(text_obj, *rotation_deg, degrees=True)

    if collection:
        link_to_collection(text_obj, collection)

    return text_obj


def build_store_signs(collections: dict) -> list:
    """Cria os letreiros 3D e painéis de fachada para todas as lojas."""
    log_section("Criando Letreiros 3D e Identidade Visual das Lojas")

    col_letreiros = collections.get("LETREIROS")
    if not col_letreiros:
        raise ValueError("Collection 'LETREIROS' não encontrada.")

    st = CONFIG["stores"]
    corridor_half = CONFIG["corridor"]["width"] / 2.0
    store_width = st["width"]
    div_t = st["wall_thickness"]
    start_y = DERIVED["store_start_y"]
    count = st["count_per_side"]

    panel_w = store_width * 0.8
    panel_h = st.get("sign_height", 0.8)
    panel_t = 0.06
    sign_z = st["storefront_height"] + panel_h / 2.0 + 0.05

    created_objects = []
    brand_index = 0

    sides = [
        ("E", -corridor_half, 90.0),    # Lado esquerdo (olhando para +X)
        ("D", +corridor_half, -90.0),   # Lado direito (olhando para -X)
    ]

    for side_code, vitrine_x, rot_z in sides:
        for i in range(count):
            store_code = f"{side_code}{i+1:02d}"
            center_y = start_y + i * (store_width + div_t) + store_width / 2.0
            brand = STORE_BRANDS[brand_index % len(STORE_BRANDS)]
            brand_index += 1

            # 1. Painel de suporte do letreiro
            panel_name = f"DEC_PAINEL_{store_code}"
            panel_offset_x = (panel_t / 2.0) if side_code == "D" else (-panel_t / 2.0)
            panel = create_box(
                name=panel_name,
                width=panel_t,
                depth=panel_w,
                height=panel_h,
                location=(vitrine_x + panel_offset_x, center_y, sign_z - panel_h / 2.0),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(panel, col_letreiros)
            apply_material_by_name(panel, MatNames.FACHADA_LOJA)
            created_objects.append(panel)

            # 2. Material de emissão exclusivo da marca
            mat_name = f"MAT_EMISSION_{store_code}"
            brand_mat = create_principled_material(
                name=mat_name,
                color=(1.0, 1.0, 1.0, 1.0),
                emission=brand["color"],
                emission_strength=brand["strength"],
                roughness=0.2,
            )

            # 3. Letras 3D
            text_name = f"DEC_TEXTO3D_{store_code}"
            text_x = vitrine_x + (0.04 if side_code == "E" else -0.04)
            # No Blender font text: RotX=90 coloca em pé, RotZ alinha na face
            text_rot = (90.0, 0.0, rot_z)

            text_obj = create_3d_text(
                name=text_name,
                text=brand["name"],
                location=(text_x, center_y, sign_z),
                rotation_deg=text_rot,
                size=0.32,
                extrude=0.03,
                bevel_depth=0.004,
                collection=col_letreiros,
            )
            apply_material_by_name(text_obj, mat_name)
            log_object_created(text_name, f"Texto 3D [{brand['name']}]")
            created_objects.append(text_obj)

    log_section_end(f"Letreiros 3D ({len(created_objects)} elementos de identidade visual)")
    return created_objects
