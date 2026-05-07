from pydantic_settings import BaseSettings


class Config(BaseSettings):
    app_name: str = "GW2 Assistant API"
    debug: bool = True

    class Settings:
        env_file = ".env"


config = Config()
