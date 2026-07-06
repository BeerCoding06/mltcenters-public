import logging
import uuid
from dataclasses import dataclass, field

from app.core.config import Settings, get_settings
from app.services.llm_service import LLMService, QuestionData

logger = logging.getLogger(__name__)

DIFFICULTY_LEVELS = ["beginner", "elementary", "intermediate"]


@dataclass
class GameState:
    session_id: str
    score: int = 0
    hp: int = 100
    speed: int = 200
    streak: int = 0
    questions_answered: int = 0
    correct_count: int = 0
    difficulty: str = "beginner"
    current_question: QuestionData | None = None
    last_explanation: str = ""
    game_over: bool = False

    def to_dict(self) -> dict:
        q = None
        if self.current_question:
            q = {
                "id": self.current_question.id,
                "question": self.current_question.question,
                "options": self.current_question.options,
                "difficulty": self.current_question.difficulty,
            }
        return {
            "session_id": self.session_id,
            "score": self.score,
            "hp": self.hp,
            "speed": self.speed,
            "streak": self.streak,
            "questions_answered": self.questions_answered,
            "correct_count": self.correct_count,
            "difficulty": self.difficulty,
            "current_question": q,
            "last_explanation": self.last_explanation,
            "game_over": self.game_over,
        }


class GameService:
    """In-memory game sessions — swap for Redis in multi-instance production."""

    _sessions: dict[str, GameState] = {}

    def __init__(self) -> None:
        self.settings = get_settings()
        self.llm = LLMService()

    def create_session(self) -> GameState:
        sid = uuid.uuid4().hex
        state = GameState(
            session_id=sid,
            hp=self.settings.initial_hp,
            speed=self.settings.initial_speed,
        )
        self._sessions[sid] = state
        return state

    def get_session(self, session_id: str) -> GameState | None:
        return self._sessions.get(session_id)

    async def generate_question(self, session_id: str) -> GameState:
        state = self._require_session(session_id)
        if state.game_over:
            return state
        topic = _topic_for_streak(state.streak)
        state.current_question = await self.llm.generate_question(state.difficulty, topic)
        return state

    def check_answer(self, session_id: str, question_id: str, selected_index: int) -> GameState:
        state = self._require_session(session_id)
        s = self.settings

        if state.game_over or not state.current_question:
            return state
        if state.current_question.id != question_id:
            state.last_explanation = "Question expired. Keep running!"
            return state

        q = state.current_question
        correct = selected_index == q.correct_index
        state.questions_answered += 1

        if correct:
            state.correct_count += 1
            state.streak += 1
            bonus = s.streak_bonus * min(state.streak - 1, 5)
            state.score += s.correct_score + bonus
            state.speed = min(s.max_speed, state.speed + s.correct_speed_boost)
            state.last_explanation = q.explanation
            state.difficulty = _adaptive_difficulty(state)
        else:
            state.streak = 0
            state.hp = max(0, state.hp - 20)
            state.speed = max(s.min_speed, state.speed - s.wrong_speed_penalty)
            state.last_explanation = (
                f"Not quite. The answer was: {q.options[q.correct_index]}. {q.explanation}"
            )
            if state.hp <= 0:
                state.game_over = True

        state.current_question = None
        return state

    def reset_session(self, session_id: str) -> GameState:
        state = self._require_session(session_id)
        state.score = 0
        state.hp = self.settings.initial_hp
        state.speed = self.settings.initial_speed
        state.streak = 0
        state.questions_answered = 0
        state.correct_count = 0
        state.difficulty = "beginner"
        state.current_question = None
        state.last_explanation = ""
        state.game_over = False
        return state

    def _require_session(self, session_id: str) -> GameState:
        state = self._sessions.get(session_id)
        if not state:
            raise KeyError("session_not_found")
        return state


def _adaptive_difficulty(state: GameState) -> str:
    accuracy = state.correct_count / max(state.questions_answered, 1)
    if state.streak >= 5 and accuracy >= 0.8:
        return "intermediate"
    if state.streak >= 3 and accuracy >= 0.6:
        return "elementary"
    return "beginner"


def _topic_for_streak(streak: int) -> str:
    topics = ["daily life", "food", "school", "travel", "animals", "sports", "weather"]
    return topics[streak % len(topics)]
