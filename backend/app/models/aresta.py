"""
Modelo SQLAlchemy para Aresta.
"""
from typing import Optional
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Aresta(Base):
    """
    Entidade que representa uma Aresta (caminho) entre dois nós.
    """
    __tablename__ = "arestas"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    no_origem_id: Mapped[int] = mapped_column(ForeignKey("nos.id"), nullable=False)
    no_destino_id: Mapped[int] = mapped_column(ForeignKey("nos.id"), nullable=False)
    distancia: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    bidirecional: Mapped[bool] = mapped_column(Boolean, default=True)
    acessivel: Mapped[bool] = mapped_column(Boolean, default=True)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    atualizado_em: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    no_origem: Mapped["No"] = relationship("No", foreign_keys=[no_origem_id], back_populates="arestas_origem")
    no_destino: Mapped["No"] = relationship("No", foreign_keys=[no_destino_id], back_populates="arestas_destino")
