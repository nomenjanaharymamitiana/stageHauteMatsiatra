from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import schemas
from crud import auth as crud_auth
from database import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["Authentification"])


@router.post("/login", response_model=schemas.UserOut)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud_auth.authenticate_user(db, credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Matricule ou mot de passe incorrect."
        )
    return user


# --- Dépendance pour récupérer l'utilisateur actuellement connecté ---
def get_current_user(
    authorization: str = Header(None, alias="Authorization"),
    x_user_im: str = Header(None, alias="X-User-IM"),
    db: Session = Depends(get_db)
):
    """
    Récupère l'agent connecté en lisant soit le token Bearer (qui contient le matricule IM),
    soit un en-tête personnalisé X-User-IM.
    """
    user_im = None

    if authorization and authorization.startswith("Bearer "):
        user_im = authorization.split(" ")[1]
    elif x_user_im:
        user_im = x_user_im

    if not user_im:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton d'authentification ou matricule manquant."
        )

    # Recherche de l'utilisateur dans la base de données via son IM
    user = crud_auth.get_user_by_im(db, im=user_im)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé ou session invalide."
        )

    return user