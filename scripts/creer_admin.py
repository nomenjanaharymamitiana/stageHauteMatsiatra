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
from app.crud.utilisateur import get_by_im, creer
from app.schemas.utilisateur import UtilisateurCreation


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    im = input("Matricule / identifiant (im) du RSI : ").strip()
    if get_by_im(db, im):
        print("Un utilisateur avec ce matricule existe deja.")
        return

    nom = input("Nom : ").strip()
    prenom = input("Prenom : ").strip()
    mdp = getpass.getpass("Mot de passe : ")

    payload = UtilisateurCreation(im=im, nom=nom, prenom=prenom, mdp=mdp, type_user="rsi")
    utilisateur = creer(db, payload)
    print(f"Compte RSI cree avec succes : {utilisateur.im}")


if __name__ == "__main__":
    main()
