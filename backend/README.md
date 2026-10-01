# Backend — Système de classement des dossiers (Région Haute Matsiatra)

API FastAPI + PostgreSQL, basée sur le diagramme de classes réel du projet
(Utlisateur, RSI, DAG/RH, Documents, Journal). Sert aussi le frontend statique
(voir le README à la racine du projet pour le lancement complet).

## Cas d'utilisation couverts

**Communs**
- S'authentifier (JWT)

**RSI (administrateur)**
- Gérer les comptes des utilisateurs (créer, lister, désactiver)
- Gérer accès et rôles (modifier le rôle d'un compte)
- Consulter Log (journal, avec filtre par date)
- Restaurer doc
- Suivre les données administratives / le fonctionnement général (tableau de bord)

**DAG/RH (client)**
- Téléverser doc (upload avec métadonnées)
- Consulter / lire doc
- Rechercher doc (par référence, catégorie, année)
- Imprimer / Télécharger
- Supprimer doc (suppression logique)

## Installation

```bash
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # puis modifier DATABASE_URL et SECRET_KEY
```

```bash
createdb dossiers_region
```

## Créer le premier compte RSI

Aucune route publique ne crée de RSI (seul un RSI peut en créer un autre) :
il faut amorcer le tout premier compte via le script.

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
POST /auth/login
{ "identifiant": "...", "mdp": "..." }
```

Retourne un `access_token` JWT à passer dans l'en-tête
`Authorization: Bearer <token>`. Le rôle est encodé dans le token : les
routes `/rsi/...` exigent le rôle `RSI`, les routes `/documents/...` (côté
client) exigent le rôle `DAG_RH`.

## Structure

```
app/
├── main.py                   Point d'entree FastAPI + montage du frontend statique
├── core/                     config (.env) + securite (hash mdp, JWT)
├── db/                       connexion / session SQLAlchemy
├── models/                   Utilisateur, Document, Journal
├── schemas/                  validation Pydantic entree/sortie
├── crud/                     acces aux donnees
└── api/
    ├── deps.py                dependances : utilisateur courant, role RSI, role DAG_RH
    └── routes/
        ├── auth.py            /auth/login
        ├── utilisateurs.py    /rsi/utilisateurs  (RSI)
        ├── journal.py         /rsi/journal        (RSI)
        ├── documents.py       /rsi/documents      (RSI : corbeille + restauration)
        ├── dagrh_documents.py /documents          (DAG_RH : upload/recherche/telechargement/suppression)
        └── dashboard.py       /rsi/dashboard      (RSI)
scripts/
└── creer_admin.py             creation du premier compte RSI
storage/                       fichiers televerses par les DAG/RH (cree automatiquement)
```

## Points d'attention repris de l'analyse du diagramme original (.vpp)

- L'attribut `im` du diagramme de classes a été interprété comme
  l'**identifiant de connexion** (login), distinct de la clé primaire `id`.
- La catégorie de document (`cat`) est contrainte en base à 3 valeurs fixes :
  `NOMINATION`, `FINANCE`, `DEVELOPPEMENT`.
- La suppression d'un document par un DAG/RH est **logique** (`est_supprime`),
  pas physique — c'est ce qui permet au RSI de le restaurer ensuite. Le
  fichier reste sur le disque tant qu'il n'est pas supprimé définitivement
  (aucune purge automatique n'est implémentée à ce stade).
- L'« impression » n'a pas de route dédiée côté serveur : le frontend
  télécharge le fichier puis déclenche l'impression du navigateur.
- Chaque action DAG/RH significative (upload, téléchargement, suppression)
  et chaque restauration RSI est enregistrée dans le Journal.
- **Aide IA** (`POST /documents/aide-ia`) : extrait le texte du fichier
  (PDF ou texte brut) et appelle l'API Anthropic pour suggérer une
  catégorie, une date et un résumé. Nécessite `ANTHROPIC_API_KEY` dans
  `.env` ; sans clé, l'endpoint répond 503 avec un message clair, le reste
  de l'application n'est pas affecté.
- Limite de routage connue : le frontend React (`frontend/dist`) est monté
  à la racine `/` avec un fallback SPA (toute route inconnue renvoie
  `index.html`, pour que `/rsi` et `/dagrh` fonctionnent même en accès
  direct). Consequence mineure : une requête GET avec une mauvaise méthode
  sur une route API existante renverra la page React (200) plutôt qu'un 405
  — sans impact puisque le frontend utilise toujours la bonne méthode.

## Limites connues / pistes d'amélioration

- `Base.metadata.create_all()` crée les tables au démarrage — correct pour un
  projet étudiant, mais à remplacer par des migrations Alembic pour un usage
  réel en production.
- Pas de pagination avancée (juste `skip`/`limit`) ni de tri configurable.
- Le stockage des fichiers est local (`storage/`) — à adapter (S3, NAS...) si
  l'application doit être déployée au-delà d'un poste local.
