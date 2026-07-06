from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class ConversationTopic(str, Enum):
    DAILY_LIFE = "Daily Life"
    JOB_INTERVIEW = "Job Interview"
    TRAVEL = "Travel"
    RESTAURANT = "Restaurant"
    BUSINESS = "Business"
    TECHNOLOGY = "Technology"
    FREE_TALK = "Free Talk"


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ConversationCreate(BaseModel):
    topic: ConversationTopic


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class EvaluationResponse(BaseModel):
    overall: int
    grammar: int
    vocabulary: int
    fluency: int
    sentence_structure: int
    confidence: int
    communication: int
    cefr: str
    feedback: list[str]
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: UUID
    topic: str
    status: str
    turn_count: int
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []
    evaluation: EvaluationResponse | None = None

    model_config = {"from_attributes": True}


class ConversationListItem(BaseModel):
    id: UUID
    topic: str
    status: str
    turn_count: int
    created_at: datetime
    evaluation: EvaluationResponse | None = None

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    conversation_id: UUID
    assistant_message: MessageResponse
    turn_count: int
    evaluation: EvaluationResponse | None = None
    conversation_completed: bool = False


class DashboardStats(BaseModel):
    total_conversations: int
    latest_score: int | None
    average_score: float | None
    cefr_history: list[dict]
    progress_chart: list[dict]
    weak_skills: list[str]
    strong_skills: list[str]
    recent_conversations: list[ConversationListItem]


class AdminUserStats(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    conversation_count: int
    average_score: float | None
    latest_cefr: str | None
    created_at: datetime


class AdminOverview(BaseModel):
    total_users: int
    total_conversations: int
    total_evaluations: int
    average_platform_score: float | None
    users: list[AdminUserStats]
