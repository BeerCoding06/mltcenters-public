import json
import logging
import re
import uuid
from dataclasses import dataclass, field

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.prompts.questions import QUESTION_PROMPT

logger = logging.getLogger(__name__)


@dataclass
class QuestionData:
    id: str
    question: str
    options: list[str]
    correct_index: int
    explanation: str
    difficulty: str


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._chat = self._build_chat()

    def _build_chat(self):
        if self.settings.llm_provider == "ollama":
            return ChatOllama(
                base_url=self.settings.ollama_base_url,
                model=self.settings.ollama_model,
                temperature=0.8,
            )
        kwargs = {
            "api_key": self.settings.openai_api_key or None,
            "model": self.settings.openai_model,
            "temperature": 0.8,
        }
        if self.settings.openai_base_url:
            kwargs["base_url"] = self.settings.openai_base_url
        return ChatOpenAI(**kwargs)

    async def generate_question(self, difficulty: str, topic: str = "daily life") -> QuestionData:
        messages = [
            SystemMessage(content=QUESTION_PROMPT),
            HumanMessage(
                content=f"Difficulty: {difficulty}\nTopic: {topic}\nGenerate one unique question."
            ),
        ]
        try:
            response = await self._chat.ainvoke(messages)
            raw = response.content if isinstance(response.content, str) else str(response.content)
            data = _parse_json(raw)
            return QuestionData(
                id=uuid.uuid4().hex,
                question=data["question"],
                options=data["options"][:4],
                correct_index=int(data["correct_index"]),
                explanation=data.get("explanation", "Great job practicing English!"),
                difficulty=difficulty,
            )
        except Exception as e:
            logger.warning("LLM question failed, using fallback: %s", e)
            return _fallback_question(difficulty)


def _parse_json(raw: str) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
    return json.loads(cleaned)


def _fallback_question(difficulty: str) -> QuestionData:
    bank = [
        {
            "question": "What is the opposite of 'hot'?",
            "options": ["cold", "warm", "big", "fast"],
            "correct_index": 0,
            "explanation": "'Cold' is the opposite of 'hot'.",
        },
        {
            "question": "Choose the correct sentence:",
            "options": ["She go to school.", "She goes to school.", "She going school.", "She goed to school."],
            "correct_index": 1,
            "explanation": "With 'she', we use 'goes' in the present simple.",
        },
        {
            "question": "Which word means 'a place where you buy food'?",
            "options": ["library", "supermarket", "hospital", "airport"],
            "correct_index": 1,
            "explanation": "A supermarket is a shop where you buy food.",
        },
    ]
    import random

    q = random.choice(bank)
    return QuestionData(
        id=uuid.uuid4().hex,
        question=q["question"],
        options=q["options"],
        correct_index=q["correct_index"],
        explanation=q["explanation"],
        difficulty=difficulty,
    )
