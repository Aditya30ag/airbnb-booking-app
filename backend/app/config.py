from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    GOOGLE_CLIENT_ID: str
    FRONTEND_URL: str

    class Config:
        env_file = ".env"

settings = Settings()
