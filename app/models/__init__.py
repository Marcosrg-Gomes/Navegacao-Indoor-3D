"""
Módulo de inicialização dos modelos SQLAlchemy.
"""
from app.models.shopping import Shopping
from app.models.piso import Piso
from app.models.no import No
from app.models.aresta import Aresta
from app.models.loja import Loja
from app.models.categoria import Categoria
from app.models.qr_code import QRCode

__all__ = [
    "Shopping",
    "Piso",
    "No",
    "Aresta",
    "Loja",
    "Categoria",
    "QRCode",
]
