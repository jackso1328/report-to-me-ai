from app.utils.logging import get_logger

def test_logger_initialization():
    logger = get_logger("test_logger")
    assert logger.logger.name == "test_logger"
    
    # Just testing that it doesn't raise an exception
    logger.info("Test message", requestId="req-123")
