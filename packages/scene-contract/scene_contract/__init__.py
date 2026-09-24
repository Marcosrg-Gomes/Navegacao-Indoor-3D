"""Versioned spatial contract, shared by the API and Blender (stdlib only)."""
import json
import math
import re
import struct
from pathlib import Path

CODE = re.compile(r"^[A-Z][A-Z0-9_]{0,79}$")
TRANSITIONS = {"escada", "escada_rolante", "elevador"}


def finite_number(value):
    return type(value) in (int, float) and math.isfinite(value)


def transform(floor, x, y):
    return [floor["origin"][i] + x * floor["axis_x"][i] + y * floor["axis_y"][i]
            for i in range(3)]


def validate_catalog(catalog):
    """Reject malformed transforms, dangling links and unsafe asset paths."""
    errors = []
    try:
        if type(catalog["release"]) is not int or catalog["release"] < 1:
            errors.append("Release inválido")
        if not re.fullmatch(r"1\.\d+\.\d+", catalog["version"]):
            errors.append("Versão de contrato incompatível")
        if not CODE.fullmatch(catalog["shopping_code"]):
            errors.append("Código do shopping inválido")
        if not re.fullmatch(r"/static/models/mini-shopping/mini-shopping-v[1-9]\d*\.glb", catalog["model_url"]):
            errors.append("URL de modelo inválida")
        if catalog["model_url"] != f"/static/models/mini-shopping/mini-shopping-v{catalog['release']}.glb":
            errors.append("Modelo incompatível com o release")
        floors, anchors, pois = catalog["floors"], catalog["anchors"], catalog["pois"]
        if not floors or not anchors or not pois:
            errors.append("Catálogo vazio")
        for code, floor in floors.items():
            if type(floor["level"]) is not int or not isinstance(floor["name"], str):
                errors.append(f"Metadados de piso inválidos: {code}")
            if not CODE.fullmatch(code):
                errors.append(f"Piso inválido: {code}")
            for key in ("origin", "axis_x", "axis_y"):
                if len(floor[key]) != 3 or not all(finite_number(v) for v in floor[key]):
                    errors.append(f"Transform inválido: {code}/{key}")
            ax, ay = floor["axis_x"], floor["axis_y"]
            if ax[0] <= 0 or ay[2] >= 0 or ax[1:] != [0, 0] or ay[:2] != [0, 0]:
                errors.append(f"Eixos incompatíveis: {code}")
            if floor["origin"][0] != -ax[0] / 2 or floor["origin"][2] != -ay[2] / 2:
                errors.append(f"Origem incompatível: {code}")
        for code, anchor in anchors.items():
            if anchor["type"] not in TRANSITIONS | {"corredor", "loja", "entrada", "banheiro", "saida"} or not isinstance(anchor["name"], str) or not anchor["object_name"].startswith("NAV_"):
                errors.append(f"Metadados de âncora inválidos: {code}")
            if not CODE.fullmatch(code) or anchor["floor_code"] not in floors:
                errors.append(f"Âncora inválida: {code}")
            if not all(finite_number(anchor[k]) and 0 <= anchor[k] <= 1 for k in ("coord_x", "coord_y")):
                errors.append(f"Âncora fora do piso: {code}")
            expected = transform(floors[anchor["floor_code"]], anchor["coord_x"], anchor["coord_y"])
            if len(anchor["position"]) != 3 or not all(finite_number(v) for v in anchor["position"]) or any(abs(a - b) > 0.001 for a, b in zip(expected, anchor["position"])):
                errors.append(f"Posição divergente: {code}")
        for code, poi in pois.items():
            if poi["kind"] not in {"loja", "banheiro", "entrada"} or not all(isinstance(poi[k], str) and poi[k] for k in ("name", "category", "object_prefix")):
                errors.append(f"Metadados de POI inválidos: {code}")
            if not CODE.fullmatch(code) or poi["anchor_code"] not in anchors or not poi["object_prefix"]:
                errors.append(f"POI inválido: {code}")
        seen = set()
        for edge in catalog["edges"]:
            a, b = edge["from"], edge["to"]
            if type(edge["bidirectional"]) is not bool or type(edge["accessible"]) is not bool:
                errors.append(f"Direção/acessibilidade inválida: {a}/{b}")
            if a not in anchors or b not in anchors or a == b:
                errors.append(f"Aresta inválida: {a}/{b}")
                continue
            if (a, b) in seen or (edge["bidirectional"] and (b, a) in seen):
                errors.append(f"Aresta duplicada: {a}/{b}")
            seen.add((a, b))
            if edge["bidirectional"]:
                seen.add((b, a))
            if not finite_number(edge["distance"]) or edge["distance"] <= 0:
                errors.append(f"Distância inválida: {a}/{b}")
            source, target = anchors[a], anchors[b]
            if source["floor_code"] != target["floor_code"]:
                if source["type"] not in TRANSITIONS or source["type"] != target["type"]:
                    errors.append(f"Transição inválida: {a}/{b}")
                if source["type"] != "elevador" and edge["accessible"]:
                    errors.append(f"Escada acessível: {a}/{b}")
        for token, code in catalog["qr_codes"].items():
            if code not in anchors or not token.startswith("MINI-"):
                errors.append(f"QR inválido: {token}")
    except (KeyError, TypeError, ValueError, IndexError, AttributeError) as exc:
        errors.append(f"Estrutura de catálogo inválida: {exc}")
    if errors:
        raise ValueError("; ".join(errors))
    return catalog


def load_catalog(path):
    return validate_catalog(json.loads(Path(path).read_text(encoding="utf-8")))


def validate_model(catalog, data):
    """Check the actual GLB inventory, not only Blender's pre-export selection."""
    try:
        magic, version, length, chunk_length, chunk_type = struct.unpack_from("<4sIIII", data)
        if magic != b"glTF" or version != 2 or length != len(data) or chunk_type != 0x4E4F534A or 20 + chunk_length > length:
            raise ValueError("Cabeçalho GLB inválido")
        scene = json.loads(data[20:20 + chunk_length])
        names = {node.get("name", "") for node in scene["nodes"]}
        for code, poi in catalog["pois"].items():
            if not any(name.startswith(poi["object_prefix"]) for name in names):
                raise ValueError(f"POI ausente no GLB: {code}")
        if not set(catalog["exported_objects"]).issubset(names):
            raise ValueError("Inventário exportado divergente do GLB")
    except (KeyError, TypeError, AttributeError, struct.error) as exc:
        raise ValueError(f"Estrutura GLB inválida: {exc}") from exc
