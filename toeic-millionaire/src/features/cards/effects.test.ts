import { describe, expect, it } from "vitest";
import { applyCardEffect, mergePatch } from "./effects";

const basePlayer = {
  id: "p1",
  position: 10,
  lap: 1,
  coins: 1500,
  exp: 100,
  skipNext: false,
};

describe("applyCardEffect", () => {
  it("adds coins", () => {
    const result = applyCardEffect({}, basePlayer, { type: "coins", amount: 200 });
    expect(result.patch.coins).toBe(1700);
    expect(result.summary).toBe("+200 coins");
  });

  it("subtracts coins without going below zero", () => {
    const result = applyCardEffect({}, { ...basePlayer, coins: 100 }, {
      type: "coins",
      amount: -150,
    });
    expect(result.patch.coins).toBe(0);
  });

  it("adds exp", () => {
    const result = applyCardEffect({}, basePlayer, { type: "exp", amount: 40 });
    expect(result.patch.exp).toBe(140);
    expect(result.summary).toBe("+40 EXP");
  });

  it("sets skipNext on skipTurn", () => {
    const result = applyCardEffect({}, basePlayer, { type: "skipTurn" });
    expect(result.patch.skipNext).toBe(true);
    expect(mergePatch(basePlayer, result.patch).skipNext).toBe(true);
  });

  it("moves forward and grants start bonus when passing start", () => {
    const result = applyCardEffect({}, { ...basePlayer, position: 38, lap: 0 }, {
      type: "move",
      steps: 4,
    });
    expect(result.patch.position).toBe(2);
    expect(result.patch.lap).toBe(1);
    expect(result.patch.startBonus).toBe(200);
    expect(result.patch.coins).toBe(1700);
  });

  it("moves backward without start bonus", () => {
    const result = applyCardEffect({}, { ...basePlayer, position: 5, lap: 1 }, {
      type: "move",
      steps: -2,
    });
    expect(result.patch.position).toBe(3);
    expect(result.patch.lap).toBe(1);
    expect(result.patch.startBonus).toBeUndefined();
  });

  it("wraps backward across lap boundary", () => {
    const result = applyCardEffect({}, { ...basePlayer, position: 1, lap: 1 }, {
      type: "move",
      steps: -3,
    });
    expect(result.patch.position).toBe(38);
    expect(result.patch.lap).toBe(0);
  });

  it("returns bonusQuiz metadata without changing stats", () => {
    const result = applyCardEffect({}, basePlayer, {
      type: "bonusQuiz",
      category: "GRAMMAR",
      reward: { coins: 100, exp: 20 },
    });
    expect(result.patch.bonusQuiz).toEqual({
      category: "GRAMMAR",
      reward: { coins: 100, exp: 20 },
    });
    expect(result.patch.coins).toBeUndefined();
  });
});
