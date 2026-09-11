"""
utils/geometry.py — Funções de criação de primitivas geométricas

Todas as funções usam bmesh + bpy.data para criar geometria,
evitando bpy.ops sempre que possível.

Convenção de coordenadas:
  X = Largura (Width)  — positivo para a direita
  Y = Comprimento (Length/Depth) — positivo para o fundo
  Z = Altura (Height)  — positivo para cima

Todas as funções retornam o objeto bpy.types.Object criado.
O objeto NÃO é vinculado a nenhuma Collection — use helpers.link_to_collection().
"""

import bpy
import bmesh
from mathutils import Vector
from typing import Optional, Tuple


# =============================================================================
# PRIMITIVAS BASE
# =============================================================================

def create_box(
    name: str,
    width: float,
    depth: float,
    height: float,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    centered_xy: bool = True,
    base_at_zero: bool = True,
) -> bpy.types.Object:
    """
    Cria uma caixa (paralelepípedo) com bmesh.

    Args:
        name: Nome do objeto e do mesh.
        width: Dimensão no eixo X.
        depth: Dimensão no eixo Y.
        height: Dimensão no eixo Z.
        location: Posição do objeto no mundo.
        centered_xy: Se True, o box é centrado em X e Y.
                     Se False, X e Y iniciam em 0 localmente.
        base_at_zero: Se True, a base fica em Z=0 localmente (sobe para cima).
                      Se False, o box é centrado em Z.

    Returns:
        O objeto Blender criado (não vinculado a nenhuma Collection).
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)

    bm = bmesh.new()

    # Calcular vértices
    if centered_xy:
        x0, x1 = -width / 2.0, width / 2.0
        y0, y1 = -depth / 2.0, depth / 2.0
    else:
        x0, x1 = 0.0, width
        y0, y1 = 0.0, depth

    if base_at_zero:
        z0, z1 = 0.0, height
    else:
        z0, z1 = -height / 2.0, height / 2.0

    # 8 vértices do cubo
    verts = [
        bm.verts.new((x0, y0, z0)),
        bm.verts.new((x1, y0, z0)),
        bm.verts.new((x1, y1, z0)),
        bm.verts.new((x0, y1, z0)),
        bm.verts.new((x0, y0, z1)),
        bm.verts.new((x1, y0, z1)),
        bm.verts.new((x1, y1, z1)),
        bm.verts.new((x0, y1, z1)),
    ]
    bm.verts.ensure_lookup_table()

    # 6 faces
    faces = [
        [verts[0], verts[1], verts[2], verts[3]],  # bottom
        [verts[4], verts[7], verts[6], verts[5]],  # top
        [verts[0], verts[4], verts[5], verts[1]],  # front (-Y)
        [verts[2], verts[6], verts[7], verts[3]],  # back (+Y)
        [verts[0], verts[3], verts[7], verts[4]],  # left (-X)
        [verts[1], verts[5], verts[6], verts[2]],  # right (+X)
    ]
    for face_verts in faces:
        bm.faces.new(face_verts)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj


def create_plane(
    name: str,
    width: float,
    depth: float,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    centered: bool = True,
) -> bpy.types.Object:
    """
    Cria um plano plano (Z=0 localmente) com bmesh.

    Args:
        name: Nome do objeto.
        width: Dimensão no eixo X.
        depth: Dimensão no eixo Y.
        location: Posição no mundo.
        centered: Se True, centrado em X e Y.

    Returns:
        Objeto Blender criado.
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)

    bm = bmesh.new()

    if centered:
        x0, x1 = -width / 2.0, width / 2.0
        y0, y1 = -depth / 2.0, depth / 2.0
    else:
        x0, x1 = 0.0, width
        y0, y1 = 0.0, depth

    verts = [
        bm.verts.new((x0, y0, 0.0)),
        bm.verts.new((x1, y0, 0.0)),
        bm.verts.new((x1, y1, 0.0)),
        bm.verts.new((x0, y1, 0.0)),
    ]
    bm.faces.new(verts)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj


def create_cylinder(
    name: str,
    radius: float,
    height: float,
    segments: int = 16,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    base_at_zero: bool = True,
    cap_ends: bool = True,
    vertices: Optional[int] = None,
) -> bpy.types.Object:
    """
    Cria um cilindro usando bmesh.

    Args:
        name: Nome do objeto.
        radius: Raio do cilindro.
        height: Altura do cilindro.
        segments: Número de lados (16 para cilindro suave leve).
        location: Posição no mundo.
        base_at_zero: Se True, base em Z=0; se False, centrado em Z.
        cap_ends: Se True, cria tampas superior e inferior.
        vertices: Alias para segments.
    """
    if vertices is not None:
        segments = vertices
    import math

    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)

    bm = bmesh.new()

    z0 = 0.0 if base_at_zero else -height / 2.0
    z1 = height if base_at_zero else height / 2.0

    bottom_verts = []
    top_verts = []

    for i in range(segments):
        angle = (2.0 * math.pi * i) / segments
        x = radius * math.cos(angle)
        y = radius * math.sin(angle)
        bottom_verts.append(bm.verts.new((x, y, z0)))
        top_verts.append(bm.verts.new((x, y, z1)))

    bm.verts.ensure_lookup_table()

    # Faces laterais
    for i in range(segments):
        next_i = (i + 1) % segments
        bm.faces.new([
            bottom_verts[i],
            bottom_verts[next_i],
            top_verts[next_i],
            top_verts[i],
        ])

    # Tampas
    if cap_ends:
        bm.faces.new(bottom_verts[::-1])  # Tampa inferior (normal para baixo)
        bm.faces.new(top_verts)           # Tampa superior (normal para cima)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj


