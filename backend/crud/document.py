import os
import shutil
import uuid
from datetime import date
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
import models

UPLOAD_DIR = "./uploaded_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_agent_dag_rh(db: Session, im_dag_rh: str):
    return db.query(models.DAG_RH).filter(models.DAG_RH.im == im_dag_rh).first()

def get_document_by_ref(db: Session, num_ref: str):
    return db.query(models.Document).filter(models.Document.num_ref == num_ref).first()

def create_document(
    db: Session,
    num_ref: str,
    date_num: date,
    cat: str,
    annee_redac: date,
    title: str,
    im_dag_rh: str,
    file: UploadFile
):
    # 1. Vérifier si l'agent DAG/RH existe
    agent = get_agent_dag_rh(db, im_dag_rh)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"L'agent DAG/RH avec le matricule '{im_dag_rh}' n'existe pas."
        )

    # 2. Vérifier si le document existe déjà
    db_doc = get_document_by_ref(db, num_ref)
    if db_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Un document avec cette référence existe déjà."
        )

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
        id_jour=str(uuid.uuid4()),
        date_action=date.today(),
        desc=f"Ajout du document {num_ref} par l'agent {im_dag_rh}",
        num_ref_doc=num_ref,
        im_user=im_dag_rh
    )
    db.add(log_entry)
    
    db.commit()
    db.refresh(new_doc)
    return new_doc

def search_documents(
    db: Session,
    num_ref: Optional[str] = None,
    cat: Optional[str] = None,
    annee_redac: Optional[date] = None,
    file_format: Optional[str] = None,
    title: Optional[str] = None
) -> List[models.Document]:
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

def delete_document(db: Session, num_ref: str):
    doc = get_document_by_ref(db, num_ref)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document non trouvé.")

    # Suppression du fichier physique
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    # Trace dans le Journal
    log_entry = models.Journal(
        id_jour=str(uuid.uuid4()),
        date_action=date.today(),
        desc=f"Suppression du document {num_ref}",
        num_ref_doc=None,
        im_user="SYSTEM"
    )
    db.add(log_entry)

    db.delete(doc)
    db.commit()
    return {"message": f"Document {num_ref} supprimé avec succès."}

def get_all_documents(db: Session, skip: int = 0, limit: int = 50) -> List[models.Document]:
    return (
        db.query(models.Document)
        .order_by(models.Document.date_num.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )