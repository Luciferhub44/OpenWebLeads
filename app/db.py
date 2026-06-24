from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


@lru_cache
def _get_sync_engine():
    from app.config import settings
    return create_engine(settings.DATABASE_URL)


@lru_cache
def _get_async_engine():
    from app.config import settings
    url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    return create_async_engine(url)


def SyncSession():
    return sessionmaker(_get_sync_engine())()


def AsyncSessionFactory():
    return async_sessionmaker(_get_async_engine(), expire_on_commit=False)


async def get_db():
    async with AsyncSessionFactory()() as session:
        yield session
