from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

_async_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
async_engine = create_async_engine(_async_url)
AsyncSession = async_sessionmaker(async_engine, expire_on_commit=False)

sync_engine = create_engine(settings.DATABASE_URL)
SyncSession = sessionmaker(sync_engine)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSession() as session:
        yield session
