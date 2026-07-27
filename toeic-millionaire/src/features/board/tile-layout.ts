/** Monopoly-style grid positions for 40 tiles (0 = bottom-left, clockwise). */
export function tileGridPosition(id: number): { row: number; col: number } {
  if (id <= 10) return { row: 10, col: id };
  if (id <= 20) return { row: 20 - id, col: 10 };
  if (id <= 30) return { row: 0, col: 30 - id };
  return { row: id - 30, col: 0 };
}

export const BOARD_GRID = {
  rows: 11,
  cols: 11,
} as const;
