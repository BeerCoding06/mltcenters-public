import type { TileAction } from "@/features/game/types";
import { toast } from "@/components/ui/toast";
import { getMessages } from "@/features/i18n/GameLangProvider";

export function tileActionToast(action: TileAction, skipped: boolean): void {
  const t = getMessages();

  if (skipped) {
    toast.add({
      title: t.toastResting,
      description: t.toastRestingDesc,
      type: "info",
    });
    return;
  }

  switch (action.type) {
    case "start":
      break;
    case "bonus":
      toast.add({
        title: t.toastBonus,
        description: t.effectCoins(action.coins) +
          (action.exp ? `, ${t.effectExp(action.exp)}` : ""),
        type: "success",
      });
      break;
    case "tax":
      toast.add({
        title: t.toastTax,
        description: t.effectCoins(-action.coins),
        type: "warning",
      });
      break;
    case "rest":
      toast.add({
        title: t.toastRest,
        description: t.toastRestDesc,
        type: "info",
      });
      break;
    case "freeHint":
      toast.add({
        title: t.toastFreeHint,
        description: t.toastFreeHintDesc,
        type: "info",
      });
      break;
    case "miniGame":
      toast.add({
        title: t.toastMiniGame,
        description: t.toastMiniGameDesc,
        type: "info",
      });
      break;
    case "challenge":
      toast.add({
        title: t.toastChallenge,
        description: t.toastChallengeDesc,
        type: "info",
      });
      break;
    case "chest":
      toast.add({
        title: `${action.tier.charAt(0).toUpperCase()}${action.tier.slice(1)} ${t.toastChest}`,
        description: t.toastTreasure,
        type: "success",
      });
      break;
    case "flavor":
      toast.add({
        title: t.toastSpecial,
        description:
          action.effect === "quiz" ? t.toastBonusQuiz : t.toastLuckyBreak,
        type: "info",
      });
      break;
    default:
      break;
  }
}
