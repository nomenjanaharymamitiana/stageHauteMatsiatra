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
@router.post("/upload", response_model=schemas.DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    num_ref: str = Form(...),
    date_num: date = Form(...),
    cat: str = Form(...),
    annee_redac: date = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Récupère l'agent authentifié depuis le Token
):
    # Récupération automatique du matricule
    im_dag_rh = getattr(current_user, "im", None) or getattr(current_user, "im_dag_rh", None)

    if not im_dag_rh:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de déterminer le matricule de l'agent connecté."
        )

    return crud_document.create_document(
        db=db,
        num_ref=num_ref,
        date_num=date_num,
        cat=cat,
        annee_redac=annee_redac,
        title=title,
        im_dag_rh=im_dag_rh,
        file=file
    )

@router.get("/search", response_model=List[schemas.DocumentOut])
def search_documents(
    num_ref: Optional[str] = None,
    cat: Optional[str] = None,
    annee_redac: Optional[date] = None,
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

@router.get("/{num_ref}/preview")
def preview_document(num_ref: str, db: Session = Depends(get_db)):
    doc = crud_document.get_document_file_path(db, num_ref) if hasattr(crud_document, 'get_document_file_path') else crud_document.get_document_by_ref(db, num_ref)
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document introuvable sur le serveur.")

    return FileResponse(
        path=doc.file_path,
        headers={"Content-Disposition": "inline"}
    )

@router.get("/{num_ref}/download")
def download_document(num_ref: str, db: Session = Depends(get_db)):
    doc = crud_document.get_document_by_ref(db, num_ref)
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document introuvable sur le serveur.")

    filename = os.path.basename(doc.file_path)
    return FileResponse(
        path=doc.file_path,
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
@router.delete("/{num_ref}", status_code=status.HTTP_200_OK)
def delete_document(
    num_ref: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Extraction automatique de l'utilisateur
):
    user_im = getattr(current_user, "im", None) or getattr(current_user, "im_dag_rh", None)
    
    if not user_im:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Matricule utilisateur introuvable."
        )

    return crud_document.delete_document(db=db, num_ref=num_ref, im_user=user_im)

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
    """
    Met à jour les métadonnées (titre, catégorie, année de rédaction) d'un document existant.
    """
    updated_doc = crud_document.update_document(
        db=db, 
        num_ref=num_ref, 
        doc_update=doc_update
    )
    
    if not updated_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Document introuvable sur le serveur."
        )

    return updated_doc