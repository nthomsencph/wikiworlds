"""
Database initialization script.
Creates initial data including the first superuser.
"""
import logging

from sqlmodel import Session

from app.db import engine, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init() -> None:
    """Initialize the database with default data."""
    with Session(engine) as session:
        init_db(session)


def main() -> None:
    """Main function to run database initialization."""
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
