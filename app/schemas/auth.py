from pydantic import BaseModel


class LoginRequest(BaseModel):
    im: str
    mdp: str


class UserOut(BaseModel):
    im: str
    nom: str
    prenom: str
    type_user: str
    actif: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    """
    Ajout necessaire par rapport au backend DAG d'origine (qui ne renvoyait
    que UserOut, sans jeton) : le controle par role RSI / DAG_RH exige une
    preuve d'authentification a presenter sur chaque requete protegee.
    """
    access_token: str
    token_type: str = "bearer"
