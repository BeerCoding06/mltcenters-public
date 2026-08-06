import type { PlayerProfile, PrismaClient } from "@prisma/client";

const MERGE_FIELDS = [
  "coins",
  "diamonds",
  "exp",
  "level",
  "gamesPlayed",
  "gamesWon",
  "vocabAccuracy",
  "grammarAccuracy",
  "readingAccuracy",
  "listeningAccuracy",
  "title",
] as const;

export type MergeableProfile = Pick<PlayerProfile, (typeof MERGE_FIELDS)[number]>;

export function mergeProfileStats(
  guest: MergeableProfile,
  existing: MergeableProfile,
): MergeableProfile {
  return {
    coins: guest.coins + existing.coins,
    diamonds: guest.diamonds + existing.diamonds,
    exp: guest.exp + existing.exp,
    level: Math.max(guest.level, existing.level),
    gamesPlayed: guest.gamesPlayed + existing.gamesPlayed,
    gamesWon: guest.gamesWon + existing.gamesWon,
    vocabAccuracy: Math.max(guest.vocabAccuracy, existing.vocabAccuracy),
    grammarAccuracy: Math.max(guest.grammarAccuracy, existing.grammarAccuracy),
    readingAccuracy: Math.max(guest.readingAccuracy, existing.readingAccuracy),
    listeningAccuracy: Math.max(
      guest.listeningAccuracy,
      existing.listeningAccuracy,
    ),
    title: existing.level >= guest.level ? existing.title : guest.title,
  };
}

export type MergeProfileInput = {
  supabaseUserId: string;
  guestId: string;
  displayName?: string;
};

export type MergeProfileResult =
  | { ok: true; profileId: string; alreadyMerged?: boolean }
  | { ok: false; code: "guest_not_found" | "guest_claimed" };

export function createProfileMergeService(db: PrismaClient) {
  return {
    async mergeGuestIntoUser(
      input: MergeProfileInput,
    ): Promise<MergeProfileResult> {
      const guest = await db.playerProfile.findUnique({
        where: { guestId: input.guestId },
      });

      if (!guest) {
        return { ok: false, code: "guest_not_found" };
      }

      if (guest.supabaseUserId === input.supabaseUserId) {
        return { ok: true, profileId: guest.id, alreadyMerged: true };
      }

      if (guest.supabaseUserId) {
        return { ok: false, code: "guest_claimed" };
      }

      const existing = await db.playerProfile.findUnique({
        where: { supabaseUserId: input.supabaseUserId },
      });

      if (!existing) {
        const profile = await db.playerProfile.update({
          where: { id: guest.id },
          data: {
            supabaseUserId: input.supabaseUserId,
            guestId: null,
            displayName: input.displayName ?? guest.displayName,
          },
        });
        return { ok: true, profileId: profile.id };
      }

      if (existing.id === guest.id) {
        return { ok: true, profileId: existing.id, alreadyMerged: true };
      }

      const mergedStats = mergeProfileStats(guest, existing);

      await db.$transaction(async (tx) => {
        await tx.playerProfile.update({
          where: { id: existing.id },
          data: mergedStats,
        });

        await tx.gamePlayer.updateMany({
          where: { profileId: guest.id },
          data: { profileId: existing.id },
        });

        await tx.coinTransaction.updateMany({
          where: { profileId: guest.id },
          data: { profileId: existing.id },
        });

        const guestAchievements = await tx.playerAchievement.findMany({
          where: { profileId: guest.id },
        });

        for (const achievement of guestAchievements) {
          const conflict = await tx.playerAchievement.findUnique({
            where: {
              profileId_achievementId: {
                profileId: existing.id,
                achievementId: achievement.achievementId,
              },
            },
          });

          if (conflict) {
            await tx.playerAchievement.delete({ where: { id: achievement.id } });
          } else {
            await tx.playerAchievement.update({
              where: { id: achievement.id },
              data: { profileId: existing.id },
            });
          }
        }

        await tx.playerProfile.delete({ where: { id: guest.id } });
      });

      return { ok: true, profileId: existing.id };
    },
  };
}

export type ProfileMergeService = ReturnType<typeof createProfileMergeService>;
