from typing import ClassVar
from pydantic import BaseModel, ConfigDict, model_validator


class PatchModel(BaseModel):
    """Omit an unchanged field; explicit null is only valid for nullable data."""
    non_nullable: ClassVar[set[str]] = set()
    model_config = ConfigDict(allow_inf_nan=False)

    @model_validator(mode="before")
    @classmethod
    def reject_nulls(cls, data):
        if isinstance(data, dict):
            invalid = [name for name in cls.non_nullable if name in data and data[name] is None]
            if invalid:
                raise ValueError("Campos obrigatórios não aceitam null: " + ", ".join(sorted(invalid)))
        return data
