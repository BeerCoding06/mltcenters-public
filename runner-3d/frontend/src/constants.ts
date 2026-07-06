export const TARGET_QUESTIONS = 30;

/** ระยะห่างระหว่างด่าน (หน่วย scroll) */
export const OBSTACLE_GAP = 24;

/** สปอว์นล่วงหน้าให้เห็นด่านจากไกล */
export const OBSTACLE_SPAWN_AHEAD_MIN = 32;
export const OBSTACLE_SPAWN_AHEAD_SPREAD = 10;

/** ตำแหน่งเลน X ของสิ่งกีดขวาง */
export const OBSTACLE_LANES = [-2.4, 0, 2.4] as const;

/** เริ่มหลบเมื่อด่านอยู่ห่างเท่านี้ (scroll space) */
export const DODGE_RANGE_MIN = 4;
export const DODGE_RANGE_MAX = 20;

/** เลื่อนตัวละครไปเลนที่หลบ */
export const LANE_DODGE_X = 2.5;

export const QUESTION_TIMER_SEC = 9;
export const FEEDBACK_MS = 1600;
