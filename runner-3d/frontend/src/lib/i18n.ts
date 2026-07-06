export const th = {
  nav: {
    home: "หน้าแรก",
    about: "เกี่ยวกับเรา",
    activities: "กิจกรรม",
    schedule: "กำหนดการ",
    gallery: "แกลเลอรี",
    assessment: "คุยภาษาอังกฤษ",
    runner: "เกมวิ่ง 3D",
    register: "ลงทะเบียน",
    contact: "ติดต่อ",
    brand: "MLTCENTERS",
  },
  game: {
    title: "เกมวิ่งภาษาอังกฤษ 3D",
    subtitle: "หยุดหน้าสิ่งกีดขวางตอบคำถาม — ถูกกระโดดข้าม ผิดชนแล้ววิ่งต่อ!",
    loading: "กำลังเริ่มการแข่งขัน…",
    correct: "✅ ถูกต้อง! หลบสิ!",
    wrong: "❌ ผิด! ช้าลงแล้ว…",
    raceOver: "จบการแข่งขัน",
    accuracy: "ความแม่นยำ",
    raceAgain: "เล่นอีกครั้ง",
    aiReport: "สรุปผลจาก AI",
    overall: "ภาพรวม",
    level: "ระดับ",
    vocabulary: "คำศัพท์",
    grammar: "ไวยากรณ์",
    reaction: "ปฏิกิริยา",
    strengths: "จุดเด่น",
    improvements: "ควรพัฒนา",
    score: "คะแนน",
    speed: "ความเร็ว",
    streak: "สตรีค",
    questions: "คำถาม",
    hp: "พลังชีวิต",
    race: "ความคืบหน้า",
    raceHint: (target: number) =>
      `ตอบคำถามให้มากขึ้นเพื่อวิ่งเร็วขึ้น — ตอบครบ ${target} ข้อเพื่อจบการแข่งขัน!`,
    correctAnswer: "คำตอบที่ถูก",
    difficulty: {
      preschool: "เด็กเล็ก 1-5 ขวบ",
      beginner: "เด็กเล็ก 1-5 ขวบ",
      elementary: "พื้นฐาน",
      intermediate: "ปานกลาง",
    },
    levelName: {
      Preschool: "เด็กเล็ก 1-5 ขวบ",
      Beginner: "เด็กเล็ก 1-5 ขวบ",
      Elementary: "พื้นฐาน",
      Intermediate: "ปานกลาง",
    },
  },
} as const;

export type Th = typeof th;

export function difficultyLabel(key: string): string {
  const k = key.toLowerCase() as keyof typeof th.game.difficulty;
  return th.game.difficulty[k] ?? key;
}

export function levelLabel(key: string): string {
  return th.game.levelName[key as keyof typeof th.game.levelName] ?? key;
}
