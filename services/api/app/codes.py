"""Persistent codes also support older clients which omit the new field."""
from typing import Annotated
from uuid import uuid4
from pydantic import StringConstraints

Code = Annotated[str, StringConstraints(pattern=r"^[A-Z][A-Z0-9_]{0,79}$")]


def new_code():
    return "AUTO_" + uuid4().hex.upper()
