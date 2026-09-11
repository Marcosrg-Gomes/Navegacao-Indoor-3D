"""
Modelo SQLAlchemy para Categoria.
"""
from typing import List, Optional
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Categoria(Base):
    """
    Entidade que representa uma Categoria de Loja.
    """
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icone: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    lojas: Mapped[List["Loja"]] = relationship("Loja", back_populates="categoria")
