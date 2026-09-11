"""
stores/signs.py — Letreiros 3D e Identidade Visual das Lojas (22 Marcas Reais)

Cria letreiros com tipografia 3D real (bpy.data.curves font), marcas oficiais,
paletas de cores emissivas individuais e painéis de suporte chanfrados para
todas as 22 lojas do térreo e mezanino.
"""

import bpy
from config import CONFIG, DERIVED
from utils.geometry import create_box
from utils.helpers import link_to_collection, apply_material_by_name, set_object_rotation
from utils.logging import log_object_created, log_section, log_section_end
from materials import create_principled_material, MatNames


# Catálogo das 22 Marcas Reais Selecionadas da Lista
STORE_BRANDS_MAP = {
    # -------------------------------------------------------------------------
    # TÉRREO ESQUERDO (E01 a E06)
    # -------------------------------------------------------------------------
    "E01": {"name": "ADIDAS",          "color": (0.20, 0.80, 1.00), "strength": 5.0}, # Cyber Cyan
    "E02": {"name": "AREZZO",           "color": (1.00, 0.60, 0.75), "strength": 4.5}, # Rose Gold
    "E03": {"name": "CALVIN KLEIN",     "color": (1.00, 1.00, 1.00), "strength": 4.5}, # Branco Puro
    "E04": {"name": "NATURA",           "color": (1.00, 0.60, 0.20), "strength": 4.5}, # Laranja Dourado
    "E05": {"name": "CENTAURO",         "color": (1.00, 0.20, 0.20), "strength": 5.0}, # Vermelho
    "E06": {"name": "CHILLI BEANS",     "color": (1.00, 0.80, 0.00), "strength": 5.0}, # Amarelo Quente

    # -------------------------------------------------------------------------
    # TÉRREO DIREITO (D01 a D06)
    # -------------------------------------------------------------------------
    "D01": {"name": "C&A",              "color": (0.20, 0.40, 1.00), "strength": 5.0}, # Azul Royal
    "D02": {"name": "ANACAPRI",         "color": (1.00, 0.88, 0.70), "strength": 4.0}, # Dourado Suave
    "D03": {"name": "MAHOGANY",         "color": (1.00, 0.40, 0.70), "strength": 4.5}, # Magenta Suave
    "D04": {"name": "CASA DAS ALIANÇAS","color": (1.00, 0.85, 0.25), "strength": 5.0}, # Ouro 18k
    "D05": {"name": "REALME",           "color": (1.00, 0.92, 0.20), "strength": 5.0}, # Amarelo Neon
    "D06": {"name": "SESTINI",          "color": (0.20, 1.00, 0.60), "strength": 4.5}, # Mint Green

    # -------------------------------------------------------------------------
    # MEZANINO ESQUERDO (ME01 a ME05)
    # -------------------------------------------------------------------------
    "ME01": {"name": "BURGER KING",     "color": (1.00, 0.35, 0.10), "strength": 5.0}, # Laranja Chama
    "ME02": {"name": "CACAU SHOW",      "color": (1.00, 0.75, 0.20), "strength": 4.5}, # Warm Gold
    "ME03": {"name": "BACIO DI LATTE",  "color": (1.00, 0.96, 0.88), "strength": 4.0}, # Creme Claro
    "ME04": {"name": "SMART FIT",       "color": (1.00, 0.84, 0.00), "strength": 5.0}, # Amarelo Vibrante
    "ME05": {"name": "YOUCOM",          "color": (0.67, 0.28, 0.74), "strength": 4.5}, # Roxo Neon

    # -------------------------------------------------------------------------
    # MEZANINO DIREITO (MD01 a MD05)
    # -------------------------------------------------------------------------
    "MD01": {"name": "AMOR AOS PEDAÇOS","color": (0.96, 0.56, 0.69), "strength": 4.5}, # Rosa Confeitaria
    "MD02": {"name": "AMERICAN COOKIES","color": (1.00, 0.65, 0.15), "strength": 4.5}, # Âmbar Quente
    "MD03": {"name": "SANTA LOLLA",     "color": (0.91, 0.12, 0.39), "strength": 4.5}, # Vermelho Rubi
    "MD04": {"name": "ARTWALK",         "color": (0.00, 0.90, 1.00), "strength": 5.0}, # Azul Ciano
    "MD05": {"name": "CARTER'S",        "color": (0.50, 0.83, 0.98), "strength": 4.0}, # Azul Bebê
}


