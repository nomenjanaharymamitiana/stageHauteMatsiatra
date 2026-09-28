from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

from app.api.routes import auth, dagrh_documents, dashboard, documents, journal, utilisateurs
from app.db.base import Base
from app.db.session import engine

# Cree les tables si elles n'existent pas encore.
# Pour un vrai projet, prefer Alembic (migrations) a create_all en production.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GED Haute Matsiatra - API unifiee (RSI + DAG/RH)",
    description="Synthese des deux backends du projet : authentification, cote RSI "
    "(utilisateurs, roles, journal, restauration, tableau de bord) et cote DAG/RH "
    "(televerser, consulter, rechercher, telecharger/imprimer, supprimer des documents), "
    "avec aide IA optionnelle au remplissage.",
    version="1.0.0",
)

# Conserve du backend DAG d'origine : utile si le frontend est un jour servi
# separement (npm run dev sur un autre port) plutot que par ce meme serveur.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes API (prefixe /api/v1, convention reprise du backend DAG) ---
app.include_router(auth.router)
app.include_router(utilisateurs.router)
app.include_router(journal.router)
app.include_router(documents.router)        # /api/v1/rsi/documents (corbeille + restauration)
app.include_router(dagrh_documents.router)  # /api/v1/documents (cote client DAG/RH)
app.include_router(dashboard.router)


@app.get("/api", tags=["Racine"])
def racine():
    return {"message": "API GED Haute Matsiatra fonctionnelle"}


class SPAStaticFiles(StaticFiles):
    """
    Sert les fichiers statiques du build React, et retombe sur index.html
    pour toute route inconnue (ex. /rsi, /dagrh) afin que le routeur
    cote client (React Router) puisse la prendre en charge, y compris
    lors d'un acces direct par URL ou d'un rafraichissement de page.
    """

    async def get_response(self, path: str, scope: Scope):
        try:
            return await super().get_response(path, scope)
        except Exception:
            return await super().get_response("index.html", scope)


# --- Frontend statique (React, buildé avec Vite) ---
# Sert le dossier ../frontend/dist (genere par "npm run build") en tant que
# site statique. Une seule commande (uvicorn app.main:app) lance donc le
# backend ET le frontend.
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"

if FRONTEND_DIST_DIR.exists():
    app.mount("/", SPAStaticFiles(directory=str(FRONTEND_DIST_DIR), html=True), name="frontend")
