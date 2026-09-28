from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import exiger_role_rsi
from app.db.session import get_db
from app.models.document import Document
from app.models.journal import Journal
from app.models.utilisateur import Utilisateur

router = APIRouter(
    prefix="/api/v1/rsi/dashboard",
    tags=["RSI - Tableau de bord"],
    dependencies=[Depends(exiger_role_rsi)],
)


@router.get("/stats")
def obtenir_statistiques(db: Session = Depends(get_db)):
    """Cas d'utilisation : suivre les donnees administratives / le fonctionnement general."""
    total_utilisateurs = db.scalar(select(func.count()).select_from(Utilisateur))
    utilisateurs_actifs = db.scalar(
        select(func.count()).select_from(Utilisateur).where(Utilisateur.actif.is_(True))
    )
    total_rsi = db.scalar(
        select(func.count()).select_from(Utilisateur).where(Utilisateur.type_user == "rsi")
    )
    total_dag_rh = db.scalar(
        select(func.count()).select_from(Utilisateur).where(Utilisateur.type_user == "dag_rh")
    )

    total_documents = db.scalar(
        select(func.count()).select_from(Document).where(Document.est_supprime.is_(False))
    )
    documents_supprimes = db.scalar(
        select(func.count()).select_from(Document).where(Document.est_supprime.is_(True))
    )

    categories = [row[0] for row in db.execute(
        select(Document.cat).where(Document.est_supprime.is_(False)).distinct()
    ).all()]
    documents_par_categorie = {
        cat: db.scalar(
            select(func.count()).select_from(Document)
            .where(Document.cat == cat, Document.est_supprime.is_(False))
        )
        for cat in categories
    }

    total_actions_journal = db.scalar(select(func.count()).select_from(Journal))

    return {
        "utilisateurs": {
            "total": total_utilisateurs, "actifs": utilisateurs_actifs,
            "rsi": total_rsi, "dag_rh": total_dag_rh,
        },
        "documents": {
            "total": total_documents, "supprimes": documents_supprimes,
            "par_categorie": documents_par_categorie,
        },
        "journal": {"total_actions": total_actions_journal},
    }
