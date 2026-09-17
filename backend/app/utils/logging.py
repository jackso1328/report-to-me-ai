import logging
import json
from typing import Any, Dict, Optional
from app.config.settings import settings

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(settings.log_level)
        
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    def _log(self, level: int, message: str, **kwargs: Any):
        log_entry: Dict[str, Any] = {
            "level": logging.getLevelName(level),
            "message": message,
        }
        
        # Add contextual fields
        context_keys = ["requestId", "signalId", "incidentId", "operation"]
        for key in context_keys:
            if key in kwargs:
                log_entry[key] = kwargs.pop(key)
                
        # Add any remaining kwargs as extra data
        if kwargs:
            log_entry["extra"] = kwargs

        self.logger.log(level, json.dumps(log_entry))

    def info(self, message: str, **kwargs: Any):
        self._log(logging.INFO, message, **kwargs)
        
    def error(self, message: str, **kwargs: Any):
        self._log(logging.ERROR, message, **kwargs)
        
    def warning(self, message: str, **kwargs: Any):
        self._log(logging.WARNING, message, **kwargs)
        
    def debug(self, message: str, **kwargs: Any):
        self._log(logging.DEBUG, message, **kwargs)

def get_logger(name: str) -> StructuredLogger:
    return StructuredLogger(name)
