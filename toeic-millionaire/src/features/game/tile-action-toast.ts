import type { TileAction } from "@/features/game/types";
import { toast } from "@/components/ui/toast";

export function tileActionToast(action: TileAction, skipped: boolean): void {
  if (skipped) {
    toast.add({
      title: "Resting",
      description: "Skipped turn — recovering from rest.",
      type: "info",
    });
    return;
  }

  switch (action.type) {
    case "start":
      break;
    case "bonus":
      toast.add({
        title: "Bonus!",
        description: `+${action.coins} coins${action.exp ? `, +${action.exp} EXP` : ""}`,
        type: "success",
      });
      break;
    case "tax":
      toast.add({
        title: "Tax",
        description: `−${action.coins} coins`,
        type: "warning",
      });
      break;
    case "rest":
      toast.add({
        title: "Rest",
        description: "You'll skip your next turn.",
        type: "info",
      });
      break;
    case "freeHint":
      toast.add({
        title: "Free hint",
        description: "Your next hint is free!",
        type: "info",
      });
      break;
    case "miniGame":
      toast.add({
        title: "Mini game",
        description: "Mini game coming soon — keep playing!",
        type: "info",
      });
      break;
    case "challenge":
      toast.add({
        title: "Challenge",
        description: "Challenge tile — stay sharp!",
        type: "info",
      });
      break;
    case "chest":
      toast.add({
        title: `${action.tier.charAt(0).toUpperCase()}${action.tier.slice(1)} chest`,
        description: "Treasure found!",
        type: "success",
      });
      break;
    case "flavor":
      toast.add({
        title: "Special tile",
        description:
          action.effect === "quiz" ? "Bonus quiz opportunity!" : "Lucky break!",
        type: "info",
      });
      break;
    default:
      break;
  }
}
