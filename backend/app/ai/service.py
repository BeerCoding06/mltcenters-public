import json
import logging
import re
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.config import get_settings
from app.prompts.templates import EVALUATION_PROMPT, SYSTEM_PROMPT, TOPIC_PROMPTS

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self) -> None:
        settings = get_settings()
        self._model = settings.llm_model
        llm_kwargs: dict = {
            "api_key": settings.llm_api_key or None,
            "model": settings.llm_model,
        }
        if settings.llm_base_url:
            llm_kwargs["base_url"] = settings.llm_base_url
        self._llm = ChatOpenAI(temperature=0.7, max_tokens=500, **llm_kwargs)
        self._eval_llm = ChatOpenAI(temperature=0.2, max_tokens=800, **llm_kwargs)

    def _build_system_message(self, topic: str) -> str:
        topic_hint = TOPIC_PROMPTS.get(topic, TOPIC_PROMPTS["Free Talk"])
        return f"{SYSTEM_PROMPT}\n\nTopic focus: {topic_hint}"

    async def generate_reply(
        self,
        topic: str,
        history: list[dict[str, str]],
    ) -> str:
        messages = [SystemMessage(content=self._build_system_message(topic))]
        for item in history:
            if item["role"] == "user":
                messages.append(HumanMessage(content=item["content"]))
            elif item["role"] == "assistant":
                messages.append(AIMessage(content=item["content"]))

        prompt = ChatPromptTemplate.from_messages(messages)
        chain = prompt | self._llm
        response = await chain.ainvoke({})
        content = response.content
        return content if isinstance(content, str) else str(content)

    async def evaluate_conversation(self, transcript: str) -> dict[str, Any]:
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", EVALUATION_PROMPT),
                ("human", "Conversation transcript:\n\n{transcript}"),
            ]
        )
        chain = prompt | self._eval_llm
        response = await chain.ainvoke({"transcript": transcript})
        raw = response.content if isinstance(response.content, str) else str(response.content)
        return self._parse_json(raw)

    @staticmethod
    def _parse_json(raw: str) -> dict[str, Any]:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        try:
            data = json.loads(cleaned)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            logger.warning("Failed to parse evaluation JSON: %s", raw[:200])
        return {
            "overall": 70,
            "grammar": 70,
            "vocabulary": 70,
            "fluency": 70,
            "sentence_structure": 70,
            "confidence": 70,
            "communication": 70,
            "cefr": "B1",
            "feedback": [
                "Keep practicing natural conversation daily.",
                "Try using richer vocabulary in your answers.",
                "Focus on complete sentence structure when speaking.",
            ],
        }
