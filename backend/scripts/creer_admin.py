"""
Script a executer une seule fois pour creer le premier compte RSI.

Usage :
    python -m scripts.creer_admin
"""
import getpass
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.utilisateur import RoleUtilisateur
from app.crud.utilisateur import obtenir_par_identifiant, creer
from app.schemas.utilisateur import UtilisateurCreation


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    identifiant = input("Identifiant du RSI : ").strip()
    if obtenir_par_identifiant(db, identifiant):
        print("Un utilisateur avec cet identifiant existe deja.")
        return

    nom = input("Nom : ").strip()
    prenom = input("Prenom : ").strip()
    mdp = getpass.getpass("Mot de passe : ")

    payload = UtilisateurCreation(
        identifiant=identifiant, nom=nom, prenom=prenom, mdp=mdp, role=RoleUtilisateur.RSI
    )
    utilisateur = creer(db, payload)
    print(f"Compte RSI cree avec succes : {utilisateur.identifiant} (id={utilisateur.id})")


if __name__ == "__main__":
    main()
