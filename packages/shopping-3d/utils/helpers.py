"""
utils/helpers.py — Funções auxiliares de manipulação de cena

Contém:
- Gerenciamento de Collections
- Vinculação de objetos
- Aplicação de materiais
- Utilitários de transformação
"""

import bpy
from typing import Optional, List
from mathutils import Vector, Euler
import math


# =============================================================================
# COLLECTIONS
# =============================================================================

def get_or_create_collection(
    name: str,
    parent: Optional[bpy.types.Collection] = None,
) -> bpy.types.Collection:
    """
    Retorna uma Collection existente pelo nome, ou cria uma nova.

    Args:
        name: Nome da Collection.
        parent: Collection pai. Se None, usa bpy.context.scene.collection (raiz).

    Returns:
        A Collection (existente ou recém-criada).
    """
    # Verificar se já existe em bpy.data.collections
    existing = bpy.data.collections.get(name)
    if existing:
        # Garantir que está vinculada ao pai correto
        target_parent = parent if parent else bpy.context.scene.collection
        if name not in target_parent.children:
            try:
                target_parent.children.link(existing)
            except RuntimeError:
                pass  # Já está vinculada em outro lugar
        return existing

    # Criar nova
    col = bpy.data.collections.new(name)
    target_parent = parent if parent else bpy.context.scene.collection
    target_parent.children.link(col)
    return col


def link_to_collection(
    obj: bpy.types.Object,
    collection: bpy.types.Collection,
    unlink_from_scene_root: bool = True,
) -> None:
    """
    Vincula um objeto a uma Collection específica.

    Se o objeto ainda não foi vinculado a nenhuma Collection, simplesmente vincula.
    Se já estiver na raiz da cena, remove de lá (a menos que unlink_from_scene_root=False).

    Args:
        obj: O objeto a vincular.
        collection: A Collection de destino.
        unlink_from_scene_root: Remove da Collection raiz da cena se estiver lá.
    """
    # Verificar se já está nesta collection
    if obj.name in collection.objects:
        return

    # Vincular à collection de destino
    collection.objects.link(obj)

    # Remover da raiz da cena se necessário
    if unlink_from_scene_root:
        scene_root = bpy.context.scene.collection
        if obj.name in scene_root.objects:
            scene_root.objects.unlink(obj)


def move_object_to_collection(
    obj: bpy.types.Object,
    collection: bpy.types.Collection,
) -> None:
    """
    Move um objeto para uma Collection, removendo-o de todas as outras.

    Args:
        obj: O objeto a mover.
        collection: A Collection de destino.
    """
    # Desvincular de todas as collections atuais
    for col in list(obj.users_collection):
        col.objects.unlink(obj)

    # Vincular à nova
    collection.objects.link(obj)


# =============================================================================
# MATERIAIS
# =============================================================================

def get_or_create_material(name: str) -> bpy.types.Material:
    """
    Retorna um material existente pelo nome, ou cria um novo em branco.

    Args:
        name: Nome do material.

    Returns:
        O material (existente ou recém-criado).
    """
    mat = bpy.data.materials.get(name)
    if mat:
        return mat

    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    return mat


def apply_material(
    obj: bpy.types.Object,
    material: bpy.types.Material,
    slot_index: int = 0,
) -> None:
    """
    Aplica um material a um objeto.

    Args:
        obj: O objeto.
        material: O material a aplicar.
        slot_index: Índice do slot de material (0 = principal).
    """
    if obj.data is None:
        return

    # Garantir que há slots suficientes
    while len(obj.material_slots) <= slot_index:
        obj.data.materials.append(None)

    obj.material_slots[slot_index].material = material


def apply_material_by_name(obj: bpy.types.Object, material_name: str) -> None:
    """
    Aplica um material a um objeto pelo nome do material.
    O material deve existir em bpy.data.materials.

    Args:
        obj: O objeto.
        material_name: Nome do material.
    """
    mat = bpy.data.materials.get(material_name)
    if mat is None:
        from utils.logging import log_warning
        log_warning(f"Material '{material_name}' não encontrado. Objeto '{obj.name}' sem material.")
        return
    apply_material(obj, mat)


# =============================================================================
# TRANSFORMAÇÕES
# =============================================================================

