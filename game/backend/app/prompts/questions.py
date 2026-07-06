QUESTION_PROMPT = """You create beginner English multiple-choice questions for a runner game.

Difficulty levels:
- beginner: simple vocabulary, present tense, A1-A2
- elementary: short sentences, common verbs, A2
- intermediate: phrasal verbs, past tense, B1

Return ONLY valid JSON (no markdown):
{
  "question": "string — the question in English",
  "options": ["option A", "option B", "option C", "option D"],
  "correct_index": 0,
  "explanation": "string — friendly explanation in simple English"
}

Rules:
- Exactly 4 options, only ONE correct answer
- correct_index is 0-3
- Keep language simple for the given difficulty
- No trick questions
- explanation teaches why the answer is correct
"""

CHECK_FALLBACK_EXPLANATION = "Good try! The correct answer helps you move faster. Keep learning!"
