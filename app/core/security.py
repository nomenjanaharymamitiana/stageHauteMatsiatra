from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hacher_mot_de_passe(mdp_clair: str) -> str:
    """Hache un mot de passe en clair avant stockage en base."""
    return pwd_context.hash(mdp_clair)


def verifier_mot_de_passe(mdp_clair: str, mdp_hache: str) -> bool:
    """Verifie qu'un mot de passe en clair correspond au hash stocke."""
    return pwd_context.verify(mdp_clair, mdp_hache)


def creer_token_acces(sub: str, role: str) -> str:
    """Cree un token JWT contenant l'identifiant (sub) et le role de l'utilisateur."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": sub, "role": role, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decoder_token(token: str) -> dict:
    """Decode un token JWT. Leve une JWTError si le token est invalide ou expire."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
