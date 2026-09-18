"""Validate floor images before serving them from the application origin."""
import io
import re
import xml.etree.ElementTree as ET
from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError

MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def validate_image(data: bytes, extension: str) -> None:
    if not data or len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Envie uma imagem não vazia de até 5 MB")
    if extension == ".svg":
        try:
            content = data.decode("utf-8")
            if re.search(r"<!DOCTYPE|<!ENTITY", content, re.I):
                raise ValueError("Declarações externas não são permitidas")
            root = ET.fromstring(content)
            if root.tag.split("}")[-1] != "svg":
                raise ValueError("O arquivo não é SVG")
            allowed = {"svg", "g", "defs", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "title", "desc", "clipPath", "mask", "linearGradient", "radialGradient", "stop", "use", "symbol", "pattern", "marker", "style"}
            for element in root.iter():
                if element.tag.split("}")[-1] not in allowed:
                    raise ValueError("O SVG contém conteúdo ativo ou externo")
                for name, value in element.attrib.items():
                    name = name.split("}")[-1].lower()
                    if name.startswith("on") or (name == "href" and not value.startswith("#")):
                        raise ValueError("O SVG contém conteúdo ativo ou externo")
            if re.search(r"@import|expression\s*\(|javascript:|url\s*\(\s*['\"]?(?!#)", content, re.I):
                raise ValueError("O SVG contém referências externas")
        except (UnicodeError, ET.ParseError, ValueError) as error:
            raise HTTPException(400, "SVG inválido ou não seguro: " + str(error)) from error
    else:
        try:
            with Image.open(io.BytesIO(data)) as image:
                expected = {".png": "PNG", ".jpg": "JPEG", ".jpeg": "JPEG", ".webp": "WEBP"}
                if image.format != expected.get(extension) or image.width * image.height > 25_000_000:
                    raise ValueError("Formato ou dimensões inválidas")
                image.verify()
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as error:
            raise HTTPException(400, "Arquivo não é uma imagem válida ou excede 25 megapixels") from error
