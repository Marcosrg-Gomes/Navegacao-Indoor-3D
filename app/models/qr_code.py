"""
Modelo SQLAlchemy para QRCode.
"""
from typing import Optional
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QRCode(Base):
    """
    Entidade que representa um QR Code associado a um Nó.
    """
    __tablename__ = "qr_codes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    no_id: Mapped[int] = mapped_column(ForeignKey("nos.id"), unique=True, nullable=False)
    token: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    atualizado_em: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    no: Mapped["No"] = relationship("No", back_populates="qr_code")
