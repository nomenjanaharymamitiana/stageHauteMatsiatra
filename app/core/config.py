from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration de l'application, lue depuis les variables d'environnement (.env)."""

    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5433/ged_db"
    SECRET_KEY: str = "change-moi-en-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    STORAGE_DIR: str = "uploaded_documents"

    # Aide IA au remplissage du formulaire de televersement (optionnel)
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-5"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
