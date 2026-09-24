"""blender --background --factory-startup --python scripts/export_navigation_scene.py"""

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import main  # noqa: E402
from navigation import build_catalog, write_floorplans  # noqa: E402
from scene_contract import validate_model  # noqa: E402


def export_scene():
    parser = argparse.ArgumentParser()
    parser.add_argument("--release", type=int, default=1)
    parser.add_argument(
        "--output", type=Path, default=ROOT.parents[1] / "assets/models/mini-shopping"
    )
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    model = output / f"mini-shopping-v{args.release}.glb"
    catalog_path = output / f"scene-catalog-v{args.release}.json"
    if model.exists():
        raise RuntimeError(
            "Esta versão já existe; escolha um novo --release ou um diretório de staging."
        )
    if not main.run_project():
        raise RuntimeError("Falha ao gerar o shopping")
    catalog = build_catalog(release=args.release)
    root = bpy.data.collections["MINI_SHOPPING"]
    names = {obj.name for obj in root.all_objects}
    for anchor in catalog["anchors"].values():
        if anchor["object_name"] not in names:
            raise RuntimeError(f"Âncora ausente: {anchor['object_name']}")
    bpy.ops.object.select_all(action="DESELECT")
    exported = []
    floor_z = main.CONFIG["mezzanine"]["floor_z"]
    # Preserve stable Blender object names and put floor/cutaway metadata in glTF extras.
    for obj in root.all_objects:
        if obj.type not in {"MESH", "FONT", "CURVE"} or obj.name.startswith("NAV_"):
            continue
        points = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
        low, high = min(p.z for p in points), max(p.z for p in points)
        obj["floor_code"] = "MEZANINO" if low >= floor_z - 0.6 else "TERREO"
        obj["cutaway"] = (
            any(c.name in {"TETO", "PAREDES_EXTERNAS"} for c in obj.users_collection)
            or "Forro" in obj.name
        )
        obj["spans_floors"] = low < floor_z - 0.6 and high > floor_z + 0.5
        obj.select_set(True)
        exported.append(obj.name)
    for code, poi in catalog["pois"].items():
        if not any(name.startswith(poi["object_prefix"]) for name in exported):
            raise RuntimeError(f"POI sem geometria: {code} ({poi['object_prefix']})")
    bpy.ops.export_scene.gltf(
        filepath=str(model),
        export_format="GLB",
        use_selection=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_extras=True,
        export_yup=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    if model.stat().st_size > 25 * 1024 * 1024:
        raise RuntimeError("GLB excede orçamento de 25 MB")
    catalog["model_sha256"] = hashlib.sha256(model.read_bytes()).hexdigest()
    catalog["model_bytes"] = model.stat().st_size
    catalog["exported_objects"] = sorted(exported)
    validate_model(catalog, model.read_bytes())
    catalog["generated_at"] = datetime.now(timezone.utc).isoformat()
    catalog_path.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    write_floorplans(output, release=args.release)
    print(
        f"NAVIGATION_EXPORT_OK {len(exported)} objetos; {model.stat().st_size} bytes; {catalog_path}"
    )


if __name__ == "__main__":
    export_scene()
