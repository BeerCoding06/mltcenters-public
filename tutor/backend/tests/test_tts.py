import pytest
from app.services.tts_service import _word_to_viseme, _fallback_visemes


def test_word_to_viseme_vowels():
    assert _word_to_viseme("hello") == "E"
    assert _word_to_viseme("open") == "O"


def test_fallback_visemes_nonempty():
    visemes = _fallback_visemes("Hello there friend", estimated_duration=2.0)
    assert len(visemes) >= 2
    assert visemes[0]["shape"] == "smile"
