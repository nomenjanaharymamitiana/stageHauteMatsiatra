import os
import shutil
import uuid
from typing import List, Optional
from datetime import date
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db

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

UPLOAD_DIR = "./uploaded_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)
#login 
@app.post("/api/v1/auth/login", response_model=schemas.UserOut)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Recherche de l'utilisateur par son matricule (im)
    user = db.query(models.Utilisateur).filter(models.Utilisateur.im == credentials.im).first()
    
    if not user or user.mdp != credentials.mdp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Matricule ou mot de passe incorrect."
        )
    
    return user
## --- 1. TÉLÉVERSER (AJOUT DOCUMENT) ---
@app.post("/api/v1/documents/upload", response_model=schemas.DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    num_ref: str = Form(...),
    date_num: date = Form(...),
    cat: str = Form(...),
    annee_redac: date = Form(...),
    title: str = Form(...),
    im_dag_rh: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Vérifier si l'agent DAG/RH existe
    agent = db.query(models.DAG_RH).filter(models.DAG_RH.im == im_dag_rh).first()
    if not agent:
        raise HTTPException(
            status_code=400, 
            detail=f"L'agent DAG/RH avec le matricule '{im_dag_rh}' n'existe pas."
        )

    # 2. Vérifier si le document existe déjà
    db_doc = db.query(models.Document).filter(models.Document.num_ref == num_ref).first()
    if db_doc:
        raise HTTPException(status_code=400, detail="Un document avec cette référence existe déjà.")

    # 3. Sauvegarder le fichier sur le disque
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "inconnu"
    file_name = f"{num_ref}_{file.filename}"
    saved_path = os.path.join(UPLOAD_DIR, file_name)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4. Enregistrer le document
    new_doc = models.Document(
        num_ref=num_ref,
        date_num=date_num,
        format=file_ext,
        cat=cat,
        annee_redac=annee_redac,
        title=title,
        file_path=saved_path,
        im_dag_rh=im_dag_rh
    )
    db.add(new_doc)
    
    # 5. Traçabilité dans le Journal
    log_entry = models.Journal(
        id_jour=str(uuid.uuid4()),  # Sécurité explicite pour l'UUID
        date_action=date.today(),
        desc=f"Ajout du document {num_ref} par l'agent {im_dag_rh}",
        num_ref_doc=num_ref,
        im_user=im_dag_rh
    )
    db.add(log_entry)
    
    db.commit()
    db.refresh(new_doc)
    return new_doc
# --- 2. RECHERCHE MULTICRITÈRE ---
@app.get("/api/v1/documents/search", response_model=List[schemas.DocumentOut])
def search_documents(
    num_ref: Optional[str] = None,
    cat: Optional[str] = None,
    annee_redac: Optional[date] = None,  # Changé en date
    file_format: Optional[str] = None,
    title: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Document)

    if num_ref:
        query = query.filter(models.Document.num_ref.ilike(f"%{num_ref}%"))
    if cat:
        query = query.filter(models.Document.cat == cat)
    if annee_redac:
        query = query.filter(models.Document.annee_redac == annee_redac)
    if file_format:
        query = query.filter(models.Document.format == file_format.lower())
    if title:
        query = query.filter(models.Document.title.ilike(f"%{title}%"))

    return query.all()


# --- 3. CONSULTER / APERÇU (INLINE PDF/IMAGE) ---
@app.get("/api/v1/documents/{num_ref}/preview")
def preview_document(num_ref: str, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.num_ref == num_ref).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document introuvable sur le serveur.")

    return FileResponse(
        path=doc.file_path,
        headers={"Content-Disposition": "inline"}
    )


# --- 4. TÉLÉCHARGER (ATTACHMENT) ---
@app.get("/api/v1/documents/{num_ref}/download")
def download_document(num_ref: str, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.num_ref == num_ref).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document introuvable sur le serveur.")

    filename = os.path.basename(doc.file_path)
    return FileResponse(
        path=doc.file_path,
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# --- 5. SUPPRIMER DOCUMENT ---
@app.delete("/api/v1/documents/{num_ref}", status_code=status.HTTP_200_OK)
def delete_document(num_ref: str, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.num_ref == num_ref).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    # Suppression du fichier physique
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    # Trace dans le Journal
    log_entry = models.Journal(
        desc=f"Suppression du document {num_ref}",
        num_ref_doc=None
    )
    db.add(log_entry)

    db.delete(doc)
    db.commit()
    return {"message": f"Document {num_ref} supprimé avec succès."}