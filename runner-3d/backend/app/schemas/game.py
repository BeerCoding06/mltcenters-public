from pydantic import BaseModel, Field


class NewGameResponse(BaseModel):
    session_id: str
    game_state: dict


class SessionRequest(BaseModel):
    session_id: str


class CheckAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    selected_index: int = Field(ge=0, le=2)


class GameActionResponse(BaseModel):
    correct: bool
    game_state: dict
    animation: str