def set_object_rotation(
    obj: bpy.types.Object,
    rx: float = 0.0,
    ry: float = 0.0,
    rz: float = 0.0,
    degrees: bool = True,
) -> None:
    """
    Define a rotação de um objeto.

    Args:
        obj: O objeto.
        rx, ry, rz: Ângulos de rotação (ou rx pode ser uma tupla/lista (rx, ry, rz)).
        degrees: Se True, os valores são em graus e serão convertidos para radianos.
    """
    if isinstance(rx, (tuple, list)):
        vals = rx
        rx, ry, rz = vals[0], vals[1], vals[2]

    if degrees:
        rx = math.radians(rx)
        ry = math.radians(ry)
        rz = math.radians(rz)
    obj.rotation_euler = Euler((rx, ry, rz), 'XYZ')


def set_object_location(
    obj: bpy.types.Object,
    x: float = 0.0,
    y: float = 0.0,
    z: float = 0.0,
) -> None:
    """Define a localização de um objeto."""
    obj.location = Vector((x, y, z))


# =============================================================================
# INSTÂNCIAS (LINKED DUPLICATES)
# =============================================================================

def create_linked_instance(
    source_obj: bpy.types.Object,
    name: str,
    location: tuple,
    collection: Optional[bpy.types.Collection] = None,
    rotation: tuple = (0.0, 0.0, 0.0),
    degrees: bool = True,
) -> bpy.types.Object:
    """
    Cria uma instância vinculada (linked duplicate) de um objeto.
    O mesh é compartilhado — economiza memória para elementos repetidos.

    Args:
        source_obj: Objeto original (fonte).
        name: Nome da nova instância.
        location: Posição (x, y, z).
        collection: Collection de destino (opcional).
        rotation: Rotação (rx, ry, rz).
        degrees: Se True, rotação em graus.

    Returns:
        O novo objeto instância.
    """
    # Criar novo objeto com o mesmo mesh (linked)
    new_obj = bpy.data.objects.new(name, source_obj.data)
    new_obj.location = Vector(location)
    set_object_rotation(new_obj, *rotation, degrees=degrees)

    if collection:
        collection.objects.link(new_obj)
    else:
        bpy.context.scene.collection.objects.link(new_obj)

    return new_obj


# =============================================================================
# UTILITÁRIOS DE CENA
# =============================================================================

def setup_scene_units() -> None:
    """
    Configura a cena para usar o sistema métrico com metros.
    Garante que 1 unidade Blender = 1 metro.
    """
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    scene.unit_settings.length_unit = 'METERS'


def setup_render_engine(engine: str = 'BLENDER_EEVEE_NEXT') -> None:
    """
    Define o engine de renderização.

    Args:
        engine: 'BLENDER_EEVEE_NEXT' (Blender 4.x), 'BLENDER_EEVEE' (3.x), 
                ou 'CYCLES'.
    """
    scene = bpy.context.scene

    # Tentar EEVEE Next (Blender 4.x) primeiro, fallback para EEVEE
    if engine == 'BLENDER_EEVEE_NEXT':
        try:
            scene.render.engine = 'BLENDER_EEVEE_NEXT'
        except Exception:
            try:
                scene.render.engine = 'BLENDER_EEVEE'
            except Exception:
                pass
    else:
        try:
            scene.render.engine = engine
        except Exception:
            pass


def remove_default_objects() -> None:
    """
    Remove objetos padrão do Blender (Cube, Light, Camera) se existirem.
    Apenas remove se os nomes forem exatamente os padrões do Blender.
    NÃO remove objetos do usuário.
    """
    default_names = {"Cube", "Light", "Camera"}
    for name in default_names:
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)


def get_collection_all_objects(
    collection: bpy.types.Collection,
    recursive: bool = True,
) -> List[bpy.types.Object]:
    """
    Retorna todos os objetos de uma Collection (e sub-collections se recursive=True).

    Args:
        collection: A Collection a inspecionar.
        recursive: Se True, inclui objetos de sub-collections.

    Returns:
        Lista de objetos.
    """
    objects = list(collection.objects)
    if recursive:
        for child in collection.children:
            objects.extend(get_collection_all_objects(child, recursive=True))
    return objects
