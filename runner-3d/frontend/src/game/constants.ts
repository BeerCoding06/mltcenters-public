export const TARGET_QUESTIONS = 30;

export const PREFETCH_QUESTIONS = 20;

export const OBSTACLE_GAP_BASE = 28;
export const OBSTACLE_SPAWN_AHEAD_MIN = 38;
export const OBSTACLE_SPAWN_AHEAD_SPREAD = 14;

/** แสดงคำถามเมื่อสิ่งกีดขวางอยู่ห่างเท่านี้ (ครอบคลุมระยะ spawn 38–52) */
export const QUESTION_TRIGGER_MIN = 14;
export const QUESTION_TRIGGER_MAX = 56;

/** ชนสิ่งกีดขวางเมื่อถึงระยะนี้ (ยังไม่ตอบ) */
export const OBSTACLE_HIT_Z = 1.8;

/** ช้าลงขณะมีคำถาม — ไม่จับเวลา แต่ให้เวลาคิด */
export const QUESTION_SCROLL_SLOW = 0.38;

export const JUMP_DURATION = 0.58;
export const JUMP_HEIGHT = 1.55;
export const JUMP_START_RATIO = 0.12;
export const JUMP_LAND_RATIO = 0.18;

export const HIT_RECOVER_SEC = 0.8;
export const HIT_SLOW_FACTOR = 0.62;
export const CORRECT_SPEED_BOOST = 1.04;
export const WRONG_SPEED_PENALTY = 0.88;

export const CAMERA_ZOOM_BOOST = 1.12;
export const CAMERA_SHAKE_DECAY = 8;
