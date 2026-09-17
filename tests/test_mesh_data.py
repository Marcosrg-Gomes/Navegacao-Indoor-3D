"""Testes de geometria pura, sem depender de bpy ou bmesh."""

import unittest

from utils.mesh_data import arch_mesh, trapezoid_box_mesh


class MeshDataTests(unittest.TestCase):
    def test_arch_has_constant_radial_thickness_and_closed_faces(self):
        vertices, faces = arch_mesh(1.0, 1.2, 1.2, segments=8, depth=0.2)
        self.assertEqual(len(vertices), 36)
        self.assertEqual(len(faces), 34)
        for index in range(0, len(vertices), 4):
            inner, outer = vertices[index], vertices[index + 1]
            self.assertAlmostEqual(
                abs(outer[0] ** 2 + outer[2] ** 2) ** 0.5
                - abs(inner[0] ** 2 + inner[2] ** 2) ** 0.5,
                0.2,
            )
        self.assertTrue(all(len(set(face)) == len(face) for face in faces))

    def test_trapezoid_box_has_expected_elevations_and_six_faces(self):
        vertices, faces = trapezoid_box_mesh(2, 3, 4, 5, 1.5)
        self.assertEqual(len(vertices), 8)
        self.assertEqual(len(faces), 6)
        self.assertEqual({vertex[2] for vertex in vertices[:4]}, {0.0})
        self.assertEqual({vertex[2] for vertex in vertices[4:]}, {1.5})

    def test_invalid_mesh_dimensions_are_rejected(self):
        with self.assertRaises(ValueError):
            arch_mesh(1, 1, 1)
        with self.assertRaises(ValueError):
            trapezoid_box_mesh(1, 1, 0, 1, 1)
