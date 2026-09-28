# Backend unifié — GED Haute Matsiatra (RSI + DAG/RH)

API FastAPI + PostgreSQL. Ce backend **synthétise deux implémentations
distinctes** (une côté RSI, une côté DAG/RH) en un seul service cohérent,
en reprenant **les tables et notations du backend DAG/RH** comme référence.

## Pourquoi une synthèse, et pas juste une fusion de fichiers ?

Les deux backends avaient été développés séparément et divergeaient sur des
points structurels : clés primaires (`im`/`num_ref` en String côté DAG vs
`id` auto-incrémenté côté RSI), présence ou non d'un jeton d'authentification,
suppression physique vs logique des documents, etc. Une fusion naïve aurait
laissé deux schémas de données incompatibles pointant vers deux bases
différentes. Cette version retient un seul schéma (celui du DAG/RH) et
reconstruit toutes les fonctionnalités RSI par-dessus.

## Ce qui a été repris tel quel du backend DAG/RH

- Table `utilisateur` avec héritage par tables jointes (`dag_rh`, `rsi`),
  clé primaire `im`
- Table `documents`, clé primaire `num_ref`, colonnes `date_num`, `format`
  (déduit automatiquement de l'extension du fichier, jamais saisi), `cat`
  (chaîne libre), `annee_redac`, `title`, `file_path`
- Table `journal`, clé primaire `id_jour` (UUID), `date_action` (date sans
  heure), `desc`, `im_user`, `num_ref_doc`
- Dossier de stockage `uploaded_documents/`
- Préfixe de routes `/api/v1/...`

## Ce qui a été corrigé ou ajouté, et pourquoi

| Point | Backend DAG d'origine | Version synthétisée | Raison |
|---|---|---|---|
| Mot de passe | stocké et comparé en clair | haché (bcrypt) | faille de sécurité |
| Authentification | aucun jeton, routes non protégées | JWT + contrôle de rôle | impossible de distinguer RSI / DAG_RH sans ça |
| Suppression de document | physique (fichier + ligne supprimés) | logique (`est_supprime`) | rend "Restaurer doc" (RSI) possible |
| Statut de compte | inexistant | colonne `actif` ajoutée | nécessaire pour "Gérer accès et rôles" |
| `im_dag_rh` à l'upload | fourni par le formulaire (falsifiable) | déduit du token JWT | sécurité |

Ces ajouts sont additifs uniquement : aucune colonne ni notation existante
du DAG n'a été renommée ou supprimée.

## Cas d'utilisation couverts

**Communs** — S'authentifier (JWT)

**DAG/RH** — Téléverser doc (+ aide IA optionnelle), Consulter/lire doc,
Rechercher doc, Imprimer/Télécharger, Supprimer doc (suppression logique)

**RSI** — Gérer les comptes des utilisateurs, Gérer accès et rôles (avec
changement de rôle dag_rh ↔ rsi), Consulter Log (journal, filtre par date),
Restaurer doc, suivre les données administratives / le fonctionnement
général (tableau de bord)

## Installation

```bash
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # ajuster DATABASE_URL si besoin
```

Base de données (notation DAG : `ged_db` sur le port 5433) :

```bash
createdb -p 5433 ged_db
```

## Créer le premier compte RSI

```bash
python -m scripts.creer_admin
```

## Lancer le serveur

```bash
uvicorn app.main:app --reload
```

- Application (frontend + API) : http://localhost:8000
- Documentation interactive : http://localhost:8000/docs

## Authentification

```
POST /api/v1/auth/login
{ "im": "...", "mdp": "..." }
```

Retourne un `access_token` JWT à passer dans l'en-tête
`Authorization: Bearer <token>`. Les routes `/api/v1/rsi/...` exigent le
rôle `rsi` ; les routes `/api/v1/documents/...` exigent le rôle `dag_rh`.

## Structure

```
app/
├── main.py                     Point d'entree + montage du frontend statique
├── core/
│   ├── config.py                config (.env)
│   ├── security.py              hash mdp + JWT
│   └── aide_ia.py               extraction de texte + appel Claude
├── db/                          connexion / session SQLAlchemy
├── models/                      Utilisateur/DAG_RH/RSI, Document, Journal (notation DAG)
├── schemas/                     validation Pydantic entree/sortie
├── crud/                        acces aux donnees (dont le changement de role)
└── api/
    ├── deps.py                   utilisateur courant, role RSI, role DAG_RH
    └── routes/
        ├── auth.py               /api/v1/auth
        ├── utilisateurs.py       /api/v1/rsi/utilisateurs   (RSI)
        ├── journal.py            /api/v1/rsi/journal        (RSI)
        ├── documents.py          /api/v1/rsi/documents      (RSI : corbeille + restauration)
        ├── dagrh_documents.py    /api/v1/documents          (DAG_RH : upload/recherche/telechargement/suppression + aide IA)
        └── dashboard.py          /api/v1/rsi/dashboard      (RSI)
scripts/
└── creer_admin.py                creation du premier compte RSI
uploaded_documents/               fichiers televerses (notation DAG, cree automatiquement)
```

## Point technique notable : changement de rôle

L'héritage par tables jointes (`utilisateur` → `dag_rh` / `rsi`) ne permet
pas de "muter" directement un objet ORM d'une sous-classe à l'autre. Le
changement de rôle (`PATCH /api/v1/rsi/utilisateurs/{im}/role`) supprime la
ligne de l'ancienne table enfant et insère une ligne dans la nouvelle, au
niveau SQL, en conservant la ligne `utilisateur` (donc l'historique du
Journal, qui référence `im`, reste intact).

## Aide IA (optionnelle)

`POST /api/v1/documents/aide-ia` — nécessite `ANTHROPIC_API_KEY` dans `.env`
(https://console.anthropic.com/). Sans clé, répond 503 avec un message clair ;
le reste de l'application n'est pas affecté.

## Limites connues

- `Base.metadata.create_all()` crée les tables au démarrage (pas de
  migrations Alembic) — suffisant pour un projet étudiant.
- `annee_redac` est filtrable par date exacte dans la recherche (notation
  reprise du DAG), pas par année seule.
- CORS ouvert (`allow_origins=["*"]`), conservé du backend DAG pour
  permettre un frontend servi séparément en développement (`npm run dev`).
  À restreindre avant tout déploiement public.
