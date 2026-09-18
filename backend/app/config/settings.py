from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Report-to-Me AI"
    environment: str = "local"
    aws_region: str = "us-east-1"
    dynamodb_table_name: str = "ReportToMe"
    s3_bucket_name: str = "report-to-me-media-local"
    ai_provider: str = "bedrock" # bedrock | fake
    bedrock_model_id: str = "amazon.nova-lite-v1:0"
    prompt_version: str = "v1"
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
