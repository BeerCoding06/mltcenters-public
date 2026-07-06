import json
import random
import uuid
from pathlib import Path

from app.services.llm_service import QuestionData

_BANK_PATH = Path(__file__).resolve().parent.parent / "data" / "fallback_questions.json"
_BANK: list[dict] | None = None


def load_bank() -> list[dict]:
    global _BANK
    if _BANK is None:
        with open(_BANK_PATH, encoding="utf-8") as f:
            _BANK = json.load(f)
    return _BANK


def shuffle_queue(count: int = 25) -> list[QuestionData]:
    bank = load_bank().copy()
    random.shuffle(bank)
    return [_to_question(q, "beginner") for q in bank[:count]]


def next_from_bank(asked: set[str], difficulty: str) -> QuestionData:
    bank = load_bank()
    pool = [q for q in bank if q["question"] not in asked]
    if not pool:
        asked.clear()
        pool = bank.copy()
    q = random.choice(pool)
    asked.add(q["question"])
    return _to_question(q, difficulty)


def _to_question(raw: dict, difficulty: str) -> QuestionData:
    return QuestionData(
        id=uuid.uuid4().hex,
        question=raw["question"],
        options=raw["options"][:3],
        correct_index=int(raw["correct_index"]),
        explanation=raw.get("explanation", "Good job!"),
        difficulty=difficulty,
    )
