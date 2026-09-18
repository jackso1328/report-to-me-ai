import json
from app.utils.logging import get_logger
from app.ai.analyzer import BedrockAdapter
from app.domain.models import Signal
from app.domain.enums import SignalSourceType

logger = get_logger("analyze_poc_handler")

def lambda_handler(event, context):
    logger.info("Received test event for analyze_poc")
    
    # Simple default text if none provided in event
    text_content = event.get("text", "There is a massive water leak on 5th avenue flooding the entire street. It is dangerous for cars.")
    
    signal = Signal(
        id="test-sig-001",
        source_type=SignalSourceType.text,
        content=text_content
    )
    
    adapter = BedrockAdapter()
    try:
        analysis = adapter.analyze_signal(signal)
        logger.info("Analysis successful", analysis=analysis.model_dump())
        
        return {
            "statusCode": 200,
            "body": analysis.model_dump_json()
        }
    except Exception as e:
        logger.error("Analysis failed", error=str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
