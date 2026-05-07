from pydantic_settings import BaseSettings


class Config(BaseSettings):
    app_name: str = "GW2 Assistant API"
    debug: bool = True
    deepseek_api_key: str = ""
    deepseek_api_base: str = "https://api.deepseek.com"

    class Settings:
        env_file = ".env"
        env_file_encoding = "utf-8"


config = Config()
