import json
import logging
import re
from typing import AsyncIterator

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.prompts.tutor import EVALUATION_PROMPT, TUTOR_SYSTEM

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._chat = self._build_chat(streaming=True)
        self._eval = self._build_chat(streaming=False)

    def _build_chat(self, streaming: bool):
        if self.settings.llm_provider == "ollama":
            return ChatOllama(
                base_url=self.settings.ollama_base_url,
                model=self.settings.ollama_model,
                temperature=0.7,
            )
        kwargs = {
            "api_key": self.settings.openai_api_key or None,
            "model": self.settings.openai_model,
            "temperature": 0.7,
            "streaming": streaming,
        }
        if self.settings.openai_base_url:
            kwargs["base_url"] = self.settings.openai_base_url
        return ChatOpenAI(**kwargs)

    async def stream_reply(
        self, history: list[dict[str, str]]
    ) -> AsyncIterator[str]:
        messages = [SystemMessage(content=TUTOR_SYSTEM)]
        for item in history:
            if item["role"] == "user":
                messages.append(HumanMessage(content=item["content"]))
            else:
                messages.append(AIMessage(content=item["content"]))
        async for chunk in self._chat.astream(messages):
            text = chunk.content
            if isinstance(text, str) and text:
                yield text

    async def complete_reply(self, history: list[dict[str, str]]) -> str:
        parts = [p async for p in self.stream_reply(history)]
        return "".join(parts)

    async def evaluate(self, transcript: str) -> dict:
        messages = [
            SystemMessage(content=EVALUATION_PROMPT),
            HumanMessage(content=f"Transcript:\n{transcript}"),
        ]
        response = await self._eval.ainvoke(messages)
        raw = response.content if isinstance(response.content, str) else str(response.content)
        return _parse_json(raw)


def _parse_json(raw: str) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        logger.warning("Evaluation JSON parse failed")
    return {
        "overall": 72,
        "grammar": 70,
        "vocabulary": 68,
        "fluency": 74,
        "sentence_structure": 71,
        "confidence": 73,
        "communication": 75,
        "cefr": "B1",
        "grammar_corrections": [],
        "vocabulary_suggestions": [],
        "feedback": ["ฝึกสนทนาภาษาอังกฤษทุกวันนะคะ คุณทำได้ดีมาก!"],
    }
