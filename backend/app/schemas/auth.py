from pydantic import BaseModel


class ConnexionPayload(BaseModel):
    identifiant: str
    mdp: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
