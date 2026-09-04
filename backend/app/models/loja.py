"""
Modelo SQLAlchemy para Loja.
"""
from typing import Optional
from datetime import datetime

from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Loja(Base):
    """
    Entidade que representa uma Loja ou Ponto de Interesse.
    """
    __tablename__ = "lojas"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    no_id: Mapped[int] = mapped_column(ForeignKey("nos.id"), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    categoria_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categorias.id"), nullable=True)
    horario_funcionamento: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    telefone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    atualizado_em: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    no: Mapped["No"] = relationship("No", back_populates="loja")
    categoria: Mapped[Optional["Categoria"]] = relationship("Categoria", back_populates="lojas")
