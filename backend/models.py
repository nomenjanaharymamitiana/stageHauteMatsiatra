import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# --- CLASSE MÈRE : Utilisateur ---
class Utilisateur(Base):
    __tablename__ = "utilisateur"

    im = Column(String(50), primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    mdp = Column(String(255), nullable=False)

    type_user = Column(String(20))
    __mapper_args__ = {
        "polymorphic_on": type_user,
        "polymorphic_identity": "utilisateur",
    }


# --- HÉRITAGE : DAG/RH ---
class DAG_RH(Utilisateur):
    __tablename__ = "dag_rh"

    im = Column(String(50), ForeignKey("utilisateur.im"), primary_key=True)
    documents = relationship("Document", back_populates="dag_rh_rel")

    __mapper_args__ = {
        "polymorphic_identity": "dag_rh",
    }


# --- HÉRITAGE : RSI ---
class RSI(Utilisateur):
    __tablename__ = "rsi"

    im = Column(String(50), ForeignKey("utilisateur.im"), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": "rsi",
    }


# --- CLASSE : Documents ---
class Document(Base):
    __tablename__ = "documents"

    num_ref = Column(String(100), primary_key=True, index=True)
    date_num = Column(Date, nullable=False)
    format = Column(String(20), nullable=False)
    cat = Column(String(100), nullable=False)
    annee_redac = Column(Date, nullable=False)

    title = Column(String(255), nullable=False, default="Sans titre")
    file_path = Column(String(500), nullable=False)

    im_dag_rh = Column(String(50), ForeignKey("dag_rh.im"), nullable=True)
    dag_rh_rel = relationship("DAG_RH", back_populates="documents")

    journals = relationship("Journal", back_populates="document")


# --- CLASSE : Journal ---
class Journal(Base):
    __tablename__ = "journal"

    # Clé primaire String (génération automatique d'un UUID)
    id_jour = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # PostgreSQL attend un type DATE pour date_action
    date_action = Column(Date, nullable=False, default=date.today)
    
    # Mappe l'attribut Python 'desc' directement sur la colonne SQL 'desc'
    desc = Column("desc", Text, nullable=True)

    im_user = Column(String(50), ForeignKey("utilisateur.im"), nullable=False)
    num_ref_doc = Column(String(100), ForeignKey("documents.num_ref"), nullable=True)

    document = relationship("Document", back_populates="journals")