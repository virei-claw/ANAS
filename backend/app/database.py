from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# 使用 pg8000 替代 psycopg2 避免 DLL 问题
if settings.DATABASE_URL.startswith('postgresql://'):
    url = settings.DATABASE_URL.replace('postgresql://', 'postgresql+pg8000://')
else:
    url = settings.DATABASE_URL

engine = create_engine(url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
