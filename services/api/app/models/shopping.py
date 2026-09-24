"""
Modelo SQLAlchemy para Shopping.
"""
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Text, Numeric, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.codes import new_code


class Shopping(Base):
    """
    Entidade que representa um Shopping.
    """
    __tablename__ = "shoppings"

    codigo: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, default=new_code)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    endereco: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 8), nullable=True)
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(11, 8), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    atualizado_em: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    pisos: Mapped[List["Piso"]] = relationship("Piso", back_populates="shopping", lazy="selectin")
