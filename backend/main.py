import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine
from routes import auth_router, document_router
from routes.utlisateur import router as utilisateur_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="GED Haute Matsiatra - API DAG/RH",
    version="1.0.0",
    lifespan=lifespan
)

# --- LISTE DES ORIGINES ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# Récupération de l'URL frontend explicite si définie
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    # allow_origins explicite pour les domaines connus
    allow_origins=origins,
    # allow_origin_regex permet d'accepter l'IP publique ou les sous-domaines (Render, etc.) 
    # tout en respectant l'exigence de allow_credentials=True (pas de wildcard "*")
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INCLUSION DES ROUTEURS ---
app.include_router(auth_router)
app.include_router(document_router)
app.include_router(utilisateur_router)


@app.get("/")
def root():
    return {"message": "API GED Haute Matsiatra fonctionnelle"}