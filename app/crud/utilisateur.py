from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hacher_mot_de_passe, verifier_mot_de_passe
from app.models.utilisateur import DAG_RH, RSI, Utilisateur
from app.schemas.utilisateur import UtilisateurCreation

TABLES_PAR_ROLE = {"dag_rh": DAG_RH, "rsi": RSI}


def get_by_im(db: Session, im: str) -> Utilisateur | None:
    return db.get(Utilisateur, im)


def authenticate(db: Session, im: str, mdp: str) -> Utilisateur | None:
    """
    Equivalent de crud/auth.py::authenticate_user cote DAG, avec verification
    par hash (bcrypt) au lieu d'une comparaison en clair.
    """
    utilisateur = get_by_im(db, im)
    if not utilisateur or not verifier_mot_de_passe(mdp, utilisateur.mdp):
        return None
    return utilisateur


def lister(db: Session, skip: int = 0, limit: int = 100) -> list[Utilisateur]:
    return list(db.scalars(select(Utilisateur).offset(skip).limit(limit)))


def creer(db: Session, payload: UtilisateurCreation) -> Utilisateur:
    if payload.type_user not in TABLES_PAR_ROLE:
        raise ValueError("type_user doit etre 'dag_rh' ou 'rsi'")

    classe = TABLES_PAR_ROLE[payload.type_user]
    utilisateur = classe(
        im=payload.im,
        nom=payload.nom,
        prenom=payload.prenom,
        mdp=hacher_mot_de_passe(payload.mdp),
    )
    db.add(utilisateur)
    db.commit()
    db.refresh(utilisateur)
    return utilisateur


def changer_role(db: Session, im: str, nouveau_role: str) -> Utilisateur:
    """
    Cas d'utilisation RSI : Gerer acces et roles.

    L'heritage par tables jointes (utilisateur / dag_rh / rsi) ne permet pas
    de changer directement la classe polymorphique d'un objet existant : on
    supprime la ligne de l'ancienne table enfant et on insere une ligne dans
    la nouvelle, en conservant la ligne de la table mere "utilisateur"
    (donc le meme im, nom, prenom, mdp, actif).
    """
    if nouveau_role not in TABLES_PAR_ROLE:
        raise ValueError("type_user doit etre 'dag_rh' ou 'rsi'")

    utilisateur = get_by_im(db, im)
    if utilisateur is None:
        raise ValueError("Utilisateur introuvable")

    if utilisateur.type_user == nouveau_role:
        return utilisateur

    ancienne_classe = TABLES_PAR_ROLE[utilisateur.type_user]
    nouvelle_classe = TABLES_PAR_ROLE[nouveau_role]

    # Supprime la ligne enfant existante (dag_rh ou rsi) au niveau SQL, sans
    # passer par l'ORM sur la ligne mere : on veut seulement retirer la
    # sous-classe, pas l'utilisateur.
    db.execute(ancienne_classe.__table__.delete().where(ancienne_classe.im == im))

    db.execute(
        Utilisateur.__table__.update().where(Utilisateur.im == im).values(type_user=nouveau_role)
    )

    # Insertion directe au niveau SQL (et non db.add(nouvelle_classe(im=im)))
    # car un objet ORM fraichement cree serait traite comme une nouvelle
    # entite complete par SQLAlchemy, qui tenterait de re-inserer aussi la
    # ligne "utilisateur" (deja existante) avec des colonnes vides.
    db.execute(nouvelle_classe.__table__.insert().values(im=im))
    db.commit()

    db.expire_all()
    return get_by_im(db, im)


def changer_statut_actif(db: Session, im: str, actif: bool) -> Utilisateur:
    utilisateur = get_by_im(db, im)
    if utilisateur is None:
        raise ValueError("Utilisateur introuvable")
    utilisateur.actif = actif
    db.commit()
    db.refresh(utilisateur)
    return utilisateur
