"""Descrições de malhas puras, independentes da API do Blender."""

from math import cos, radians, sin


def arch_mesh(inner_radius, outer_radius, arch_height, angle_deg=180.0, segments=16, depth=0.10):
    """Retorna vértices e faces de um arco extrudado no eixo Y."""
    if inner_radius <= 0 or outer_radius <= inner_radius:
        raise ValueError("O raio externo deve ser maior que o raio interno positivo.")
    if arch_height <= 0 or depth <= 0 or not 0 < angle_deg <= 360:
        raise ValueError("Altura, profundidade e ângulo do arco são inválidos.")
    if segments < 1:
        raise ValueError("O arco precisa de ao menos um segmento.")

    center_z = max(arch_height - outer_radius, 0.0)
    half_depth = depth / 2.0
    vertices = []
    for index in range(segments + 1):
        angle = radians(angle_deg) * index / segments
        for radius, y in (
            (inner_radius, -half_depth),
            (outer_radius, -half_depth),
            (inner_radius, half_depth),
            (outer_radius, half_depth),
        ):
            vertices.append((radius * cos(angle), y, radius * sin(angle) + center_z))

    faces = []
    for index in range(segments):
        current = index * 4
        next_index = (index + 1) * 4
        faces.extend(
            (
                (current, current + 1, next_index + 1, next_index),
                (next_index + 2, next_index + 3, current + 3, current + 2),
                (current + 1, current + 3, next_index + 3, next_index + 1),
                (current + 2, current, next_index, next_index + 2),
            )
        )
    last = segments * 4
    faces.extend(((0, 2, 3, 1), (last + 1, last + 3, last + 2, last)))
    return vertices, faces


def trapezoid_box_mesh(top_width, top_depth, bottom_width, bottom_depth, height, base_at_zero=True):
    """Retorna vértices e faces de uma caixa trapezoidal fechada."""
    dimensions = (top_width, top_depth, bottom_width, bottom_depth, height)
    if any(value <= 0 for value in dimensions):
        raise ValueError("As dimensões da caixa trapezoidal devem ser positivas.")

    z0 = 0.0 if base_at_zero else -height / 2.0
    z1 = z0 + height
    vertices = [
        (-bottom_width / 2, -bottom_depth / 2, z0),
        (bottom_width / 2, -bottom_depth / 2, z0),
        (bottom_width / 2, bottom_depth / 2, z0),
        (-bottom_width / 2, bottom_depth / 2, z0),
        (-top_width / 2, -top_depth / 2, z1),
        (top_width / 2, -top_depth / 2, z1),
        (top_width / 2, top_depth / 2, z1),
        (-top_width / 2, top_depth / 2, z1),
    ]
    faces = [
        (0, 3, 2, 1),
        (4, 5, 6, 7),
        (0, 1, 5, 4),
        (2, 3, 7, 6),
        (0, 4, 7, 3),
        (1, 2, 6, 5),
    ]
    return vertices, faces
