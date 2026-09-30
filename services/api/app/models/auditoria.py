from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Auditoria(Base):
    __tablename__ = "auditoria"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario: Mapped[str] = mapped_column(String(80))
    motivo: Mapped[str] = mapped_column(String(240))
    entidade: Mapped[str] = mapped_column(String(40), index=True)
    registro_id: Mapped[int] = mapped_column(Integer, index=True)
    acao: Mapped[str] = mapped_column(String(20))
    antes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    depois: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Diagnostico(Base):
    __tablename__ = "diagnosticos"

    tipo: Mapped[str] = mapped_column(String(20), primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), primary_key=True)
    ocorrencias: Mapped[int] = mapped_column(Integer, default=1)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
