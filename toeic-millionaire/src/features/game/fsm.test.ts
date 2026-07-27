import { describe, it, expect } from "vitest";
import {
  advancePosition,
  rollDice,
  checkWin,
  loadTiles,
  resolveTile,
} from "./fsm";

describe("advancePosition", () => {
  it("wraps board and increments lap when passing START", () => {
    const r = advancePosition(38, 4, 0, 40);
    expect(r.position).toBe(2);
    expect(r.lap).toBe(1);
    expect(r.passedStart).toBe(true);
  });

  it("does not increment lap when staying on the same lap", () => {
    const r = advancePosition(5, 3, 0, 40);
    expect(r.position).toBe(8);
    expect(r.lap).toBe(0);
    expect(r.passedStart).toBe(false);
  });
});

describe("checkWin", () => {
  it("wins on 2 laps", () => {
    const winner = checkWin(
      [{ id: "p1", lap: 2, coins: 1000, turns: 5 }],
      { lapsToWin: 2, maxTurnsPerPlayer: 30 },
    );
    expect(winner).toBe("p1");
  });

  it("picks highest coins when all players hit turn cap", () => {
    const winner = checkWin(
      [
        { id: "p1", lap: 1, coins: 1200, turns: 30 },
        { id: "p2", lap: 1, coins: 1800, turns: 30 },
      ],
      { lapsToWin: 2, maxTurnsPerPlayer: 30 },
    );
    expect(winner).toBe("p2");
  });

  it("returns null when game is still in progress", () => {
    const winner = checkWin(
      [{ id: "p1", lap: 1, coins: 1000, turns: 10 }],
      { lapsToWin: 2, maxTurnsPerPlayer: 30 },
    );
    expect(winner).toBeNull();
  });
});

describe("loadTiles", () => {
  it("loads exactly 40 tiles starting with START", () => {
    const tiles = loadTiles();
    expect(tiles).toHaveLength(40);
    expect(tiles[0].type).toBe("START");
    expect(tiles[1].type).toBe("VOCABULARY");
  });
});

describe("resolveTile", () => {
  it("maps quiz tiles to quiz actions", () => {
    const tiles = loadTiles();
    const vocab = tiles.find((t) => t.type === "VOCABULARY")!;
    expect(resolveTile(vocab)).toEqual({
      type: "quiz",
      category: "VOCABULARY",
    });
  });

  it("maps lucky card to draw action", () => {
    const tiles = loadTiles();
    const lucky = tiles.find((t) => t.type === "LUCKY_CARD")!;
    expect(resolveTile(lucky)).toEqual({ type: "drawCard", deck: "LUCKY" });
  });
});

describe("rollDice", () => {
  it("returns a value between 1 and 6", () => {
    for (let i = 0; i < 50; i++) {
      const value = rollDice();
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    }
  });
});
