from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Report-to-Me AI"
    environment: str = "local"
    aws_region: str = "us-east-1"
    dynamodb_table_name: str = "report-to-me-incidents-local"
    s3_bucket_name: str = "report-to-me-media-local"
    bedrock_model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
