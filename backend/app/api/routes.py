import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_current_user
from app.database.session import get_db
from app.models import User
from app.schemas import (
    AdminOverview,
    ConversationCreate,
    ConversationListItem,
    ConversationResponse,
    DashboardStats,
    MessageCreate,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services import AdminService, AuthService, ConversationService, DashboardService

router = APIRouter()


@router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    return await AuthService(db).register(data)


@router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    return await AuthService(db).login(data)


@router.get("/auth/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(user)


@router.post("/conversations", response_model=ConversationResponse)
async def start_conversation(
    data: ConversationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    return await ConversationService(db).start(user, data)


@router.get("/conversations", response_model=list[ConversationListItem])
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationListItem]:
    return await ConversationService(db).list(user)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    return await ConversationService(db).get(user, uuid.UUID(conversation_id))


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    data: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ConversationService(db).send_message(
        user, uuid.UUID(conversation_id), data
    )


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardStats:
    return await DashboardService(db).get_stats(user)


@router.get("/admin/overview", response_model=AdminOverview)
async def admin_overview(
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> AdminOverview:
    return await AdminService(db).overview()


@router.get("/admin/export")
async def admin_export(
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).export_report()
