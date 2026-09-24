"""
Modelo SQLAlchemy para Loja.
"""
from typing import Optional
from datetime import datetime

from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.codes import new_code


class Loja(Base):
    """
    Entidade que representa uma Loja ou Ponto de Interesse.
    """
    __tablename__ = "lojas"

    codigo: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, default=new_code)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    no_id: Mapped[int] = mapped_column(ForeignKey("nos.id"), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"), nullable=False)
    horario_funcionamento: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    telefone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # ``ativo`` controls whether the record is published at all.  It must not
    # be used as a substitute for the visitor-facing operational state: a
    # closed or maintenance POI is still useful to show, along with a warning.
    status_operacional: Mapped[str] = mapped_column(
        String(20), nullable=False, default="aberto", server_default="aberto"
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    atualizado_em: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    no: Mapped["No"] = relationship("No", back_populates="loja")
    categoria: Mapped[Optional["Categoria"]] = relationship("Categoria", back_populates="lojas")

    @property
    def categoria_nome(self) -> Optional[str]:
        """Expose the category label required by the public POI contract."""
        return self.categoria.nome if self.categoria else None
