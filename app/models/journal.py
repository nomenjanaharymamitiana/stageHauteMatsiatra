import uuid
from datetime import date

from sqlalchemy import Column, Date, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Journal(Base):
    """Notation reprise telle quelle du backend DAG/RH."""
    __tablename__ = "journal"

    id_jour = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    date_action = Column(Date, nullable=False, default=date.today)
    desc = Column("desc", Text, nullable=True)

    im_user = Column(String(50), ForeignKey("utilisateur.im"), nullable=False)
    num_ref_doc = Column(String(100), ForeignKey("documents.num_ref"), nullable=True)

    document = relationship("Document", back_populates="journals")
