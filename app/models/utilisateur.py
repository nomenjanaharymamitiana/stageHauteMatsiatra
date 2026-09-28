from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Utilisateur(Base):
    """
    Classe mere, notation reprise telle quelle du backend DAG/RH :
    'im' sert a la fois de matricule/identifiant de connexion ET de cle
    primaire (pas d'id technique separe).
    """
    __tablename__ = "utilisateur"

    im = Column(String(50), primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    # Le nom de colonne "mdp" est conserve du schema DAG ; contrairement a la
    # version d'origine, elle stocke desormais un hash bcrypt et non le mot
    # de passe en clair (correction de securite, cf. app/core/security.py).
    mdp = Column(String(255), nullable=False)
    type_user = Column(String(20))

    # Ajout necessaire (absent du schema DAG d'origine) pour le cas
    # d'utilisation RSI "Gerer acces et roles" : desactiver un compte sans le
    # supprimer (et donc sans perdre l'historique du Journal).
    actif = Column(Boolean, default=True, nullable=False)

    __mapper_args__ = {
        "polymorphic_on": type_user,
        "polymorphic_identity": "utilisateur",
    }


class DAG_RH(Utilisateur):
    __tablename__ = "dag_rh"

    im = Column(String(50), ForeignKey("utilisateur.im"), primary_key=True)
    documents = relationship("Document", back_populates="dag_rh_rel")

    __mapper_args__ = {
        "polymorphic_identity": "dag_rh",
    }


class RSI(Utilisateur):
    __tablename__ = "rsi"

    im = Column(String(50), ForeignKey("utilisateur.im"), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": "rsi",
    }
