import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Conversation, Evaluation, Message, User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create(self, email: str, full_name: str, hashed_password: str) -> User:
        user = User(email=email, full_name=full_name, hashed_password=hashed_password)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def list_all(self) -> list[User]:
        result = await self.db.execute(select(User).order_by(User.created_at.desc()))
        return list(result.scalars().all())

    async def count(self) -> int:
        result = await self.db.execute(select(func.count()).select_from(User))
        return int(result.scalar_one())


class ConversationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, user_id: uuid.UUID, topic: str) -> Conversation:
        conversation = Conversation(user_id=user_id, topic=topic)
        self.db.add(conversation)
        await self.db.flush()
        await self.db.refresh(conversation)
        return conversation

    async def get_by_id(self, conversation_id: uuid.UUID) -> Conversation | None:
        result = await self.db.execute(
            select(Conversation)
            .options(
                selectinload(Conversation.messages),
                selectinload(Conversation.evaluation),
            )
            .where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: uuid.UUID) -> list[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .options(selectinload(Conversation.evaluation))
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.created_at.desc())
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        result = await self.db.execute(select(func.count()).select_from(Conversation))
        return int(result.scalar_one())

    async def count_by_user(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Conversation)
            .where(Conversation.user_id == user_id)
        )
        return int(result.scalar_one())


class MessageRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self, conversation_id: uuid.UUID, role: str, content: str
    ) -> Message:
        message = Message(
            conversation_id=conversation_id, role=role, content=content
        )
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message


class EvaluationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, conversation_id: uuid.UUID, data: dict) -> Evaluation:
        evaluation = Evaluation(
            conversation_id=conversation_id,
            overall=int(data["overall"]),
            grammar=int(data["grammar"]),
            vocabulary=int(data["vocabulary"]),
            fluency=int(data["fluency"]),
            sentence_structure=int(data["sentence_structure"]),
            confidence=int(data["confidence"]),
            communication=int(data["communication"]),
            cefr=str(data["cefr"]),
            feedback=list(data.get("feedback", [])),
        )
        self.db.add(evaluation)
        await self.db.flush()
        await self.db.refresh(evaluation)
        return evaluation

    async def list_by_user(self, user_id: uuid.UUID) -> list[Evaluation]:
        result = await self.db.execute(
            select(Evaluation)
            .join(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Evaluation.created_at.asc())
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        result = await self.db.execute(select(func.count()).select_from(Evaluation))
        return int(result.scalar_one())

    async def average_score(self) -> float | None:
        result = await self.db.execute(select(func.avg(Evaluation.overall)))
        value = result.scalar_one()
        return float(value) if value is not None else None

    async def average_score_by_user(self, user_id: uuid.UUID) -> float | None:
        result = await self.db.execute(
            select(func.avg(Evaluation.overall))
            .join(Conversation)
            .where(Conversation.user_id == user_id)
        )
        value = result.scalar_one()
        return float(value) if value is not None else None
