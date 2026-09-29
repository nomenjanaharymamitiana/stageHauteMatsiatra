import os
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from .auth import get_current_user
import schemas
from crud import document as crud_document
from database import get_db

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

def get_user_im(current_user) -> str:
    user_im = getattr(current_user, "im", None) or getattr(current_user, "im_dag_rh", None)
    if not user_im:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Matricule utilisateur introuvable."
        )
    return user_im

@router.post("/upload", response_model=schemas.DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    num_ref: str = Form(...),
    date_num: date = Form(...),
    cat: str = Form(...),
    annee_redac: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_im = get_user_im(current_user)

    return crud_document.create_document(
        db=db,
        num_ref=num_ref,
        date_num=date_num,
        cat=cat,
        annee_redac=annee_redac,
        title=title,
        im_dag_rh=user_im,
        file=file
    )

@router.get("/me", response_model=List[schemas.DocumentOut])
def list_my_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_im = get_user_im(current_user)
    return crud_document.get_documents_by_user(db=db, im_user=user_im, skip=skip, limit=limit)

@router.get("/search", response_model=List[schemas.DocumentOut])
def search_documents(
    num_ref: Optional[str] = None,
    cat: Optional[str] = None,
    annee_redac: Optional[str] = None,
    file_format: Optional[str] = None,
    title: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud_document.search_documents(
        db=db,
        num_ref=num_ref,
        cat=cat,
        annee_redac=annee_redac,
        file_format=file_format,
        title=title
    )

# --- ROUTES CORBEILLE ---

@router.get("/trash", response_model=List[schemas.DocumentOut])
def list_trash_documents(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return crud_document.get_trash_documents(db=db)

@router.post("/{num_ref}/restore", response_model=schemas.DocumentOut, status_code=status.HTTP_200_OK)
def restore_document(
    num_ref: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_im = get_user_im(current_user)
    restored_doc = crud_document.restore_document(db=db, num_ref=num_ref, im_user=user_im)
    if not restored_doc:
        raise HTTPException(status_code=404, detail="Document introuvable dans la corbeille.")
    return restored_doc

@router.delete("/{num_ref}/hard", status_code=status.HTTP_200_OK)
def hard_delete_document(
    num_ref: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_im = get_user_im(current_user)
    success = crud_document.hard_delete_document(db=db, num_ref=num_ref, im_user=user_im)
    if not success:
        raise HTTPException(status_code=404, detail="Document introuvable pour la suppression définitive.")
    return {"message": f"Le document {num_ref} a été supprimé définitivement."}

# --- ROUTES CONSULTATION, TÉLÉCHARGEMENT & MODIFICATION ---

@router.get("/{num_ref}/preview")
def preview_document(
    num_ref: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_im = get_user_im(current_user)
    doc = crud_document.get_document_by_ref(db, num_ref)
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document introuvable sur le serveur.")

    # Enregistrement dans le journal de l'action "Consultation"
    crud_document.log_document_action(db=db, num_ref=num_ref, im_user=user_im, action_desc="Consultation/Aperçu")

    return FileResponse(path=doc.file_path, headers={"Content-Disposition": "inline"})

@router.get("/{num_ref}/download")
def download_document(
    num_ref: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_im = get_user_im(current_user)
    doc = crud_document.get_document_by_ref(db, num_ref)
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document introuvable sur le serveur.")

    # Enregistrement dans le journal de l'action "Téléchargement"
    crud_document.log_document_action(db=db, num_ref=num_ref, im_user=user_im, action_desc="Téléchargement")

    filename = os.path.basename(doc.file_path)
    return FileResponse(path=doc.file_path, filename=filename, headers={"Content-Disposition": f"attachment; filename={filename}"})

@router.delete("/{num_ref}", status_code=status.HTTP_200_OK)
def delete_document(
    num_ref: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_im = get_user_im(current_user)
    deleted_doc = crud_document.soft_delete_document(db=db, num_ref=num_ref, im_user=user_im)
    if not deleted_doc:
        raise HTTPException(status_code=404, detail="Document introuvable ou déjà supprimé.")
    return {"message": f"Le document {num_ref} a été placé dans la corbeille."}

@router.get("/", response_model=List[schemas.DocumentOut])
def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    return crud_document.get_all_documents(db=db, skip=skip, limit=limit)

@router.put("/{num_ref}", response_model=schemas.DocumentOut, status_code=status.HTTP_200_OK)
def update_document(
    num_ref: str,
    doc_update: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_im = get_user_im(current_user)
    updated_doc = crud_document.update_document(db=db, num_ref=num_ref, doc_update=doc_update, im_user=user_im)
    if not updated_doc:
        raise HTTPException(status_code=404, detail="Document introuvable sur le serveur.")
    return updated_doc