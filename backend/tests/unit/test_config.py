import os
from app.config.settings import Settings

def test_config_loading():
    os.environ["APP_NAME"] = "Test App"
    os.environ["ENVIRONMENT"] = "test"
    settings = Settings()
    
    assert settings.app_name == "Test App"
    assert settings.environment == "test"
    assert settings.aws_region == "us-east-1"  # default
