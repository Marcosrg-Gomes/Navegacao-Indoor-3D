"""Navigation derived from the same configuration as the procedural geometry."""
import math
import sys
from html import escape
from pathlib import Path

from config import CONFIG, get_derived, get_navigation_layout

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scene-contract"))
from scene_contract import validate_catalog


def build_catalog(cfg=None, release=1):
    cfg = cfg or CONFIG
    d = get_derived(cfg)
    layout = get_navigation_layout(cfg)
    width, length = cfg["shopping"]["width"], cfg["shopping"]["length"]
    elevation = cfg["mezzanine"]["floor_z"]
    floors = {
        code: {"name": name, "level": level, "origin": [-width / 2, z, length / 2],
               "axis_x": [width, 0, 0], "axis_y": [0, 0, -length]}
        for code, name, level, z in [("TERREO", "Térreo", 0, 0), ("MEZANINO", "Mezanino", 1, elevation)]
    }
    anchors, pois, edges = {}, {}, []
    lanes = {"T": cfg["corridor"]["width"] / 2 - 1.4, "M": d["mz_right_center_x"]}
    junctions = {prefix: {side: {} for side in (-1, 1)} for prefix in lanes}

    def node(code, prefix, x, y, kind="corredor", name=None, object_name=None):
        z = elevation if prefix == "M" else 0
        anchors[code] = {"floor_code": "MEZANINO" if prefix == "M" else "TERREO",
                         "coord_x": (x + width / 2) / width, "coord_y": (y + length / 2) / length,
                         "position": [x, z, -y], "type": kind, "name": name or code,
                         "object_name": object_name or f"NAV_{code}"}
        return code

    def edge(a, b, bidirectional=True, accessible=True):
        distance = math.dist(anchors[a]["position"], anchors[b]["position"])
        if distance <= 0:
            raise ValueError(f"Nós coincidentes: {a}, {b}")
        edges.append({"from": a, "to": b, "distance": round(distance, 3),
                      "bidirectional": bidirectional, "accessible": accessible})

    def junction(prefix, side, y):
        key = round(y, 5)
        if key not in junctions[prefix][side]:
            # Coordinate keys stay stable when another store is inserted.
            code = f"{prefix}_COR_{'E' if side < 0 else 'D'}_{int(round((y + length / 2) * 1000)):05d}"
            junctions[prefix][side][key] = node(code, prefix, side * lanes[prefix], y)
        return junctions[prefix][side][key]

    for code, p in d["store_positions"].items():
        prefix = "M" if p["is_mezzanine"] else "T"
        side = -1 if p["side"] == "E" else 1
        anchor = node(f"{prefix}_LOJA_{code}", prefix, p["vitrine_x"] - side * cfg["navigation"]["door_clearance"],
                      p["center_y"], "loja", p["brand"], f"NAV_LOJA_{code}")
        pois[code] = {"name": p["brand"], "category": p["category"], "kind": "loja",
                      "object_prefix": f"LOJA_{code}_", "anchor_code": anchor}
        edge(anchor, junction(prefix, side, p["center_y"]))

    entrance_y = -length / 2 + cfg["entrance"]["depth"] / 2
    entrance = node("T_ENTRADA", "T", 0, entrance_y, "entrada", "Entrada principal", "NAV_ENTRADA_PRINCIPAL")
    pois["ENTRADA_PRINCIPAL"] = {"name": "Entrada principal", "category": "ENTRADAS", "kind": "entrada",
                                 "object_prefix": "ARQ_ENTRADA_", "anchor_code": entrance}
    for side in (-1, 1):
        edge(entrance, junction("T", side, entrance_y))

    # Crossings exist only on clear ground or actual mezzanine bridges.
    crossings = {
        "T": [layout["escalator_bottom_y"], layout["lobby_y"], layout["rear_crossing_y"]],
        "M": [d["mz_atrium_start_y"] - cfg["navigation"]["front_bridge_clearance"],
              layout["lobby_y"], layout["rear_crossing_y"]],
    }
    for prefix, ys in crossings.items():
        for y in ys:
            edge(junction(prefix, -1, y), junction(prefix, 1, y))

    for wc in layout["restrooms"]:
        prefix, side = wc["prefix"], wc["side"]
        x, y = wc["door_x"], wc["front_y"] - cfg["navigation"]["door_clearance"]
        anchor = node(wc["anchor_code"], prefix, x, y, "banheiro", wc["name"], wc["nav_object"])
        pois[wc["code"]] = {"name": wc["name"], "category": "BANHEIROS", "kind": "banheiro",
                           "object_prefix": wc["object_prefix"], "anchor_code": anchor}
        # Access the rear perimeter outside food-court furniture and the monumental stair.
        outer_x = side * (cfg["food_court"]["width"] / 2 + cfg["navigation"]["rear_side_clearance"])
        a = node(f'{prefix}_{wc["code"]}_ACESSO', prefix, outer_x, layout["rear_crossing_y"])
        b = node(f'{prefix}_{wc["code"]}_FRENTE', prefix, outer_x, y)
        edge(junction(prefix, side, layout["rear_crossing_y"]), a)
        edge(a, b)
        edge(b, anchor)

    esc = cfg["vertical_circulation"]["escalators"]
    for direction, side in [("SUBIDA", -1), ("DESCIDA", 1)]:
        x = side * (esc["width"] + esc["spacing"]) / 2
        bottom = node(f"T_ESCADA_ROLANTE_{direction}", "T", x, layout["escalator_bottom_y"], "escada_rolante",
                      f"Escada rolante {direction.lower()} — térreo", f"NAV_ESCADA_ROLANTE_{direction}_T")
        top = node(f"M_ESCADA_ROLANTE_{direction}", "M", x, layout["escalator_top_y"], "escada_rolante",
                   f"Escada rolante {direction.lower()} — mezanino", f"NAV_ESCADA_ROLANTE_{direction}_M")
        edge(junction("T", side, layout["escalator_bottom_y"]), bottom, accessible=False)
        lobby = node(f"M_DESEMBARQUE_{direction}", "M", x, layout["lobby_y"])
        edge(top, lobby, accessible=False)
        edge(lobby, junction("M", side, layout["lobby_y"]))
        edge(bottom if direction == "SUBIDA" else top, top if direction == "SUBIDA" else bottom,
             bidirectional=False, accessible=False)

    for prefix in ("T", "M"):
        lift = node(f"{prefix}_ELEVADOR", prefix, layout["elevator_x"], layout["lobby_y"], "elevador",
                    f"Elevador — {'térreo' if prefix == 'T' else 'mezanino'}", f"NAV_ELEVADOR_{prefix}")
        for side in (-1, 1):
            edge(lift, junction(prefix, side, layout["lobby_y"]))
    edge("T_ELEVADOR", "M_ELEVADOR")

    for prefix, sides in junctions.items():
        for points in sides.values():
            ordered = [points[y] for y in sorted(points)]
            for a, b in zip(ordered, ordered[1:]):
                edge(a, b)

    catalog = {"version": "1.0.0", "release": release, "shopping_code": "MINI_SHOPPING",
               "model_url": f"/static/models/mini-shopping/mini-shopping-v{release}.glb",
               "floors": floors, "pois": pois, "anchors": anchors, "edges": edges,
               "qr_codes": {"MINI-ENTRADA-PRINCIPAL": entrance,
                            "MINI-TERREO-CENTRAL": junction("T", -1, layout["lobby_y"]),
                            "MINI-ESCADA-TERREO": "T_ESCADA_ROLANTE_SUBIDA",
                            "MINI-ELEVADOR-TERREO": "T_ELEVADOR",
                            "MINI-MEZANINO-CENTRAL": junction("M", -1, layout["lobby_y"]),
                            "MINI-ESCADA-MEZANINO": "M_ESCADA_ROLANTE_SUBIDA",
                            "MINI-ELEVADOR-MEZANINO": "M_ELEVADOR"}}
    return validate_catalog(catalog)


