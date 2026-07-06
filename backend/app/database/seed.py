import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.database.session import AsyncSessionLocal, engine, Base
from app.models import User


async def seed_admin() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == "admin@mltcenters.com")
        )
        if result.scalar_one_or_none():
            return
        admin = User(
            email="admin@mltcenters.com",
            full_name="Platform Admin",
            hashed_password=hash_password("Admin123!"),
            is_admin=True,
        )
        session.add(admin)
        await session.commit()
        print("Seeded admin user: admin@mltcenters.com / Admin123!")


if __name__ == "__main__":
    asyncio.run(seed_admin())
