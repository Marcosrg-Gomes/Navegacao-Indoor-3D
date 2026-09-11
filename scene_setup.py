"""
scene_setup.py — Configuração e limpeza da cena

Responsabilidades:
  1. Criar a hierarquia de Collections do projeto.
  2. Limpar apenas os objetos e Collections do projeto (sem tocar em externos).
  3. Configurar unidades e engine de renderização.
  4. Configurar o mundo (World) com iluminação ambiente.
"""

import bpy
from utils.logging import log_info, log_warning, log_section, log_section_end, log_collection_created
from utils.helpers import get_or_create_collection, get_collection_all_objects


# =============================================================================
# HIERARQUIA DE COLLECTIONS
# Nomes oficiais de todas as Collections do projeto.
# =============================================================================

ROOT_COLLECTION = "MINI_SHOPPING"

COLLECTION_TREE = {
    "01_ARQUITETURA": {
        "children": ["PISOS", "PAREDES_EXTERNAS", "PAREDES_INTERNAS", "TETO", "ENTRADA", "ESCADAS", "MEZANINO", "GUARDACORPOS"],
    },
    "02_LOJAS": {
        "children": [],  # Sub-collections criadas dinamicamente por store_builder.py
    },
    "03_AREAS": {
        "children": ["PRACA_ALIMENTACAO", "SANITARIOS"],
    },
    "04_MOBILIARIO": {
        "children": ["BANCOS", "LIXEIRAS", "VASOS", "MESAS", "QUIOSQUES", "TOTENS"],
    },
    "05_DECORACAO": {
        "children": ["LETREIROS", "SINALIZACAO", "PLANTAS", "PENDENTES"],
    },
    "06_ILUMINACAO": {
        "children": ["LUZ_GERAL", "LUZ_LOJAS"],
    },
    "07_CIRCULACAO_VERTICAL": {
        "children": ["ESCADAS_ROLANTES", "ELEVADOR", "ESCADA_MONUMENTAL"],
    },
    "08_CAMERAS": {
        "children": [],
    },
}


# =============================================================================
# FUNÇÕES PRINCIPAIS
# =============================================================================

def create_collections() -> dict:
    """
    Cria toda a hierarquia de Collections do projeto.

    Returns:
        Dicionário com todos os objetos Collection indexados pelo nome.
        Exemplo: {"MINI_SHOPPING": col, "PISOS": col, "PAREDES_EXTERNAS": col, ...}
    """
    log_section("Criando hierarquia de Collections")

    # Garantir que a cena existe
    if not bpy.context.scene:
        raise RuntimeError("Nenhuma cena ativa encontrada no Blender.")

    registry = {}

    # Criar Collection raiz
    root = get_or_create_collection(ROOT_COLLECTION)
    registry[ROOT_COLLECTION] = root
    log_collection_created(ROOT_COLLECTION)

    # Criar Collections filhas
    for parent_name, data in COLLECTION_TREE.items():
        parent_col = get_or_create_collection(parent_name, parent=root)
        registry[parent_name] = parent_col
        log_collection_created(f"  {parent_name}")

        for child_name in data.get("children", []):
            child_col = get_or_create_collection(child_name, parent=parent_col)
            registry[child_name] = child_col
            log_collection_created(f"    {child_name}")

    log_section_end("Hierarquia de Collections")
    return registry


def get_collection_registry() -> dict:
    """
    Retorna o dicionário de Collections existentes (sem criar novas).
    Útil para módulos que precisam acessar Collections já criadas.

    Returns:
        Dicionário {nome: Collection} para todas as Collections do projeto.
        Se uma Collection não existir, não é incluída no dicionário.
    """
    registry = {}
    all_names = [ROOT_COLLECTION] + list(COLLECTION_TREE.keys())

    for parent_name, data in COLLECTION_TREE.items():
        all_names.extend(data.get("children", []))

    for name in all_names:
        col = bpy.data.collections.get(name)
        if col:
            registry[name] = col

    return registry


def cleanup_project(confirm: bool = True) -> int:
    """
    Remove todos os objetos e Collections pertencentes ao projeto.
    NÃO toca em objetos ou Collections fora do projeto.

    Args:
        confirm: Se False, pula a limpeza (segurança). Deve ser True explicitamente.

    Returns:
        Número de objetos removidos.
    """
    if not confirm:
        log_warning("cleanup_project() chamado sem confirmação. Nenhum objeto removido.")
        return 0

    log_section("Limpando cena do projeto")

    removed_objects = 0
    removed_collections = 0

    root = bpy.data.collections.get(ROOT_COLLECTION)
    if not root:
        log_info("Nenhuma Collection do projeto encontrada. Cena já está limpa.")
        return 0

    # Coletar todos os objetos dentro do projeto
    all_project_objects = get_collection_all_objects(root, recursive=True)

    # Remover objetos
    for obj in all_project_objects:
        bpy.data.objects.remove(obj, do_unlink=True)
        removed_objects += 1

    log_info(f"Objetos removidos: {removed_objects}")

    # Remover Collections de dentro para fora (sub-collections primeiro)
    def remove_collection_recursive(col):
        nonlocal removed_collections
        for child in list(col.children):
            remove_collection_recursive(child)
        bpy.data.collections.remove(col)
        removed_collections += 1

    remove_collection_recursive(root)
    log_info(f"Collections removidas: {removed_collections}")

    # Limpar meshes órfãos gerados pelo projeto
    orphan_meshes = [m for m in bpy.data.meshes if m.users == 0]
    for mesh in orphan_meshes:
        bpy.data.meshes.remove(mesh)
    log_info(f"Meshes órfãos removidos: {len(orphan_meshes)}")

    # Limpar luzes órfãs
    orphan_lights = [l for l in bpy.data.lights if l.users == 0]
    for light in orphan_lights:
        bpy.data.lights.remove(light)

    # Limpar câmeras órfãs
    orphan_cameras = [c for c in bpy.data.cameras if c.users == 0]
    for cam in orphan_cameras:
        bpy.data.cameras.remove(cam)

    log_section_end("Limpeza")
    return removed_objects


