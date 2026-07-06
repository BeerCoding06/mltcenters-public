import asyncio
import random
import uuid
from dataclasses import dataclass, field

from app.core.config import get_settings
from app.services.llm_service import LLMService, QuestionData
from app.services.question_bank import next_from_bank, shuffle_queue

TOPICS = [
    "daily life",
    "food and cooking",
    "school and study",
    "animals",
    "sports",
    "travel",
    "weather",
    "family",
    "jobs",
    "hobbies",
    "technology",
    "nature",
    "shopping",
    "health",
    "music and movies",
    "city life",
    "feelings",
    "clothes",
    "time and dates",
    "transport",
]

QUESTION_STYLES = [
    "vocabulary — choose the correct meaning",
    "grammar — fill in the blank",
    "conversation — pick the best reply",
    "reading — short situational question",
    "prepositions or articles",
    "past tense or present tense",
    "comparatives and superlatives",
    "countable vs uncountable nouns",
]


@dataclass
class GameState:
    session_id: str
    score: int = 0
    hp: int = 100
    speed: float = 8.0
    streak: int = 0
    questions_answered: int = 0
    correct_count: int = 0
    difficulty: str = "beginner"
    current_question: QuestionData | None = None
    last_explanation: str = ""
    last_correct: bool | None = None
    game_over: bool = False
    distance: float = 0.0

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
            "speed": round(self.speed, 2),
            "streak": self.streak,
            "questions_answered": self.questions_answered,
            "correct_count": self.correct_count,
            "difficulty": self.difficulty,
            "current_question": q,
            "last_explanation": self.last_explanation,
            "last_correct": self.last_correct,
            "game_over": self.game_over,
            "distance": round(self.distance, 1),
        }


@dataclass
class SessionMeta:
    queue: list[QuestionData] = field(default_factory=list)
    asked: set[str] = field(default_factory=set)
    recent: list[str] = field(default_factory=list)
    prefetching: bool = False


