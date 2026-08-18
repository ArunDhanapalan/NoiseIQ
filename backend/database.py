import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/noiseiq")
SQLITE_URL = "sqlite:///./noiseiq.db"

# Engine initialization with fallback strategy
try:
    if "postgresql" in POSTGRES_URL:
        engine = create_engine(POSTGRES_URL, pool_pre_ping=True)
        # Test connection
        with engine.connect() as conn:
            pass
    else:
        engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
except Exception:
    # Fallback to SQLite if PostgreSQL is unreachable locally
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
