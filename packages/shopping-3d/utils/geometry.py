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
from utils.mesh_data import arch_mesh, trapezoid_box_mesh


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
        [verts[0], verts[3], verts[2], verts[1]],  # bottom (-Z)
        [verts[4], verts[5], verts[6], verts[7]],  # top (+Z)
        [verts[0], verts[1], verts[5], verts[4]],  # front (-Y)
        [verts[2], verts[3], verts[7], verts[6]],  # back (+Y)
        [verts[0], verts[4], verts[7], verts[3]],  # left (-X)
        [verts[1], verts[2], verts[6], verts[5]],  # right (+X)
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


# =============================================================================
# NOVAS PRIMITIVAS GEOMÉTRICAS AVANÇADAS
# =============================================================================

def create_rounded_box(
    name: str,
    width: float,
    depth: float,
    height: float,
    bevel_radius: float = 0.025,
    bevel_segments: int = 2,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    centered_xy: bool = True,
    base_at_zero: bool = True,
) -> bpy.types.Object:
    """
    Cria uma caixa com chanfro/arredondamento nas arestas (bmesh bevel).
    Ideal para totens, soleiras, bancadas, móveis e fáscias.
    """
    obj = create_box(name, width, depth, height, location, centered_xy, base_at_zero)
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.edges.ensure_lookup_table()

    if bevel_radius > 0.001:
        max_offset = min(width, depth, height) * 0.45
        actual_bevel = min(bevel_radius, max_offset)
        bmesh.ops.bevel(
            bm, geom=list(bm.edges), offset=actual_bevel,
            segments=max(bevel_segments, 1), profile=0.5, affect='EDGES',
        )

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj


def create_glass_case(name, width, depth, height, location, thickness=0.012):
    """Cinco painéis finos, com interior vazio e base aberta sobre o balcão."""
    x, y, z = location
    return [create_box(
        name=f"{name}_{suffix}", width=w, depth=d, height=h,
        location=(x + dx, y + dy, z + dz),
    ) for suffix, w, d, h, dx, dy, dz in (
        ("Topo", width, depth, thickness, 0, 0, height - thickness),
        ("Esq", thickness, depth, height - thickness, -(width-thickness)/2, 0, 0),
        ("Dir", thickness, depth, height - thickness, (width-thickness)/2, 0, 0),
        ("Frente", width-2*thickness, thickness, height-thickness, 0, -(depth-thickness)/2, 0),
        ("Fundo", width-2*thickness, thickness, height-thickness, 0, (depth-thickness)/2, 0),
    )]


def create_arch(
    name: str,
    inner_radius: float,
    outer_radius: float,
    arch_height: float,
    angle_deg: float = 180.0,
    segments: int = 16,
    depth: float = 0.10,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    """
    Cria um arco curvo ou meio-cilindro oco no plano XZ extrudado em Y.
    Ideal para vitrines curvas de gastronomia, passagens em arco e cúpulas.
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)

    bm = bmesh.new()
    vertices, faces = arch_mesh(
        inner_radius, outer_radius, arch_height, angle_deg, segments, depth
    )
    mesh.from_pydata(vertices, [], faces)
    bm.from_mesh(mesh)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj


def create_torus(
    name: str,
    major_radius: float,
    minor_radius: float,
    major_segments: int = 16,
    minor_segments: int = 8,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    """Cria um toro/anel no plano XY."""
    import math
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)

    bm = bmesh.new()

    verts_grid = []
    for i in range(major_segments):
        u = (2.0 * math.pi * i) / major_segments
        cos_u, sin_u = math.cos(u), math.sin(u)
        ring = []
        for j in range(minor_segments):
            v = (2.0 * math.pi * j) / minor_segments
            cos_v, sin_v = math.cos(v), math.sin(v)
            x = (major_radius + minor_radius * cos_v) * cos_u
            y = (major_radius + minor_radius * cos_v) * sin_u
            z = minor_radius * sin_v
            ring.append(bm.verts.new((x, y, z)))
        verts_grid.append(ring)

    bm.verts.ensure_lookup_table()

    for i in range(major_segments):
        next_i = (i + 1) % major_segments
        for j in range(minor_segments):
            next_j = (j + 1) % minor_segments
            bm.faces.new([
                verts_grid[i][j],
                verts_grid[next_i][j],
                verts_grid[next_i][next_j],
                verts_grid[i][next_j],
            ])

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj


def create_cone(
    name: str,
    radius_top: float,
    radius_bottom: float,
    height: float,
    segments: int = 12,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    base_at_zero: bool = True,
) -> bpy.types.Object:
    """Cria um cone truncado / tronco de cone. Usado para manequins, luminárias e vasos."""
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
        cos_a, sin_a = math.cos(angle), math.sin(angle)
        bottom_verts.append(bm.verts.new((radius_bottom * cos_a, radius_bottom * sin_a, z0)))
        top_verts.append(bm.verts.new((radius_top * cos_a, radius_top * sin_a, z1)))

    bm.verts.ensure_lookup_table()

    for i in range(segments):
        next_i = (i + 1) % segments
        bm.faces.new([
            bottom_verts[i],
            bottom_verts[next_i],
            top_verts[next_i],
            top_verts[i],
        ])

    if radius_bottom > 0.001:
        bm.faces.new(bottom_verts[::-1])
    if radius_top > 0.001:
        bm.faces.new(top_verts)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj


def create_trapezoid_box(
    name: str,
    top_width: float,
    top_depth: float,
    bottom_width: float,
    bottom_depth: float,
    height: float,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    base_at_zero: bool = True,
) -> bpy.types.Object:
    """
    Cria uma caixa trapezoidal com topo mais largo que a base (vasos de plantas, pedestais).
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)

    bm = bmesh.new()

    vertices, faces = trapezoid_box_mesh(
        top_width, top_depth, bottom_width, bottom_depth, height, base_at_zero
    )
    mesh.from_pydata(vertices, [], faces)
    bm.from_mesh(mesh)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj


