import enum

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CategorieDocument(str, enum.Enum):
    """Les 3 categories fixes de classement : aucune autre valeur n'est autorisee."""
    NOMINATION = "NOMINATION"
    FINANCE = "FINANCE"
    DEVELOPPEMENT = "DEVELOPPEMENT"


class Document(Base):
    """Classe Documents du diagramme (num_ref, date_num, format, cat, annee_redac)."""
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    num_ref: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    date_num: Mapped["Date"] = mapped_column(Date, nullable=False)
    format: Mapped[str] = mapped_column(String(20), nullable=False)
    cat: Mapped[CategorieDocument] = mapped_column(Enum(CategorieDocument), nullable=False)
    annee_redac: Mapped["Date"] = mapped_column(Date, nullable=False)
    chemin_fichier: Mapped[str] = mapped_column(String(255), nullable=False)

    # Soft-delete : necessaire pour le cas d'utilisation "Restaurer doc" (RSI)
    est_supprime: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Association "manipuler" : DAG/RH (1..*) -- Documents (1..*)
    ajoute_par_id: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"), nullable=False)
    ajoute_par = relationship("Utilisateur", back_populates="documents")

    # Association "concerne" : Journal (1) -- Documents (*)
    entrees_journal = relationship("Journal", back_populates="document", cascade="all, delete-orphan")
