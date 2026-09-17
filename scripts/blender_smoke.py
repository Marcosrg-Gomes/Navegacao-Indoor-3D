"""Smoke test executado pelo Blender headless no CI."""

import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import bpy  # noqa: E402
import main  # noqa: E402


if not main.run_project():
    raise RuntimeError("A geração procedural falhou.")
if bpy.data.collections.get("MINI_SHOPPING") is None:
    raise RuntimeError("A coleção raiz do projeto não foi criada.")
if not any(obj.type == "CAMERA" for obj in bpy.data.objects):
    raise RuntimeError("Nenhuma câmera foi criada.")
