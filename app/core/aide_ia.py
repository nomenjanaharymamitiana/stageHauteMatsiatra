import io
import json

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

PROMPT_SYSTEME = """Tu aides un agent administratif a classer un document.
Reponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format exact :
{"categorie": "NOMINATION" | "FINANCE" | "DEVELOPPEMENT", "date_probable": "AAAA-MM-JJ" ou null, "titre_suggere": "titre court du document", "resume": "resume en une phrase"}

Regles :
- NOMINATION : documents lies aux nominations, affectations, decisions de personnel.
- FINANCE : documents lies au budget, depenses, factures, subventions financieres.
- DEVELOPPEMENT : documents lies a des projets de developpement, infrastructures, rapports techniques.
- Si aucune date claire n'apparait dans le texte, mets "date_probable" a null.
- "titre_suggere" doit etre court (quelques mots), en francais, base sur l'objet du document.
- "resume" doit faire une phrase courte, en francais.
"""


def _extraire_texte_pdf(contenu: bytes) -> str:
    from pypdf import PdfReader

    lecteur = PdfReader(io.BytesIO(contenu))
    morceaux = []
    for page in lecteur.pages[:10]:  # limite raisonnable pour un document administratif
        morceaux.append(page.extract_text() or "")
    return "\n".join(morceaux)


async def extraire_texte(fichier: UploadFile) -> str:
    """Extrait le texte d'un fichier televerse (PDF ou texte brut)."""
    contenu = await fichier.read()
    await fichier.seek(0)  # remet le curseur pour une eventuelle reutilisation du fichier

    nom = (fichier.filename or "").lower()
    if nom.endswith(".pdf"):
        try:
            return _extraire_texte_pdf(contenu)
        except Exception:
            return ""
    try:
        return contenu.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def suggerer_classification(texte: str) -> dict:
    """
    Appelle l'API Anthropic pour suggerer une categorie, une date et un resume
    a partir du texte extrait du document. Necessite ANTHROPIC_API_KEY dans .env.
    """
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Aide IA non configuree : ajoutez ANTHROPIC_API_KEY dans le fichier .env du backend",
        )

    texte_tronque = (texte or "").strip()[:6000]
    if not texte_tronque:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Impossible d'extraire du texte de ce fichier pour l'analyse IA",
        )

    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    try:
        reponse = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=300,
            system=PROMPT_SYSTEME,
            messages=[{"role": "user", "content": f"Texte du document :\n\n{texte_tronque}"}],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erreur lors de l'appel a l'IA : {exc}",
        )

    texte_reponse = "".join(bloc.text for bloc in reponse.content if bloc.type == "text").strip()

    try:
        # Retire d'eventuelles balises markdown ```json ... ``` si le modele en ajoute
        texte_reponse = texte_reponse.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        suggestion = json.loads(texte_reponse)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Reponse de l'IA illisible, veuillez remplir le formulaire manuellement",
        )

    return {
        "categorie": suggestion.get("categorie"),
        "date_probable": suggestion.get("date_probable"),
        "titre_suggere": suggestion.get("titre_suggere"),
        "resume": suggestion.get("resume"),
    }
