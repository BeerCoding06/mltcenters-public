import json
import logging
import re
import uuid
import random

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.prompts.questions import EVALUATE_PROMPT, QUESTION_PROMPT

logger = logging.getLogger(__name__)


class QuestionData:
    def __init__(
        self,
        id: str,
        question: str,
        options: list[str],
        correct_index: int,
        explanation: str,
        difficulty: str,
    ):
        self.id = id
        self.question = question
        self.options = options
        self.correct_index = correct_index
        self.explanation = explanation
        self.difficulty = difficulty


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._chat = self._build_chat(0.8)
        self._eval = self._build_chat(0.3)

    def _build_chat(self, temperature: float):
        if self.settings.llm_provider == "ollama":
            return ChatOllama(
                base_url=self.settings.ollama_base_url,
                model=self.settings.ollama_model,
                temperature=temperature,
            )
        kwargs = {
            "api_key": self.settings.openai_api_key or None,
            "model": self.settings.openai_model,
            "temperature": temperature,
        }
        if self.settings.openai_base_url:
            kwargs["base_url"] = self.settings.openai_base_url
        return ChatOpenAI(**kwargs)

    async def generate_question(self, difficulty: str, topic: str) -> QuestionData:
        try:
            response = await self._chat.ainvoke(
                [
                    SystemMessage(content=QUESTION_PROMPT),
                    HumanMessage(content=f"Difficulty: {difficulty}\nTopic: {topic}"),
                ]
            )
            raw = response.content if isinstance(response.content, str) else str(response.content)
            data = _parse_json(raw)
            opts = data["options"][:3]
            while len(opts) < 3:
                opts.append("—")
            return QuestionData(
                id=uuid.uuid4().hex,
                question=data["question"],
                options=opts,
                correct_index=min(2, max(0, int(data["correct_index"]))),
                explanation=data.get("explanation", "Great practice!"),
                difficulty=difficulty,
            )
        except Exception as e:
            logger.warning("LLM question fallback: %s", e)
            return _fallback_question(difficulty)

    async def evaluate_performance(self, stats: dict) -> dict:
        try:
            response = await self._eval.ainvoke(
                [
                    SystemMessage(content=EVALUATE_PROMPT),
                    HumanMessage(content=json.dumps(stats)),
                ]
            )
            raw = response.content if isinstance(response.content, str) else str(response.content)
            return _parse_json(raw)
        except Exception as e:
            logger.warning("LLM evaluate fallback: %s", e)
            acc = stats.get("accuracy", 0)
            return {
                "overall": int(acc),
                "vocabulary": int(acc * 0.95),
                "grammar": int(acc * 0.9),
                "reaction": int(min(100, stats.get("streak", 0) * 15)),
                "level": stats.get("difficulty", "beginner").title(),
                "strengths": ["Good effort in the race!"],
                "improvements": ["Practice more vocabulary daily."],
                "summary": "Keep running and learning — you're improving!",
            }


def _parse_json(raw: str) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
    return json.loads(cleaned)


def _fallback_question(difficulty: str) -> QuestionData:
    bank = [
        {
            "question": "What color is the sky on a sunny day?",
            "options": ["blue", "green", "red"],
            "correct_index": 0,
            "explanation": "The sky looks blue on a clear sunny day.",
        },
        {
            "question": "Which animal says 'meow'?",
            "options": ["dog", "cat", "cow"],
            "correct_index": 1,
            "explanation": "Cats say 'meow'.",
        },
        {
            "question": "Choose the correct verb: I ___ to school every day.",
            "options": ["go", "goes", "going"],
            "correct_index": 0,
            "explanation": "With 'I', use 'go' in present simple.",
        },
    ]
    q = random.choice(bank)
    return QuestionData(
        id=uuid.uuid4().hex,
        question=q["question"],
        options=q["options"],
        correct_index=q["correct_index"],
        explanation=q["explanation"],
        difficulty=difficulty,
    )
