QUESTION_PROMPT = """You create fresh, unique English multiple-choice questions for a 3D runner learning game.

Difficulty: beginner (A1-A2), elementary (A2), intermediate (B1)

Return ONLY valid JSON (no markdown):
{
  "question": "string",
  "options": ["A option", "B option", "C option"],
  "correct_index": 0,
  "explanation": "short friendly explanation"
}

Rules:
- Exactly 3 distinct options, ONE correct answer
- correct_index is 0, 1, or 2
- Match the topic and question style given
- Never repeat or paraphrase questions from the avoid list
- Be creative — new scenarios, words, and sentences every time
- Keep questions short and clear for mobile players
"""

EVALUATE_PROMPT = """ประเมินผลการเล่นเกมวิ่งตอบคำถามภาษาอังกฤษของผู้เล่น
ตอบเป็นภาษาไทยทั้งหมด Return ONLY valid JSON (no markdown):
{
  "overall": 0-100,
  "vocabulary": 0-100,
  "grammar": 0-100,
  "reaction": 0-100,
  "level": "Beginner|Elementary|Intermediate",
  "strengths": ["..."],
  "improvements": ["..."],
  "summary": "ย่อหน้าสรุปภาษาไทยที่ให้กำลังใจ"
}

กฎ:
- strengths และ improvements อย่างละ 1-2 ข้อ เป็นภาษาไทย
- summary อธิบายผลงาน คะแนน และแนะนำอย่างเป็นมิตร
"""
