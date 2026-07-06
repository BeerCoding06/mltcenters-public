import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.service import AIService
from app.core.config import get_settings
from app.core.exceptions import ConflictError, NotFoundError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.repositories import (
    ConversationRepository,
    EvaluationRepository,
    MessageRepository,
    UserRepository,
)
from app.schemas import (
    AdminOverview,
    AdminUserStats,
    ChatResponse,
    ConversationCreate,
    ConversationListItem,
    ConversationResponse,
    DashboardStats,
    EvaluationResponse,
    MessageCreate,
    MessageResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.users = UserRepository(db)

    async def register(self, data: UserCreate) -> TokenResponse:
        existing = await self.users.get_by_email(data.email)
        if existing:
            raise ConflictError("Email already registered")
        user = await self.users.create(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
        )
        token = create_access_token(str(user.id))
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )

    async def login(self, data: UserLogin) -> TokenResponse:
        user = await self.users.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        token = create_access_token(str(user.id))
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )


class ConversationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.conversations = ConversationRepository(db)
        self.messages = MessageRepository(db)
        self.evaluations = EvaluationRepository(db)
        self.ai = AIService()
        self.settings = get_settings()

    async def start(self, user: User, data: ConversationCreate) -> ConversationResponse:
        conversation = await self.conversations.create(
            user_id=user.id, topic=data.topic.value
        )
        greeting = await self.ai.generate_reply(
            topic=conversation.topic,
            history=[],
        )
        await self.messages.create(conversation.id, "assistant", greeting)
        full = await self.conversations.get_by_id(conversation.id)
        if not full:
            raise NotFoundError("Conversation not found")
        return ConversationResponse.model_validate(full)

    async def send_message(
        self, user: User, conversation_id: uuid.UUID, data: MessageCreate
    ) -> ChatResponse:
        conversation = await self.conversations.get_by_id(conversation_id)
        if not conversation or conversation.user_id != user.id:
            raise NotFoundError("Conversation not found")
        if conversation.status == "completed":
            raise ConflictError("Conversation already completed")

        await self.messages.create(conversation.id, "user", data.content)
        conversation.turn_count += 1

        history = [
            {"role": m.role, "content": m.content} for m in conversation.messages
        ]
        history.append({"role": "user", "content": data.content})

        reply = await self.ai.generate_reply(conversation.topic, history)
        assistant_message = await self.messages.create(
            conversation.id, "assistant", reply
        )

        evaluation = None
        completed = False
        if conversation.turn_count >= self.settings.evaluation_turn_threshold:
            evaluation = await self._evaluate(conversation.id)
            conversation.status = "completed"
            completed = True

        return ChatResponse(
            conversation_id=conversation.id,
            assistant_message=MessageResponse.model_validate(assistant_message),
            turn_count=conversation.turn_count,
            evaluation=EvaluationResponse.model_validate(evaluation) if evaluation else None,
            conversation_completed=completed,
        )

    async def _evaluate(self, conversation_id: uuid.UUID):
        conversation = await self.conversations.get_by_id(conversation_id)
        if not conversation:
            raise NotFoundError("Conversation not found")
        transcript = "\n".join(
            f"{m.role.upper()}: {m.content}" for m in conversation.messages
        )
        result = await self.ai.evaluate_conversation(transcript)
        return await self.evaluations.create(conversation_id, result)

    async def get(self, user: User, conversation_id: uuid.UUID) -> ConversationResponse:
        conversation = await self.conversations.get_by_id(conversation_id)
        if not conversation or conversation.user_id != user.id:
            raise NotFoundError("Conversation not found")
        return ConversationResponse.model_validate(conversation)

    async def list(self, user: User) -> list[ConversationListItem]:
        conversations = await self.conversations.list_by_user(user.id)
        return [ConversationListItem.model_validate(c) for c in conversations]


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.conversations = ConversationRepository(db)
        self.evaluations = EvaluationRepository(db)

    async def get_stats(self, user: User) -> DashboardStats:
        conversations = await self.conversations.list_by_user(user.id)
        evaluations = await self.evaluations.list_by_user(user.id)

        scores = [e.overall for e in evaluations]
        latest_score = scores[-1] if scores else None
        average_score = sum(scores) / len(scores) if scores else None

        skill_map = {
            "grammar": [e.grammar for e in evaluations],
            "vocabulary": [e.vocabulary for e in evaluations],
            "fluency": [e.fluency for e in evaluations],
            "sentence_structure": [e.sentence_structure for e in evaluations],
            "confidence": [e.confidence for e in evaluations],
            "communication": [e.communication for e in evaluations],
        }
        averages = {
            k: (sum(v) / len(v) if v else 0) for k, v in skill_map.items()
        }
        sorted_skills = sorted(averages.items(), key=lambda x: x[1])
        weak_skills = [k.replace("_", " ").title() for k, _ in sorted_skills[:2]]
        strong_skills = [k.replace("_", " ").title() for k, _ in sorted_skills[-2:]]

        return DashboardStats(
            total_conversations=len(conversations),
            latest_score=latest_score,
            average_score=average_score,
            cefr_history=[
                {"date": e.created_at.isoformat(), "cefr": e.cefr, "overall": e.overall}
                for e in evaluations
            ],
            progress_chart=[
                {"date": e.created_at.isoformat(), "overall": e.overall}
                for e in evaluations
            ],
            weak_skills=weak_skills,
            strong_skills=strong_skills,
            recent_conversations=[
                ConversationListItem.model_validate(c) for c in conversations[:10]
            ],
        )


class AdminService:
    def __init__(self, db: AsyncSession) -> None:
        self.users = UserRepository(db)
        self.conversations = ConversationRepository(db)
        self.evaluations = EvaluationRepository(db)

    async def overview(self) -> AdminOverview:
        users = await self.users.list_all()
        user_stats: list[AdminUserStats] = []
        for user in users:
            evaluations = await self.evaluations.list_by_user(user.id)
            avg = await self.evaluations.average_score_by_user(user.id)
            latest_cefr = evaluations[-1].cefr if evaluations else None
            count = await self.conversations.count_by_user(user.id)
            user_stats.append(
                AdminUserStats(
                    id=user.id,
                    email=user.email,
                    full_name=user.full_name,
                    conversation_count=count,
                    average_score=avg,
                    latest_cefr=latest_cefr,
                    created_at=user.created_at,
                )
            )
        return AdminOverview(
            total_users=await self.users.count(),
            total_conversations=await self.conversations.count(),
            total_evaluations=await self.evaluations.count(),
            average_platform_score=await self.evaluations.average_score(),
            users=user_stats,
        )

    async def export_report(self) -> list[dict]:
        overview = await self.overview()
        return [u.model_dump(mode="json") for u in overview.users]
