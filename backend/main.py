from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine
from routes import auth_router, document_router

# Création automatique des tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GED Haute Matsiatra - API DAG/RH", version="1.0.0")

# Autoriser les requêtes du frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routeurs
app.include_router(auth_router)
app.include_router(document_router)

@app.get("/")
def root():
    return {"message": "API GED Haute Matsiatra fonctionnelle"}