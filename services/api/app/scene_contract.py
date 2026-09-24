"""Load the shared, dependency-free contract from the monorepo."""
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT / "packages/scene-contract"))
from scene_contract import load_catalog, transform, validate_catalog, validate_model

__all__ = ["REPO_ROOT", "load_catalog", "transform", "validate_catalog", "validate_model"]
