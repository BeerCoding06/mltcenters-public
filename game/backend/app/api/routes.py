from fastapi import APIRouter, HTTPException

from app.schemas.game import (
    CheckAnswerRequest,
    GameActionResponse,
    GenerateQuestionRequest,
    NewGameResponse,
)
from app.services.game_service import GameService

router = APIRouter()
game = GameService()


@router.post("/game/new", response_model=NewGameResponse)
async def new_game():
    state = game.create_session()
    return NewGameResponse(session_id=state.session_id, game_state=state.to_dict())


@router.post("/generate-question", response_model=NewGameResponse)
async def generate_question(body: GenerateQuestionRequest):
    try:
        state = await game.generate_question(body.session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")
    return NewGameResponse(session_id=state.session_id, game_state=state.to_dict())


@router.post("/check-answer", response_model=GameActionResponse)
async def check_answer(body: CheckAnswerRequest):
    try:
        state_before = game.get_session(body.session_id)
        if not state_before or not state_before.current_question:
            raise HTTPException(status_code=400, detail="No active question")
        correct = body.selected_index == state_before.current_question.correct_index
        state = game.check_answer(body.session_id, body.question_id, body.selected_index)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")
    return GameActionResponse(correct=correct, game_state=state.to_dict())


@router.get("/game-state/{session_id}")
async def game_state(session_id: str):
    state = game.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state.to_dict()


@router.post("/game/reset/{session_id}")
async def reset_game(session_id: str):
    try:
        state = game.reset_session(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")
    return state.to_dict()
