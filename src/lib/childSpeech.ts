/** ปรับข้อความจากเสียงเด็กเล็กที่อาจพูดไม่ชัด */
export function refineChildTranscript(primary: string, alternatives: string[] = []): string {
  const unique = [...new Set([primary, ...alternatives].map((s) => s.trim()).filter(Boolean))];
  if (!unique.length) return '';

  let best = unique[0];
  let bestScore = scoreTranscript(best);

  for (const candidate of unique.slice(1)) {
    const score = scoreTranscript(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best.trim();
}

function scoreTranscript(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  const len = text.replace(/\s/g, '').length;
  // ชอบประโยคที่มีคำมากกว่าและไม่สั้นเกินไป (มักพูดไม่ครบถ้วน)
  return words.length * 12 + Math.min(len, 40);
}
