"""
Structured logging configuration with request ID tracking.
"""

import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime
from typing import Any, Dict, Optional

from pythonjsonlogger import jsonlogger

# Context variable for request ID tracking
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


def get_request_id() -> Optional[str]:
    """Get the current request ID from context."""
    return request_id_ctx.get()


def set_request_id(request_id: Optional[str] = None) -> str:
    """Set the request ID in context. Generates one if not provided."""
    if request_id is None:
        request_id = str(uuid.uuid4())[:8]
    request_id_ctx.set(request_id)
    return request_id


class RequestIdFilter(logging.Filter):
    """Logging filter that adds request_id to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "no-request"
        return True


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional fields."""

    def add_fields(
        self,
        log_record: Dict[str, Any],
        record: logging.LogRecord,
        message_dict: Dict[str, Any],
    ) -> None:
        super().add_fields(log_record, record, message_dict)

        # Add timestamp
        log_record["timestamp"] = datetime.utcnow().isoformat() + "Z"

        # Add log level
        log_record["level"] = record.levelname

        # Add request ID
        log_record["request_id"] = getattr(record, "request_id", "no-request")

        # Add logger name
        log_record["logger"] = record.name

        # Add location info
        log_record["module"] = record.module
        log_record["function"] = record.funcName
        log_record["line"] = record.lineno

        # Remove redundant fields
        if "levelname" in log_record:
            del log_record["levelname"]
        if "asctime" in log_record:
            del log_record["asctime"]


class TextFormatter(logging.Formatter):
    """Text formatter with request ID."""

    def format(self, record: logging.LogRecord) -> str:
        # Add request_id to record if not present
        if not hasattr(record, "request_id"):
            record.request_id = get_request_id() or "no-request"
        return super().format(record)


def setup_logging(
    level: str = "INFO", log_format: str = "json", app_name: str = "famloop"
) -> logging.Logger:
    """
    Configure structured logging for the application.

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_format: Output format ('json' or 'text')
        app_name: Application name for the logger

    Returns:
        Configured root logger
    """
    # Create handler
    handler = logging.StreamHandler(sys.stdout)

    # Add request ID filter
    handler.addFilter(RequestIdFilter())

    # Configure formatter based on format type
    if log_format.lower() == "json":
        formatter = CustomJsonFormatter(
            "%(timestamp)s %(level)s %(request_id)s %(name)s %(message)s"
        )
    else:
        formatter = TextFormatter(
            "%(asctime)s - %(levelname)s - [%(request_id)s] - %(name)s - %(message)s"
        )

    handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers = []
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, level.upper()))

    # Suppress noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    # Log startup message
    logger = logging.getLogger(app_name)
    logger.info(
        "Logging configured",
        extra={
            "log_level": level,
            "log_format": log_format,
        },
    )

    return logger
