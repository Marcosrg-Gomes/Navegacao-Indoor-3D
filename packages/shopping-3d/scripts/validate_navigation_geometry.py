"""Check walking links against evaluated Blender geometry, then render references."""

import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import main  # noqa: E402
from navigation import build_catalog  # noqa: E402


def validate():
    if not main.run_project():
        raise RuntimeError("Geração falhou")
    catalog = build_catalog()
    graph = bpy.context.evaluated_depsgraph_get()
    issues = []
    samples = 0
    for edge in catalog["edges"]:
        a, b = catalog["anchors"][edge["from"]], catalog["anchors"][edge["to"]]
        if a["floor_code"] != b["floor_code"]:
            continue

        def blender(anchor):
            x, z, neg_y = anchor["position"]
            return Vector((x, -neg_y, z))

        start, end = blender(a), blender(b)
        direction = end - start
        length = direction.length
        direction.normalize()
        # Actual triangle intersections at walking body height (no decorative canopy boxes).
        for height in (0.4, 1.0, 1.8):
            hit, point, _, _, obj, _ = bpy.context.scene.ray_cast(
                graph, start + Vector((0, 0, height)), direction, distance=length
            )
            if hit and obj.name != "Cube":
                issues.append(
                    {
                        "edge": [edge["from"], edge["to"]],
                        "obstacle": obj.name,
                        "height": height,
                        "point": list(point),
                    }
                )
        for i in range(int(length / 0.3) + 2):
            t = i / (int(length / 0.3) + 1)
            point = start.lerp(end, t)
            hit, surface, _, _, obj, _ = bpy.context.scene.ray_cast(
                graph, point + Vector((0, 0, 0.06)), Vector((0, 0, -1)), distance=0.15
            )
            samples += 1
            if not hit:
                issues.append({"edge": [edge["from"], edge["to"]], "missing_floor": list(point)})
                break
    output = ROOT.parents[1] / "evidence/navigation-geometry.json"
    output.parent.mkdir(exist_ok=True)
    output.write_text(
        json.dumps({"samples": samples, "issues": issues}, indent=2), encoding="utf-8"
    )
    print(f"NAV_GEOMETRY: {samples} amostras, {len(issues)} problemas; {output}")
    if issues:
        raise RuntimeError(f"Grafo intersecta geometria: {issues[:5]}")


if __name__ == "__main__":
    validate()
