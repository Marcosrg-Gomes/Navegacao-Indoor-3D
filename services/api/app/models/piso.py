"""
Modelo SQLAlchemy para Piso.
"""
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.codes import new_code


class Piso(Base):
    """
    Entidade que representa um Piso (andar) de um Shopping.
    """
    __tablename__ = "pisos"

    codigo: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, default=new_code)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    shopping_id: Mapped[int] = mapped_column(ForeignKey("shoppings.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    nivel: Mapped[int] = mapped_column(nullable=False)
    imagem_planta_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    largura_metros: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 2), nullable=True)
    altura_metros: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 2), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    atualizado_em: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    shopping: Mapped["Shopping"] = relationship("Shopping", back_populates="pisos")
    nos: Mapped[List["No"]] = relationship("No", back_populates="piso")
