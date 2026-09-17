"""Gera a cena e renders de verificação a partir do Blender em background."""

import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import bpy  # noqa: E402
import main  # noqa: E402
from cameras.render_batch import render_all_cameras  # noqa: E402


if not main.run_project():
    raise RuntimeError("A geração procedural falhou.")

selected_cameras = set(sys.argv[sys.argv.index("--") + 1 :]) if "--" in sys.argv else set()
if selected_cameras:
    camera_collection = bpy.data.collections.get("08_CAMERAS")
    for camera in list(camera_collection.objects):
        if camera.type == "CAMERA" and camera.name not in selected_cameras:
            camera_collection.objects.unlink(camera)

output_dir = os.path.join(PROJECT_ROOT, "renders")
saved_files = render_all_cameras(output_dir, resolution_x=640, resolution_y=360)
if not saved_files:
    raise RuntimeError("Nenhuma câmera estática foi renderizada.")

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(output_dir, "shopping_validado.blend"))
print("Renders gerados:", *saved_files, sep="\n")
