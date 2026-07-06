/** ใช้คำที่ไมค์จับได้ตรงๆ — ไม่สลับเป็นคำอื่น */
export function refineChildTranscript(primary: string, _alternatives: string[] = []): string {
  return String(primary || '').trim();
}
