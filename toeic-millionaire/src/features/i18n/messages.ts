export type GameLang = "th" | "en";

type StaticMessages = {
  brand: string;
  langToggleShowTh: string;
  langToggleShowEn: string;
  home: string;
  lobby: string;
  backToLobby: string;
  landingHeadline: string;
  landingSub: string;
  playNow: string;
  enterLobby: string;
  landingGuestNote: string;
  gameLobby: string;
  gameLobbySub: string;
  displayName: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  botOpponents: string;
  startGame: string;
  starting: string;
  failedStart: string;
  startTimeout: string;
  dbHint: string;
  loadingBoard: string;
  gameNotFound: string;
  youWin: string;
  gameOver: string;
  winner: string;
  coins: string;
  yourScore: string;
  lap: string;
  loginToSave: string;
  playAgain: string;
  rollDice: string;
  rolling: string;
  waiting: string;
  thinking: string;
  yourTurn: string;
  bot: string;
  turn: string;
  quiz: string;
  submit: string;
  submitting: string;
  hint: string;
  hintTitle: string;
  translateTh: string;
  showEnglish: string;
  continue: string;
  drawing: string;
  luckyCard: string;
  eventCard: string;
  saveProgress: string;
  saveProgressSub: string;
  magicLink: string;
  password: string;
  email: string;
  sendMagicLink: string;
  signIn: string;
  working: string;
  or: string;
  continueGoogle: string;
  continueGuest: string;
  authNotConfigured: string;
  checkingSession: string;
  loading: string;
  signInFailed: string;
  botTurn: string;
  botQuizResolved: string;
  botCardResolved: string;
  toastResting: string;
  toastRestingDesc: string;
  toastBonus: string;
  toastTax: string;
  toastRest: string;
  toastRestDesc: string;
  toastFreeHint: string;
  toastFreeHintDesc: string;
  toastMiniGame: string;
  toastMiniGameDesc: string;
  toastChallenge: string;
  toastChallengeDesc: string;
  toastChest: string;
  toastTreasure: string;
  toastSpecial: string;
  toastBonusQuiz: string;
  toastLuckyBreak: string;
  correct: string;
  incorrect: string;
  translationFailed: string;
  retry: string;
};

type Messages = StaticMessages & {
  effectCoins: (n: number) => string;
  effectExp: (n: number) => string;
  effectMove: (n: number) => string;
  effectSkip: string;
  effectFreeHint: string;
  effectBonusQuiz: string;
};

