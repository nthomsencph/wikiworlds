"""
Database configuration and initialization.
"""
from sqlmodel import Session, create_engine, select

from app.config import settings
from app.models import User, UserCreate

# Create database engine
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


def init_db(session: Session) -> None:
    """
    Initialize the database with default data.

    Tables should be created with Alembic migrations.
    But if you don't want to use migrations, create
    the tables by uncommenting the lines below.
    """
    # from sqlmodel import SQLModel
    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    # Create first superuser if it doesn't exist
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        # Import here to avoid circular imports
        from app.db.crud.user import create_user

        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = create_user(session=session, user_create=user_in)


def get_session() -> Session:
    """Get a database session."""
    return Session(engine)
