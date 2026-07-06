from fastapi import APIRouter, HTTPException

from app.schemas.game import (
    CheckAnswerRequest,
    GameActionResponse,
    NewGameResponse,
    SessionRequest,
)
from app.services.game_service import GameService

router = APIRouter()
game = GameService()


@router.post("/game/new", response_model=NewGameResponse)
async def new_game():
    state = game.create_session()
    return NewGameResponse(session_id=state.session_id, game_state=state.to_dict())


@router.post("/generate-question", response_model=NewGameResponse)
async def generate_question(body: SessionRequest):
    try:
        state = await game.generate_question(body.session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")
    return NewGameResponse(session_id=state.session_id, game_state=state.to_dict())


@router.post("/check-answer", response_model=GameActionResponse)
async def check_answer(body: CheckAnswerRequest):
    try:
        before = game.get_session(body.session_id)
        if not before or not before.current_question:
            raise HTTPException(status_code=400, detail="No active question")
        correct = body.selected_index == before.current_question.correct_index
        state = game.check_answer(body.session_id, body.question_id, body.selected_index)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")
    anim = "win" if correct else "lose"
    return GameActionResponse(correct=correct, game_state=state.to_dict(), animation=anim)


@router.post("/evaluate-performance")
async def evaluate_performance(body: SessionRequest):
    try:
        return await game.evaluate_performance(body.session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")


@router.get("/game-state/{session_id}")
async def game_state(session_id: str):
    state = game.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state.to_dict()


@router.post("/game/reset/{session_id}")
async def reset_game(session_id: str):
    try:
        return game.reset_session(session_id).to_dict()
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")