def create_anchors(collections):
    import bpy
    from utils.helpers import get_or_create_collection
    collection = get_or_create_collection("09_NAVEGACAO", parent=collections["MINI_SHOPPING"])
    catalog = build_catalog()
    for code, floor in catalog["floors"].items():
        obj = bpy.data.objects.new(f"NAV_PISO_{code}", None)
        obj.location = (0, 0, floor["origin"][1])
        collection.objects.link(obj)
    for code, anchor in catalog["anchors"].items():
        obj = bpy.data.objects.new(anchor["object_name"], None)
        x, z, negative_y = anchor["position"]
        obj.location = (x, -negative_y, z)
        obj["codigo"] = code
        obj["floor_code"] = anchor["floor_code"]
        obj.empty_display_size = 0.15
        collection.objects.link(obj)
    return catalog


def write_floorplans(directory, cfg=None, release=1):
    cfg = cfg or CONFIG
    d, layout = get_derived(cfg), get_navigation_layout(cfg)
    w, h = cfg["shopping"]["width"], cfg["shopping"]["length"]
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    for prefix, code in [("T", "TERREO"), ("M", "MEZANINO")]:
        parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">',
                 f'<rect width="{w}" height="{h}" fill="#ece7da"/>']
        def rect(x, y, width, height, fill):
            parts.append(f'<rect x="{x+w/2}" y="{y+h/2}" width="{width}" height="{height}" fill="{fill}" stroke="#9ca3af" stroke-width=".04"/>')
        if prefix == "M":
            rect(-cfg["mezzanine"]["atrium_opening"]/2, d["mz_atrium_start_y"], cfg["mezzanine"]["atrium_opening"], d["mz_atrium_end_y"]-d["mz_atrium_start_y"], "#b9c6cc")
            rect(-cfg["mezzanine"]["atrium_opening"]/2, layout["bridge_start_y"], cfg["mezzanine"]["atrium_opening"], layout["bridge_end_y"]-layout["bridge_start_y"], "#ece7da")
        else:
            for y in cfg["kiosks"]["y_positions"]:
                rect(-cfg["kiosks"]["width"]/2, y-cfg["kiosks"]["depth"]/2, cfg["kiosks"]["width"], cfg["kiosks"]["depth"], "#a78bfa")
        for p in d["store_positions"].values():
            if p["is_mezzanine"] != (prefix == "M"):
                continue
            rect(min(p["inner_x"], p["outer_x"]), p["start_y"], p["store_depth"], p["store_width"], "#ddd4bd")
            parts.append(f'<text x="{p["center_x"]+w/2}" y="{p["center_y"]+h/2}" text-anchor="middle" font-family="sans-serif" font-size=".48">{escape(p["brand"])}</text>')
        for wc in layout["restrooms"]:
            if wc["prefix"] == prefix:
                rect(wc["center_x"]-wc["width"]/2, wc["front_y"], wc["width"], wc["depth"], "#a7d9c6")
        parts.append('</svg>')
        (directory / f"{code.lower()}-v{release}.svg").write_text("\n".join(parts), encoding="utf-8")


if __name__ == "__main__":
    catalog = build_catalog()
    print(f"Catálogo válido: {len(catalog['pois'])} destinos. Use scripts/export_navigation_scene.py no Blender para exportar os artefatos.")