def create_sphere_ico(
    name: str,
    radius: float,
    subdivisions: int = 2,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    """
    Cria uma esfera icosaédrica (leve, poucos polígonos).
    Usada para plantas decorativas.

    Args:
        name: Nome do objeto.
        radius: Raio da esfera.
        subdivisions: Nível de subdivisão (2 = 80 triângulos, suficiente).
        location: Posição no mundo.

    Returns:
        Objeto Blender criado.
    """
    # Para esferas, bpy.ops.mesh.primitive_ico_sphere_add é aceitável
    # pois não há alternativa direta simples em bmesh puro.
    # Usamos temp_override para isolar o contexto.
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)

    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=radius)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj


# =============================================================================
# GEOMETRIA ARQUITETÔNICA ESPECIALIZADA
# =============================================================================

def create_wall(
    name: str,
    length: float,
    height: float,
    thickness: float,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    axis: str = "X",
) -> bpy.types.Object:
    """
    Cria uma parede reta.

    Args:
        name: Nome do objeto.
        length: Comprimento da parede.
        height: Altura da parede.
        thickness: Espessura da parede.
        location: Posição da base da parede (centro em length).
        axis: "X" para parede ao longo do eixo X, "Y" para eixo Y.

    Returns:
        Objeto Blender criado.
    """
    if axis == "X":
        width, depth = length, thickness
    else:  # axis == "Y"
        width, depth = thickness, length

    return create_box(
        name=name,
        width=width,
        depth=depth,
        height=height,
        location=location,
        centered_xy=True,
        base_at_zero=True,
    )


def create_wall_with_opening(
    name: str,
    wall_length: float,
    wall_height: float,
    wall_thickness: float,
    opening_width: float,
    opening_height: float,
    opening_offset_x: float = 0.0,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    axis: str = "X",
) -> bpy.types.Object:
    """
    Cria uma parede com abertura retangular (para porta ou entrada).
    Composta por 3 partes: esquerda, direita e verga (acima da abertura).

    Args:
        name: Nome base do objeto (sufixos _L, _R, _V serão adicionados).
        wall_length: Comprimento total da parede.
        wall_height: Altura total da parede.
        wall_thickness: Espessura.
        opening_width: Largura da abertura.
        opening_height: Altura da abertura.
        opening_offset_x: Deslocamento do centro da abertura em relação
                          ao centro da parede (eixo length).
        location: Posição base da parede.
        axis: "X" ou "Y".

    Returns:
        Lista de objetos [left_obj, right_obj, header_obj].
        Atenção: retorna lista de objetos, não um único objeto.
    """
    half = wall_length / 2.0
    opening_center = opening_offset_x
    opening_half = opening_width / 2.0

    # Dimensão à esquerda da abertura
    left_len = half + opening_center - opening_half
    # Dimensão à direita da abertura
    right_len = half - opening_center - opening_half
    # Altura acima da abertura (verga)
    header_h = wall_height - opening_height

    objects = []

    def make_part(part_name, length, height, offset_along_axis, z_base=0.0):
        """Helper interno para criar uma parte da parede."""
        if length <= 0.001:
            return None
        if axis == "X":
            loc = (
                location[0] + offset_along_axis,
                location[1],
                location[2] + z_base,
            )
            w, d = length, wall_thickness
        else:
            loc = (
                location[0],
                location[1] + offset_along_axis,
                location[2] + z_base,
            )
            w, d = wall_thickness, length
        return create_box(part_name, w, d, height, loc, centered_xy=True, base_at_zero=True)

    # Parte esquerda
    left_center = -half + left_len / 2.0
    obj_l = make_part(f"{name}_L", left_len, wall_height, left_center)
    if obj_l:
        objects.append(obj_l)

    # Parte direita
    right_center = half - right_len / 2.0
    obj_r = make_part(f"{name}_R", right_len, wall_height, right_center)
    if obj_r:
        objects.append(obj_r)

    # Verga (acima da abertura)
    if header_h > 0.001:
        obj_v = make_part(
            f"{name}_V",
            opening_width,
            header_h,
            opening_center,
            z_base=opening_height,
        )
        if obj_v:
            objects.append(obj_v)

    return objects


def create_step(
    name: str,
    width: float,
    step_depth: float,
    step_height: float,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    """
    Cria um único degrau de escada.

    Args:
        name: Nome do objeto.
        width: Largura do degrau (eixo X).
        step_depth: Profundidade do piso do degrau (eixo Y).
        step_height: Altura do espelho do degrau (eixo Z).
        location: Posição da base frontal-esquerda do degrau.

    Returns:
        Objeto Blender criado.
    """
    return create_box(
        name=name,
        width=width,
        depth=step_depth,
        height=step_height,
        location=location,
        centered_xy=False,
        base_at_zero=True,
    )
