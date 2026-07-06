QUESTION_PROMPT = """You create beginner English multiple-choice questions for a 3D runner game.

Difficulty: beginner (A1-A2), elementary (A2), intermediate (B1)

Return ONLY valid JSON:
{
  "question": "string",
  "options": ["A option", "B option", "C option"],
  "correct_index": 0,
  "explanation": "short friendly explanation"
}

Rules:
- Exactly 3 options (A, B, C), ONE correct answer
- correct_index is 0, 1, or 2
- Simple vocabulary and grammar for the difficulty level
- explanation teaches why the answer is correct
"""

EVALUATE_PROMPT = """Evaluate the player's English quiz performance in a runner game.
Return ONLY JSON:
{
  "overall": 0-100,
  "vocabulary": 0-100,
  "grammar": 0-100,
  "reaction": 0-100,
  "level": "Beginner|Elementary|Intermediate",
  "strengths": ["..."],
  "improvements": ["..."],
  "summary": "one encouraging paragraph"
}
"""