class GameService:
    _sessions: dict[str, GameState] = {}
    _meta: dict[str, SessionMeta] = {}

    def __init__(self) -> None:
        self.settings = get_settings()
        self.llm = LLMService()
        self.ai_enabled = self.settings.llm_provider == "ollama" or bool(
            self.settings.openai_api_key
        )

    def create_session(self) -> GameState:
        sid = uuid.uuid4().hex
        state = GameState(
            session_id=sid,
            hp=self.settings.initial_hp,
            speed=self.settings.initial_speed,
        )
        self._sessions[sid] = state
        self._meta[sid] = SessionMeta()
        self._bootstrap_queue(sid)
        return state

    def get_session(self, session_id: str) -> GameState | None:
        return self._sessions.get(session_id)

    async def generate_question(self, session_id: str) -> GameState:
        state = self._require(session_id)
        if state.game_over:
            return state
        meta = self._meta.setdefault(session_id, SessionMeta())
        avoid = "\n".join(f"- {q}" for q in meta.recent[-12:])
        topic = random.choice(TOPICS)
        style = random.choice(QUESTION_STYLES)

        if self.ai_enabled:
            if meta.queue:
                state.current_question = meta.queue.pop(0)
            else:
                state.current_question = await self.llm.generate_question(
                    state.difficulty, topic, avoid=avoid, style=style, asked=meta.asked
                )
            if len(meta.queue) < 6:
                self._start_prefetch(session_id, 8)
        elif meta.queue:
            state.current_question = meta.queue.pop(0)
            if len(meta.queue) < 6:
                self._refill_bank_queue(session_id, 12)
        else:
            state.current_question = next_from_bank(meta.asked, state.difficulty)

        if state.current_question:
            meta.recent.append(state.current_question.question)
            meta.asked.add(state.current_question.question)
        return state

    def check_answer(self, session_id: str, question_id: str, selected_index: int) -> GameState:
        state = self._require(session_id)
        s = self.settings
        if state.game_over or not state.current_question:
            return state
        if state.current_question.id != question_id:
            return state

        q = state.current_question
        correct = selected_index == q.correct_index
        state.questions_answered += 1
        state.last_correct = correct

        if correct:
            state.correct_count += 1
            state.streak += 1
            bonus = s.streak_bonus * min(state.streak - 1, 5)
            state.score += s.correct_score + bonus
            state.speed = min(s.max_speed, state.speed + s.correct_speed_boost)
            state.last_explanation = q.explanation
            state.difficulty = _adaptive(state)
        else:
            state.streak = 0
            state.hp = max(0, state.hp - 15)
            state.speed = max(s.min_speed, state.speed - s.wrong_speed_penalty)
            state.last_explanation = (
                f"Correct: {q.options[q.correct_index]}. {q.explanation}"
            )
            if state.hp <= 0:
                state.game_over = True

        state.current_question = None
        return state

    async def evaluate_performance(self, session_id: str) -> dict:
        state = self._require(session_id)
        accuracy = (state.correct_count / max(state.questions_answered, 1)) * 100
        stats = {
            "score": state.score,
            "questions_answered": state.questions_answered,
            "correct_count": state.correct_count,
            "accuracy": round(accuracy, 1),
            "streak": state.streak,
            "difficulty": state.difficulty,
            "distance": state.distance,
        }
        evaluation = await self.llm.evaluate_performance(stats)
        return {"session_id": session_id, "stats": stats, "evaluation": evaluation}

    def tick_distance(self, session_id: str, delta: float) -> GameState:
        state = self._require(session_id)
        if not state.game_over and state.current_question is None:
            state.distance += state.speed * delta
        return state

    def reset_session(self, session_id: str) -> GameState:
        state = self._require(session_id)
        state.score = 0
        state.hp = self.settings.initial_hp
        state.speed = self.settings.initial_speed
        state.streak = 0
        state.questions_answered = 0
        state.correct_count = 0
        state.difficulty = "beginner"
        state.current_question = None
        state.last_explanation = ""
        state.last_correct = None
        state.game_over = False
        state.distance = 0.0
        self._meta[session_id] = SessionMeta()
        self._bootstrap_queue(session_id)
        return state

    def _bootstrap_queue(self, session_id: str) -> None:
        if self.ai_enabled:
            self._start_prefetch(session_id, 10)
        else:
            self._refill_bank_queue(session_id, 20)

    def _refill_bank_queue(self, session_id: str, target: int) -> None:
        meta = self._meta.setdefault(session_id, SessionMeta())
        if len(meta.queue) >= target:
            return
        for q in shuffle_queue(target - len(meta.queue)):
            if q.question not in meta.asked:
                meta.queue.append(q)
                meta.asked.add(q.question)

    def _start_prefetch(self, session_id: str, count: int) -> None:
        if not self.ai_enabled:
            return
        meta = self._meta.get(session_id)
        if not meta or meta.prefetching:
            return
        meta.prefetching = True
        asyncio.create_task(self._prefetch_questions(session_id, count))

    async def _prefetch_questions(self, session_id: str, count: int) -> None:
        meta = self._meta.get(session_id)
        if not meta:
            return
        try:
            for _ in range(count):
                if session_id not in self._sessions:
                    break
                if len(meta.queue) >= 15:
                    break
                state = self._sessions.get(session_id)
                difficulty = state.difficulty if state else "beginner"
                avoid = "\n".join(f"- {q}" for q in meta.recent[-12:])
                q = await self.llm.generate_question(
                    difficulty,
                    random.choice(TOPICS),
                    avoid=avoid,
                    style=random.choice(QUESTION_STYLES),
                    asked=meta.asked,
                )
                if q.question in meta.asked:
                    continue
                meta.queue.append(q)
                meta.asked.add(q.question)
        finally:
            meta.prefetching = False

    def _require(self, session_id: str) -> GameState:
        state = self._sessions.get(session_id)
        if not state:
            raise KeyError("session_not_found")
        return state


def _adaptive(state: GameState) -> str:
    acc = state.correct_count / max(state.questions_answered, 1)
    if state.streak >= 5 and acc >= 0.8:
        return "intermediate"
    if state.streak >= 3 and acc >= 0.6:
        return "elementary"
    return "beginner"