export const messages: Record<GameLang, Messages> = {
  en: {
    brand: "TOEIC Millionaire",
    langToggleShowTh: "Show Thai",
    langToggleShowEn: "Show English",
    home: "Home",
    lobby: "Lobby",
    backToLobby: "Back to lobby",
    landingHeadline: "Roll. Learn. Win.",
    landingSub:
      "A Monopoly-style board game mixed with TOEIC practice — answer quizzes, draw lucky cards, and race bots to the finish.",
    playNow: "Play now",
    enterLobby: "Enter lobby",
    landingGuestNote: "No sign-up · Guest progress saved on this device",
    gameLobby: "Game Lobby",
    gameLobbySub: "Configure your solo match against AI bots.",
    displayName: "Display name",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    botOpponents: "Bot opponents",
    startGame: "Start Game",
    starting: "Starting…",
    failedStart: "Failed to start game",
    startTimeout:
      "Start timed out. Set DATABASE_URL for the game and run prisma migrate + seed.",
    dbHint: "Database not ready. Set DATABASE_URL, then migrate + seed.",
    loadingBoard: "Loading board…",
    gameNotFound: "Game not found",
    youWin: "You win!",
    gameOver: "Game over",
    winner: "Winner",
    coins: "coins",
    yourScore: "Your score",
    lap: "Lap",
    loginToSave: "Login to save progress",
    playAgain: "Play again",
    rollDice: "Roll dice",
    rolling: "Rolling…",
    waiting: "Waiting…",
    thinking: "is thinking…",
    yourTurn: "(Your turn)",
    bot: "(Bot)",
    turn: "Turn",
    quiz: "Quiz",
    submit: "Submit",
    submitting: "Submitting…",
    hint: "Hint",
    hintTitle: "Hint (−5 coins)",
    translateTh: "Translate to Thai",
    showEnglish: "Show English",
    continue: "Continue",
    drawing: "Drawing…",
    luckyCard: "Lucky Card",
    eventCard: "Event Card",
    saveProgress: "Save your progress",
    saveProgressSub: "Sign in to sync coins, EXP, and stats across devices.",
    magicLink: "Magic link",
    password: "Password",
    email: "Email",
    sendMagicLink: "Send magic link",
    signIn: "Sign in",
    working: "Working…",
    or: "or",
    continueGoogle: "Continue with Google",
    continueGuest: "Continue as guest →",
    authNotConfigured:
      "Account sign-in is not configured yet. You can still play as a guest — progress is saved on this device only.",
    checkingSession: "Checking session…",
    loading: "Loading…",
    signInFailed: "Sign-in failed. Please try again.",
    botTurn: "Bot turn",
    botQuizResolved: "Quiz resolved automatically.",
    botCardResolved: "Card resolved automatically.",
    toastResting: "Resting",
    toastRestingDesc: "Skipped turn — recovering from rest.",
    toastBonus: "Bonus!",
    toastTax: "Tax",
    toastRest: "Rest",
    toastRestDesc: "You'll skip your next turn.",
    toastFreeHint: "Free hint",
    toastFreeHintDesc: "Your next hint is free!",
    toastMiniGame: "Mini game",
    toastMiniGameDesc: "Mini game coming soon — keep playing!",
    toastChallenge: "Challenge",
    toastChallengeDesc: "Challenge tile — stay sharp!",
    toastChest: "chest",
    toastTreasure: "Treasure found!",
    toastSpecial: "Special tile",
    toastBonusQuiz: "Bonus quiz opportunity!",
    toastLuckyBreak: "Lucky break!",
    effectCoins: (n) => (n >= 0 ? `+${n} coins` : `${n} coins`),
    effectExp: (n) => (n >= 0 ? `+${n} EXP` : `${n} EXP`),
    effectMove: (n) => (n >= 0 ? `Move +${n}` : `Move ${n}`),
    effectSkip: "Skip next turn",
    effectFreeHint: "Free hint unlocked",
    effectBonusQuiz: "Bonus quiz!",
    correct: "Correct",
    incorrect: "Incorrect",
    translationFailed: "Failed to load translation",
    retry: "Retry",
  },
  th: {
    brand: "TOEIC เกมส์เศรษฐี",
    langToggleShowTh: "แสดงภาษาไทย",
    langToggleShowEn: "แสดงภาษาอังกฤษ",
    home: "หน้าแรก",
    lobby: "ล็อบบี้",
    backToLobby: "กลับล็อบบี้",
    landingHeadline: "ทอยลูกเต๋า. เรียนรู้. ชนะ.",
    landingSub:
      "เกมกระดานสไตล์ Monopoly ผสมฝึก TOEIC — ตอบคำถาม เปิดการ์ดโชคดี และแข่งกับบอทสู่เส้นชัย",
    playNow: "เล่นเลย",
    enterLobby: "เข้าล็อบบี้",
    landingGuestNote: "ไม่ต้องสมัคร · บันทึกความคืบหน้าในเครื่องเป็น Guest",
    gameLobby: "ล็อบบี้เกม",
    gameLobbySub: "ตั้งค่าแมตช์เดี่ยวแข่งกับบอท AI",
    displayName: "ชื่อที่แสดง",
    difficulty: "ระดับความยาก",
    easy: "ง่าย",
    medium: "ปานกลาง",
    hard: "ยาก",
    botOpponents: "จำนวนบอท",
    startGame: "เริ่มเกม",
    starting: "กำลังเริ่ม…",
    failedStart: "เริ่มเกมไม่สำเร็จ",
    startTimeout:
      "เริ่มเกมหมดเวลา — ตั้งค่า DATABASE_URL แล้วรัน prisma migrate + seed",
    dbHint: "ฐานข้อมูลยังไม่พร้อม — ตั้ง DATABASE_URL แล้ว migrate + seed",
    loadingBoard: "กำลังโหลดกระดาน…",
    gameNotFound: "ไม่พบเกม",
    youWin: "คุณชนะ!",
    gameOver: "จบเกม",
    winner: "ผู้ชนะ",
    coins: "เหรียญ",
    yourScore: "คะแนนของคุณ",
    lap: "รอบ",
    loginToSave: "เข้าสู่ระบบเพื่อบันทึก",
    playAgain: "เล่นอีกครั้ง",
    rollDice: "ทอยลูกเต๋า",
    rolling: "กำลังทอย…",
    waiting: "รอคิว…",
    thinking: "กำลังคิด…",
    yourTurn: "(ตาคุณ)",
    bot: "(บอท)",
    turn: "เทิร์น",
    quiz: "คำถาม",
    submit: "ส่งคำตอบ",
    submitting: "กำลังส่ง…",
    hint: "คำใบ้",
    hintTitle: "คำใบ้ (−5 เหรียญ)",
    translateTh: "แปลเป็นไทย",
    showEnglish: "แสดงภาษาอังกฤษ",
    continue: "ดำเนินการต่อ",
    drawing: "กำลังจั่ว…",
    luckyCard: "การ์ดโชคดี",
    eventCard: "การ์ดเหตุการณ์",
    saveProgress: "บันทึกความคืบหน้า",
    saveProgressSub: "เข้าสู่ระบบเพื่อซิงก์เหรียญ EXP และสถิติข้ามเครื่อง",
    magicLink: "ลิงก์เข้าสู่ระบบ",
    password: "รหัสผ่าน",
    email: "อีเมล",
    sendMagicLink: "ส่งลิงก์เข้าสู่ระบบ",
    signIn: "เข้าสู่ระบบ",
    working: "กำลังดำเนินการ…",
    or: "หรือ",
    continueGoogle: "เข้าสู่ระบบด้วย Google",
    continueGuest: "เล่นแบบ Guest →",
    authNotConfigured:
      "ยังไม่ได้ตั้งค่าการเข้าสู่ระบบ คุณยังเล่นแบบ Guest ได้ — ความคืบหน้าบันทึกในเครื่องนี้เท่านั้น",
    checkingSession: "กำลังตรวจสอบเซสชัน…",
    loading: "กำลังโหลด…",
    signInFailed: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่",
    botTurn: "ตาบอท",
    botQuizResolved: "ตอบคำถามอัตโนมัติแล้ว",
    botCardResolved: "จั่วการ์ดอัตโนมัติแล้ว",
    toastResting: "พัก",
    toastRestingDesc: "ข้ามเทิร์น — กำลังพักฟื้น",
    toastBonus: "โบนัส!",
    toastTax: "ภาษี",
    toastRest: "พัก",
    toastRestDesc: "คุณจะข้ามเทิร์นถัดไป",
    toastFreeHint: "คำใบ้ฟรี",
    toastFreeHintDesc: "คำใบ้ครั้งถัดไปฟรี!",
    toastMiniGame: "มินิเกม",
    toastMiniGameDesc: "มินิเกมเร็วๆ นี้ — เล่นต่อเลย!",
    toastChallenge: "ท้าทาย",
    toastChallengeDesc: "ช่องท้าทาย — ตั้งใจไว้!",
    toastChest: "หีบ",
    toastTreasure: "พบสมบัติ!",
    toastSpecial: "ช่องพิเศษ",
    toastBonusQuiz: "โอกาสควิซโบนัส!",
    toastLuckyBreak: "โชคดี!",
    effectCoins: (n) => (n >= 0 ? `+${n} เหรียญ` : `${n} เหรียญ`),
    effectExp: (n) => (n >= 0 ? `+${n} EXP` : `${n} EXP`),
    effectMove: (n) => (n >= 0 ? `เดิน +${n}` : `เดิน ${n}`),
    effectSkip: "ข้ามเทิร์นถัดไป",
    effectFreeHint: "ปลดล็อกคำใบ้ฟรี",
    effectBonusQuiz: "ควิซโบนัส!",
    correct: "ถูกต้อง",
    incorrect: "ไม่ถูกต้อง",
    translationFailed: "โหลดคำแปลไม่สำเร็จ",
    retry: "ลองใหม่",
  },
};