def setup_scene() -> None:
    """
    Configura as definições básicas da cena:
    - Sistema de unidades (métrico, metros)
    - Engine de renderização (Eevee / Eevee Next)
    - Ativação de Ambient Occlusion e Reflexos
    - Resolução 1080p
    """
    log_section("Configurando cena e render")

    scene = bpy.context.scene

    # --- Unidades ---
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    scene.unit_settings.length_unit = 'METERS'

    # --- Engine de renderização ---
    engine_set = False
    for engine in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            scene.render.engine = engine
            engine_set = True
            log_info(f"Render Engine: {engine}")
            break
        except Exception:
            continue

    if not engine_set:
        try:
            scene.render.engine = 'CYCLES'
            log_info("Render Engine: CYCLES")
        except Exception:
            pass

    # --- Configurações EEVEE (AO, Bloom, Shadows, Raytracing) ---
    eevee = getattr(scene, "eevee", None)
    if eevee:
        if hasattr(eevee, "use_ambient_occlusion"):
            eevee.use_ambient_occlusion = True
            eevee.ao_distance = 3.0
            eevee.ao_factor = 1.2
        if hasattr(eevee, "use_ssr"):
            eevee.use_ssr = True
            eevee.use_ssr_refraction = True
        if hasattr(eevee, "use_bloom"):
            eevee.use_bloom = True
        if hasattr(eevee, "use_raytracing"): # Blender 4.2+
            eevee.use_raytracing = True

    # --- Resolução de render ---
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100

    # --- Remover objetos padrão do Blender ---
    default_names = {"Cube", "Light", "Camera"}
    for name in default_names:
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)

    log_section_end("Configuração de cena")


def switch_viewport_to_rendered(mode: str = 'RENDERED', to_camera: bool = True) -> None:
    """
    Muda automaticamente o modo de exibição (Shading) de todas as 3D Viewports abertas
    para 'RENDERED' ou 'MATERIAL' e coloca a visão na câmera principal.
    """
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == 'VIEW_3D':
                for space in area.spaces:
                    if space.type == 'VIEW_3D':
                        space.shading.type = mode
                        if to_camera and hasattr(space, "region_3d") and space.region_3d:
                            space.region_3d.view_perspective = 'CAMERA'
                        log_info(f"Viewport 3D alterado para: {mode} (Visão da Câmera)")




def setup_world(world_color: tuple = (0.9, 0.9, 1.0), strength: float = 0.8, use_physical_sky: bool = True) -> None:
    """
    Configura o World do Blender com Céu Físico Nishita ou luz ambiente suave.
    Permite iluminação natural zenital realista através da claraboia do shopping.
    """
    log_info("Configurando World (Céu Físico Nishita / Iluminação Externa)...")

    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world

    world.use_nodes = True
    node_tree = world.node_tree
    nodes = node_tree.nodes
    nodes.clear()

    output_node = nodes.new(type='ShaderNodeOutputWorld')
    output_node.location = (400, 0)

    bg_node = nodes.new(type='ShaderNodeBackground')
    bg_node.location = (150, 0)
    bg_node.inputs['Strength'].default_value = strength

    sky_connected = False
    if use_physical_sky:
        try:
            sky_node = nodes.new(type='ShaderNodeTexSky')
            sky_node.location = (-150, 0)
            for stype in ('MULTIPLE_SCATTERING', 'NISHITA', 'HOSEK_WILKIE', 'PREETHAM'):
                try:
                    sky_node.sky_type = stype
                    break
                except Exception:
                    continue

            # Parâmetros de sol / atmosfera (se suportados pelo modelo ativo)
            for attr, val in [
                ("sun_elevation", 0.7854),
                ("sun_rotation", 1.0472),
                ("altitude", 50.0),
                ("air_density", 1.0),
                ("dust_density", 1.0),
                ("ozone_density", 1.0),
                ("sun_intensity", 0.6),
            ]:
                if hasattr(sky_node, attr):
                    try:
                        setattr(sky_node, attr, val)
                    except Exception:
                        pass

            node_tree.links.new(sky_node.outputs['Color'], bg_node.inputs['Color'])
            sky_connected = True
            log_info(f"Céu Físico ({sky_node.sky_type}) configurado com sucesso.")
        except Exception as e:
            log_warning(f"Fallback para luz de fundo simples: {e}")


    if not sky_connected:
        bg_node.inputs['Color'].default_value = (*world_color, 1.0)

    node_tree.links.new(bg_node.outputs['Background'], output_node.inputs['Surface'])

