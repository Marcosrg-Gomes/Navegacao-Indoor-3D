"""
Modelo SQLAlchemy para Nó (Node) do grafo.
"""
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import enum

from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TipoNo(str, enum.Enum):
    """
    Tipos válidos para um Nó.
    """
    corredor = "corredor"
    loja = "loja"
    entrada = "entrada"
    escada = "escada"
    elevador = "elevador"
    banheiro = "banheiro"
    saida = "saida"


class No(Base):
    """
    Entidade que representa um Nó (ponto) de navegação no piso.
    """
    __tablename__ = "nos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    piso_id: Mapped[int] = mapped_column(ForeignKey("pisos.id"), nullable=False)
    coord_x: Mapped[Decimal] = mapped_column(Numeric(10, 6), nullable=False)
    coord_y: Mapped[Decimal] = mapped_column(Numeric(10, 6), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    nome: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    atualizado_em: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    piso: Mapped["Piso"] = relationship("Piso", back_populates="nos")
    loja: Mapped[Optional["Loja"]] = relationship("Loja", back_populates="no", uselist=False)
    qr_code: Mapped[Optional["QRCode"]] = relationship("QRCode", back_populates="no", uselist=False)
    arestas_origem: Mapped[List["Aresta"]] = relationship("Aresta", foreign_keys="[Aresta.no_origem_id]", back_populates="no_origem")
    arestas_destino: Mapped[List["Aresta"]] = relationship("Aresta", foreign_keys="[Aresta.no_destino_id]", back_populates="no_destino")
