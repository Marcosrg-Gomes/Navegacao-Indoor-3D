"""Validate candidate artifacts and database before atomically activating a release."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from app.database import SessionLocal
from app.models import Shopping
from app.scene_contract import load_catalog, validate_model
from app.services.scenes import MODELS_DIR, inspect_scene


def publish_scene(db, catalog_path, models_dir=MODELS_DIR):
    catalog_path = Path(catalog_path)
    catalog = load_catalog(catalog_path)
    if catalog_path.name != f"scene-catalog-v{catalog['release']}.json":
        raise ValueError("Nome do catálogo incompatível com o release")
    model = catalog_path.parent / Path(catalog["model_url"]).name
    data = model.read_bytes()
    if len(data) != catalog.get("model_bytes") or len(data) > 25 * 1024 * 1024 or hashlib.sha256(data).hexdigest() != catalog.get("model_sha256"):
        raise ValueError("GLB não corresponde ao catálogo ou excede orçamento")
    validate_model(catalog, data)
    shopping = db.query(Shopping).filter_by(codigo=catalog["shopping_code"], ativo=True).one()
    report, _, _, _ = inspect_scene(db, shopping, catalog, routes=True)
    if not report["valid"] or report["unreachable_pois"] or report["inaccessible_pois"]:
        raise ValueError(f"Publicação rejeitada: {report}")
    destination = models_dir / "mini-shopping"
    destination.mkdir(parents=True, exist_ok=True)
    target_catalog = destination / catalog_path.name
    if target_catalog.exists():
        previous = load_catalog(target_catalog)
        candidate = dict(catalog)
        candidate["published_at"] = previous.get("published_at")
        if previous != candidate:
            raise ValueError("Versão já publicada. Exporte outro número de release.")
        catalog = previous
    else:
        catalog["published_at"] = datetime.now(timezone.utc).isoformat()
    payloads = {model.name: data, catalog_path.name: (json.dumps(catalog, ensure_ascii=False, indent=2)+"\n").encode()}
    for floor in catalog["floors"]:
        name = f"{floor.lower()}-v{catalog['release']}.svg"
        payloads[name] = (catalog_path.parent / name).read_bytes()
    # Validate every artifact before writing any of them or changing the active release.
    for filename, content in payloads.items():
        target = destination / filename
        if target.exists() and target.read_bytes() != content:
            raise ValueError(f"Não é permitido substituir uma versão: {filename}")
    for filename, content in payloads.items():
        target = destination / filename
        target.write_bytes(content)
    registry = models_dir / "published-scenes.json"
    active = json.loads(registry.read_text(encoding="utf-8")) if registry.exists() else {}
    active[shopping.codigo] = "mini-shopping/" + catalog_path.name
    temporary = registry.with_suffix(".tmp")
    temporary.write_text(json.dumps(active, indent=2)+"\n", encoding="utf-8")
    temporary.replace(registry)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("catalog", type=Path)
    args = parser.parse_args()
    with SessionLocal() as db:
        print(json.dumps(publish_scene(db, args.catalog), ensure_ascii=False, indent=2))
