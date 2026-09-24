from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Configuración centralizada del backend. Todo lo que venga de variables
    de entorno se define aquí, en vez de leer os.environ regado por el código.
    """

    # Base de datos
    database_url: str

    # Auth
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 30

    # AWS / S3
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_s3_bucket: str = ""
    aws_region: str = "us-east-1"

    # Pagos
    stripe_secret_key: str = ""
    demo_payments_enabled: bool = False

    # CORS - dominios permitidos, separados por coma
    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
