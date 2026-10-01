from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import exiger_role_rsi
from app.db.session import get_db
from app.models.document import CategorieDocument, Document
from app.models.journal import Journal
from app.models.utilisateur import RoleUtilisateur, Utilisateur

router = APIRouter(
    prefix="/rsi/dashboard",
    tags=["RSI - Tableau de bord"],
    dependencies=[Depends(exiger_role_rsi)],
)


@router.get("/stats")
def obtenir_statistiques(db: Session = Depends(get_db)):
    """
    Cas d'utilisation : suivre les donnees administratives + suivre le
    fonctionnement general de l'application.
    """
    total_utilisateurs = db.scalar(select(func.count()).select_from(Utilisateur))
    utilisateurs_actifs = db.scalar(
        select(func.count()).select_from(Utilisateur).where(Utilisateur.actif.is_(True))
    )
    total_rsi = db.scalar(
        select(func.count()).select_from(Utilisateur).where(Utilisateur.role == RoleUtilisateur.RSI)
    )
    total_dag_rh = db.scalar(
        select(func.count()).select_from(Utilisateur).where(Utilisateur.role == RoleUtilisateur.DAG_RH)
    )

    total_documents = db.scalar(select(func.count()).select_from(Document))
    documents_supprimes = db.scalar(
        select(func.count()).select_from(Document).where(Document.est_supprime.is_(True))
    )

    documents_par_categorie = {
        categorie.value: db.scalar(
            select(func.count()).select_from(Document).where(Document.cat == categorie)
        )
        for categorie in CategorieDocument
    }

    total_actions_journal = db.scalar(select(func.count()).select_from(Journal))

    return {
        "utilisateurs": {
            "total": total_utilisateurs,
            "actifs": utilisateurs_actifs,
            "rsi": total_rsi,
            "dag_rh": total_dag_rh,
        },
        "documents": {
            "total": total_documents,
            "supprimes": documents_supprimes,
            "par_categorie": documents_par_categorie,
        },
        "journal": {
            "total_actions": total_actions_journal,
        },
    }
