from fastapi import APIRouter, Depends, HTTPException, status
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