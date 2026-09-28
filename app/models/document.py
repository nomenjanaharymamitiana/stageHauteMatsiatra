from sqlalchemy import Boolean, Column, Date, ForeignKey, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Document(Base):
    """Notation reprise du backend DAG/RH : num_ref est la cle primaire."""
    __tablename__ = "documents"

    num_ref = Column(String(100), primary_key=True, index=True)
    date_num = Column(Date, nullable=False)
    format = Column(String(20), nullable=False)
    cat = Column(String(100), nullable=False)
    annee_redac = Column(Date, nullable=False)

    title = Column(String(255), nullable=False, default="Sans titre")
    file_path = Column(String(500), nullable=False)

    # Ajout necessaire (absent du schema DAG d'origine) pour le cas
    # d'utilisation RSI "Restaurer doc" : le backend DAG d'origine supprimait
    # physiquement le fichier et la ligne, ce qui rend toute restauration
    # impossible. La suppression cote DAG/RH devient donc logique
    # (est_supprime=True) ; seul le RSI peut ensuite restaurer.
    est_supprime = Column(Boolean, default=False, nullable=False)

    im_dag_rh = Column(String(50), ForeignKey("dag_rh.im"), nullable=True)
    dag_rh_rel = relationship("DAG_RH", back_populates="documents")

    journals = relationship("Journal", back_populates="document")