def create_3d_text(
    name: str,
    text: str,
    location: tuple,
    rotation_deg: tuple,
    size: float = 0.28,
    extrude: float = 0.04,
    bevel_depth: float = 0.004,
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
    """Cria os letreiros 3D e painéis de fachada para todas as 22 lojas reais."""
    log_section("Criando Letreiros 3D e Identidade Visual (22 Lojas Reais)")

    col_letreiros = collections.get("LETREIROS") or collections.get("05_DECORACAO")
    if not col_letreiros:
        raise ValueError("Collection 'LETREIROS' não encontrada.")

    st = CONFIG["stores"]
    mz = CONFIG.get("mezzanine", {})
    corridor_half = CONFIG["corridor"]["width"] / 2.0
    store_width = st["width"]
    div_t = st["wall_thickness"]
    start_y = DERIVED["store_start_y"]

    count_ground = st["count_per_side"]
    count_mz = mz.get("count_per_side", 5)

    panel_w = store_width * 0.85
    panel_h = st.get("sign_height", 0.8)
    panel_t = 0.06

    created_objects = []

    # 1. Letreiros do Térreo (E01 a E06, D01 a D06)
    sign_z_ground = st["storefront_height"] + panel_h / 2.0 + 0.05
    for side_code, vitrine_x, rot_z in [("E", -corridor_half, 90.0), ("D", +corridor_half, -90.0)]:
        for i in range(count_ground):
            store_code = f"{side_code}{i+1:02d}"
            center_y = start_y + i * (store_width + div_t) + store_width / 2.0
            brand = STORE_BRANDS_MAP.get(store_code, {"name": store_code, "color": (1.0, 1.0, 1.0), "strength": 4.0})

            # Painel suporte
            panel_name = f"DEC_PAINEL_{store_code}"
            panel_offset_x = (panel_t / 2.0) if side_code == "D" else (-panel_t / 2.0)
            panel = create_box(
                name=panel_name,
                width=panel_t,
                depth=panel_w,
                height=panel_h,
                location=(vitrine_x + panel_offset_x, center_y, sign_z_ground - panel_h / 2.0),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(panel, col_letreiros)
            apply_material_by_name(panel, MatNames.FACHADA_LOJA)
            created_objects.append(panel)

            # Material emissivo
            mat_name = f"MAT_EMISSION_{store_code}"
            create_principled_material(
                name=mat_name,
                color=(1.0, 1.0, 1.0, 1.0),
                emission=brand["color"],
                emission_strength=brand["strength"],
                roughness=0.2,
            )

            # Letras 3D
            text_name = f"DEC_TEXTO3D_{store_code}"
            text_x = vitrine_x + (0.04 if side_code == "E" else -0.04)
            text_rot = (90.0, 0.0, rot_z)

            # Ajuste de tamanho para nomes longos
            text_size = 0.24 if len(brand["name"]) > 10 else 0.28

            text_obj = create_3d_text(
                name=text_name,
                text=brand["name"],
                location=(text_x, center_y, sign_z_ground),
                rotation_deg=text_rot,
                size=text_size,
                extrude=0.035,
                bevel_depth=0.003,
                collection=col_letreiros,
            )
            apply_material_by_name(text_obj, mat_name)
            log_object_created(text_name, f"Texto 3D [{brand['name']}]")
            created_objects.append(text_obj)

    # 2. Letreiros do Mezanino (ME01 a ME05, MD01 a MD05)
    mz_floor_z = mz.get("floor_z", 4.7)
    sign_z_mz = mz_floor_z + st["storefront_height"] + panel_h / 2.0 + 0.05
    for side_code, vitrine_x, rot_z in [("E", -corridor_half, 90.0), ("D", +corridor_half, -90.0)]:
        for i in range(count_mz):
            store_code = f"M{side_code}{i+1:02d}"
            center_y = start_y + i * (store_width + div_t) + store_width / 2.0
            brand = STORE_BRANDS_MAP.get(store_code, {"name": store_code, "color": (1.0, 1.0, 1.0), "strength": 4.0})

            # Painel suporte
            panel_name = f"DEC_PAINEL_{store_code}"
            panel_offset_x = (panel_t / 2.0) if side_code == "D" else (-panel_t / 2.0)
            panel = create_box(
                name=panel_name,
                width=panel_t,
                depth=panel_w,
                height=panel_h,
                location=(vitrine_x + panel_offset_x, center_y, sign_z_mz - panel_h / 2.0),
                centered_xy=True,
                base_at_zero=True,
            )
            link_to_collection(panel, col_letreiros)
            apply_material_by_name(panel, MatNames.FACHADA_LOJA)
            created_objects.append(panel)

            # Material emissivo
            mat_name = f"MAT_EMISSION_{store_code}"
            create_principled_material(
                name=mat_name,
                color=(1.0, 1.0, 1.0, 1.0),
                emission=brand["color"],
                emission_strength=brand["strength"],
                roughness=0.2,
            )

            # Letras 3D
            text_name = f"DEC_TEXTO3D_{store_code}"
            text_x = vitrine_x + (0.04 if side_code == "E" else -0.04)
            text_rot = (90.0, 0.0, rot_z)

            text_size = 0.24 if len(brand["name"]) > 10 else 0.28

            text_obj = create_3d_text(
                name=text_name,
                text=brand["name"],
                location=(text_x, center_y, sign_z_mz),
                rotation_deg=text_rot,
                size=text_size,
                extrude=0.035,
                bevel_depth=0.003,
                collection=col_letreiros,
            )
            apply_material_by_name(text_obj, mat_name)
            log_object_created(text_name, f"Texto 3D [{brand['name']}]")
            created_objects.append(text_obj)

    log_section_end(f"Letreiros 3D ({len(created_objects)} elementos criados com sucesso)")
    return created_objects
