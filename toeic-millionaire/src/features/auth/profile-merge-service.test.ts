import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  createProfileMergeService,
  mergeProfileStats,
} from "./profile-merge-service";

const baseProfile = {
  coins: 100,
  diamonds: 5,
  exp: 200,
  level: 2,
  gamesPlayed: 3,
  gamesWon: 1,
  vocabAccuracy: 0.7,
  grammarAccuracy: 0.5,
  readingAccuracy: 0.6,
  listeningAccuracy: 0.4,
  title: "Rookie",
};

describe("mergeProfileStats", () => {
  it("sums coins, exp, and game counts; keeps higher accuracy", () => {
    const guest = { ...baseProfile, coins: 500, exp: 100, gamesPlayed: 2 };
    const existing = {
      ...baseProfile,
      coins: 300,
      exp: 50,
      gamesPlayed: 4,
      vocabAccuracy: 0.9,
    };

    const merged = mergeProfileStats(guest, existing);

    expect(merged.coins).toBe(800);
    expect(merged.exp).toBe(150);
    expect(merged.gamesPlayed).toBe(6);
    expect(merged.gamesWon).toBe(2);
    expect(merged.vocabAccuracy).toBe(0.9);
    expect(merged.grammarAccuracy).toBe(0.5);
  });
});

describe("createProfileMergeService", () => {
  it("links guest profile when user profile is missing", async () => {
    const guest = {
      id: "guest-profile",
      guestId: "guest-1",
      supabaseUserId: null,
      displayName: "Guest",
      ...baseProfile,
    };

    const db = {
      playerProfile: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(guest)
          .mockResolvedValueOnce(null),
        update: vi.fn().mockResolvedValue({
          id: "guest-profile",
          supabaseUserId: "user-1",
        }),
        delete: vi.fn(),
      },
      $transaction: vi.fn(),
    } as unknown as PrismaClient;

    const service = createProfileMergeService(db);
    const result = await service.mergeGuestIntoUser({
      supabaseUserId: "user-1",
      guestId: "guest-1",
    });

    expect(result).toEqual({ ok: true, profileId: "guest-profile" });
    expect(db.playerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "guest-profile" },
        data: expect.objectContaining({
          supabaseUserId: "user-1",
          guestId: null,
        }),
      }),
    );
  });

  it("merges stats into existing user profile", async () => {
    const guest = {
      id: "guest-profile",
      guestId: "guest-1",
      supabaseUserId: null,
      displayName: "Guest",
      ...baseProfile,
      coins: 400,
    };
    const existing = {
      id: "user-profile",
      guestId: null,
      supabaseUserId: "user-1",
      displayName: "Player",
      ...baseProfile,
      coins: 600,
    };

    const tx = {
      playerProfile: {
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      },
      gamePlayer: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      coinTransaction: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      playerAchievement: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const db = {
      playerProfile: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(guest)
          .mockResolvedValueOnce(existing),
      },
      $transaction: vi.fn(async (fn) => fn(tx)),
    } as unknown as PrismaClient;

    const service = createProfileMergeService(db);
    const result = await service.mergeGuestIntoUser({
      supabaseUserId: "user-1",
      guestId: "guest-1",
    });

    expect(result).toEqual({ ok: true, profileId: "user-profile" });
    expect(tx.playerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-profile" },
        data: expect.objectContaining({ coins: 1000 }),
      }),
    );
    expect(tx.playerProfile.delete).toHaveBeenCalledWith({
      where: { id: "guest-profile" },
    });
  });
});
