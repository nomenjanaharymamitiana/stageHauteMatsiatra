from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Journal(Base):
    """
    Classe Journal du diagramme (id_jour, date_action, desc).

    Relations :
    - "tracé par" : Journal (*) -- DAG/RH (1) -> utilisateur_id
    - "concerne"  : Journal (1) -- Documents (*) -> document_id
    - "Consulter" : RSI (0..*) -- Journal (1) -> lu en lecture seule par le RSI
    """
    __tablename__ = "journal"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    date_action: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    desc: Mapped[str] = mapped_column(String(255), nullable=False)

    utilisateur_id: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"), nullable=False)
    utilisateur = relationship("Utilisateur", back_populates="actions_journal")

    document_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id"), nullable=True)
    document = relationship("Document", back_populates="entrees_journal")
