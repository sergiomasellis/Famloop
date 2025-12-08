"""
Database session configuration with connection pooling support.
Supports SQLite (development) and PostgreSQL (production).
"""

import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import QueuePool, StaticPool, SingletonThreadPool

from ..config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""

    pass


def create_database_engine():
    """
    Create database engine with appropriate configuration.
    Uses different settings for SQLite vs PostgreSQL.
    """
    database_url = settings.database_url

    if settings.is_sqlite:
        # SQLite configuration (development)
        logger.info("Using SQLite database")
        pool_class = StaticPool if database_url.endswith(":memory:") else SingletonThreadPool
        engine = create_engine(
            database_url,
            echo=settings.debug,
            connect_args={"check_same_thread": False},
            poolclass=pool_class,
        )

        # Enable foreign keys for SQLite
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    else:
        # PostgreSQL configuration (production)
        logger.info(
            "Using PostgreSQL database",
            extra={
                "pool_size": settings.db_pool_size,
                "max_overflow": settings.db_max_overflow,
            },
        )
        engine = create_engine(
            database_url,
            echo=settings.debug,
            poolclass=QueuePool,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_pre_ping=True,  # Verify connections before use
            pool_recycle=3600,  # Recycle connections after 1 hour
        )

    return engine


# Create engine instance
engine = create_database_engine()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    Dependency that provides a database session.
    Automatically closes the session when done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
