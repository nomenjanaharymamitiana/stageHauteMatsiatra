import enum

from sqlalchemy import Boolean, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RoleUtilisateur(str, enum.Enum):
    """Correspond a l'heritage Utlisateur -> RSI / DAG_RH du diagramme de classes."""
    RSI = "RSI"
    DAG_RH = "DAG_RH"


class Utilisateur(Base):
    """
    Classe Utlisateur du diagramme (id, im, nom, prenom, mdp).

    Note : "im" du diagramme est interprete ici comme l'identifiant de connexion
    (login), distinct de la cle primaire technique "id".
    """
    __tablename__ = "utilisateurs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    identifiant: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    nom: Mapped[str] = mapped_column(String(50), nullable=False)
    prenom: Mapped[str] = mapped_column(String(50), nullable=False)
    mdp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleUtilisateur] = mapped_column(Enum(RoleUtilisateur), nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    documents = relationship("Document", back_populates="ajoute_par", cascade="all, delete-orphan")
    actions_journal = relationship("Journal", back_populates="utilisateur", cascade="all, delete-orphan")
