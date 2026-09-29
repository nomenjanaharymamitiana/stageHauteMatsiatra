import os
import shutil
import uuid
from datetime import date
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
import models
import schemas

UPLOAD_DIR = "./uploaded_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def create_log(db: Session, desc: str, im_user: str, num_ref_doc: Optional[str] = None):
    """Fonction utilitaire pour enregistrer une action dans le Journal."""
    log_entry = models.Journal(
        id_jour=str(uuid.uuid4())[:8],
        date_action=date.today(),
        desc=desc,
        num_ref_doc=num_ref_doc,
        im_user=im_user
    )
    db.add(log_entry)

def get_agent_dag_rh(db: Session, im_dag_rh: str):
    return db.query(models.Utilisateur).filter(models.Utilisateur.im == im_dag_rh).first()

def get_document_by_ref(db: Session, num_ref: str):
    return db.query(models.Document).filter(models.Document.num_ref == num_ref).first()

def create_document(
    db: Session,
    num_ref: str,
    date_num: date,
    cat: str,
    annee_redac: str,
    title: str,
    im_dag_rh: str,
    file: UploadFile
):
    agent = get_agent_dag_rh(db, im_dag_rh)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"L'agent DAG/RH avec le matricule '{im_dag_rh}' n'existe pas."
        )

    db_doc = get_document_by_ref(db, num_ref)
    if db_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Un document avec cette référence existe déjà."
        )

    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "inconnu"
    file_name = f"{num_ref}_{file.filename}"
    saved_path = os.path.join(UPLOAD_DIR, file_name)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_doc = models.Document(
        num_ref=num_ref,
        date_num=date_num,
        format=file_ext,
        cat=cat,
        annee_redac=annee_redac,
        title=title,
        file_path=saved_path,
        im_dag_rh=im_dag_rh,
        est_sup=False
    )
    db.add(new_doc)
    
    # Journalisation
    create_log(db, f"Ajout du document {num_ref}", im_dag_rh, num_ref)
    
    db.commit()
    db.refresh(new_doc)
    return new_doc

def log_document_action(db: Session, num_ref: str, im_user: str, action_desc: str):
    """Permet de journaliser des actions comme la consultation ou le téléchargement."""
    create_log(db, f"{action_desc} du document {num_ref}", im_user, num_ref)
    db.commit()

def search_documents(
    db: Session,
    num_ref: Optional[str] = None,
    cat: Optional[str] = None,
    annee_redac: Optional[str] = None,  
    file_format: Optional[str] = None,
    title: Optional[str] = None
) -> List[models.Document]:
    query = db.query(models.Document).filter(models.Document.est_sup == False)

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

def get_all_documents(db: Session, skip: int = 0, limit: int = 50) -> List[models.Document]:
    return (
        db.query(models.Document)
        .filter(models.Document.est_sup == False)
        .order_by(models.Document.date_num.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_documents_by_user(db: Session, im_user: str, skip: int = 0, limit: int = 50) -> List[models.Document]:
    return (
        db.query(models.Document)
        .filter(models.Document.im_dag_rh == im_user, models.Document.est_sup == False)
        .order_by(models.Document.date_num.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_trash_documents(db: Session) -> List[models.Document]:
    return (
        db.query(models.Document)
        .filter(models.Document.est_sup == True)
        .order_by(models.Document.date_num.desc())
        .all()
    )

def soft_delete_document(db: Session, num_ref: str, im_user: str):
    doc = db.query(models.Document).filter(models.Document.num_ref == num_ref, models.Document.est_sup == False).first()
    if not doc:
        return None

    doc.est_sup = True
    
    # Journalisation
    create_log(db, f"Mise en corbeille du document {num_ref}", im_user, num_ref)

    db.commit()
    db.refresh(doc)
    return doc

def restore_document(db: Session, num_ref: str, im_user: str):
    doc = db.query(models.Document).filter(models.Document.num_ref == num_ref, models.Document.est_sup == True).first()
    if not doc:
        return None

    doc.est_sup = False

    # Journalisation
    create_log(db, f"Restauration du document {num_ref}", im_user, num_ref)

    db.commit()
    db.refresh(doc)
    return doc

def hard_delete_document(db: Session, num_ref: str, im_user: str):
    doc = get_document_by_ref(db, num_ref)
    if not doc:
        return False

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    # Journalisation (num_ref_doc à None car le document est définitivement supprimé)
    create_log(db, f"Suppression définitive du document {num_ref}", im_user, None)

    db.delete(doc)
    db.commit()
    return True

def update_document(db: Session, num_ref: str, doc_update: schemas.DocumentUpdate, im_user: str):
    db_doc = db.query(models.Document).filter(models.Document.num_ref == num_ref, models.Document.est_sup == False).first()
    if not db_doc:
        return None

    update_data = doc_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_doc, key, value)

    # Journalisation
    create_log(db, f"Mise à jour des informations du document {num_ref}", im_user, num_ref)

    db.commit()
    db.refresh(db_doc)
    return db_doc