def create_tube(
    name: str,
    outer_radius: float,
    wall_thickness: float,
    height: float,
    segments: int = 16,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    base_at_zero: bool = True,
) -> bpy.types.Object:
    """Cria um tubo cilíndrico oco (araras, cortinas rolo, tubulações)."""
    import math
    inner_radius = max(outer_radius - wall_thickness, 0.001)
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)

    bm = bmesh.new()

    z0 = 0.0 if base_at_zero else -height / 2.0
    z1 = height if base_at_zero else height / 2.0

    b_out = []
    t_out = []
    b_in = []
    t_in = []

    for i in range(segments):
        ang = (2.0 * math.pi * i) / segments
        cos_a, sin_a = math.cos(ang), math.sin(ang)
        b_out.append(bm.verts.new((outer_radius * cos_a, outer_radius * sin_a, z0)))
        t_out.append(bm.verts.new((outer_radius * cos_a, outer_radius * sin_a, z1)))
        b_in.append(bm.verts.new((inner_radius * cos_a, inner_radius * sin_a, z0)))
        t_in.append(bm.verts.new((inner_radius * cos_a, inner_radius * sin_a, z1)))

    bm.verts.ensure_lookup_table()

    for i in range(segments):
        ni = (i + 1) % segments
        bm.faces.new([b_out[i], b_out[ni], t_out[ni], t_out[i]])
        bm.faces.new([t_in[i], t_in[ni], b_in[ni], b_in[i]])
        bm.faces.new([b_in[i], b_in[ni], b_out[ni], b_out[i]])
        bm.faces.new([t_out[i], t_out[ni], t_in[ni], t_in[i]])

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj


def create_profile_u(
    name: str,
    total_width: float,
    total_height: float,
    flange_thickness: float,
    web_thickness: float,
    depth: float = 0.12,
    location: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    base_at_zero: bool = True,
) -> bpy.types.Object:
    """
    Cria um perfil em U estrutural extrudado no eixo Y.
    O U abre para o eixo +X.
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)

    bm = bmesh.new()

    z0 = 0.0 if base_at_zero else -total_height / 2.0
    z1 = total_height if base_at_zero else total_height / 2.0
    y0 = -depth / 2.0
    y1 = depth / 2.0

    x_back = -total_width / 2.0
    x_web = x_back + web_thickness
    x_front = total_width / 2.0

    z_bot = z0
    z_bot_flange = z0 + flange_thickness
    z_top_flange = z1 - flange_thickness
    z_top = z1

    poly_xz = [
        (x_back, z_bot),
        (x_front, z_bot),
        (x_front, z_bot_flange),
        (x_web, z_bot_flange),
        (x_web, z_top_flange),
        (x_front, z_top_flange),
        (x_front, z_top),
        (x_back, z_top),
    ]

    front_verts = [bm.verts.new((x, y0, z)) for x, z in poly_xz]
    back_verts = [bm.verts.new((x, y1, z)) for x, z in poly_xz]
    bm.verts.ensure_lookup_table()

    bm.faces.new(front_verts)
    bm.faces.new(back_verts[::-1])

    n = len(poly_xz)
    for i in range(n):
        ni = (i + 1) % n
        bm.faces.new([front_verts[i], back_verts[i], back_verts[ni], front_verts[ni]])

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = Vector(location)
    return obj
