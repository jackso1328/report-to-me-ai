from app.config.settings import settings
from app.ai.analyzer import AIAnalyzer, BedrockAdapter
from app.ai.fake_analyzer import FakeAnalyzer
from app.ai.openrouter_adapter import OpenRouterAdapter
import logging

logger = logging.getLogger(__name__)

def get_analyzer() -> AIAnalyzer:
    if settings.ai_provider.lower() == "fake":
        logger.info("Using FakeAnalyzer as AI Provider (explicit configuration)")
        return FakeAnalyzer()
    elif settings.ai_provider.lower() == "bedrock":
        logger.info("Using BedrockAdapter as AI Provider")
        return BedrockAdapter()
    elif settings.ai_provider.lower() == "openrouter":
        logger.info(f"Using OpenRouterAdapter as AI Provider (Model: {settings.openrouter_model})")
        return OpenRouterAdapter()
    else:
        logger.warning(f"Unknown AI Provider '{settings.ai_provider}', falling back to OpenRouterAdapter")
        return OpenRouterAdapter()
