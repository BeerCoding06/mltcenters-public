import { Volume2 } from "lucide-react";

interface Props {
  text: string;
  onSpeak: (text: string) => void;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function SpeakButton({
  text,
  onSpeak,
  label = "Read aloud",
  size = "md",
  className = "",
}: Props) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? 15 : 17;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onSpeak(text);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white transition hover:bg-white/30 active:scale-95 ${dim} ${className}`}
    >
      <Volume2 size={icon} />
    </button>
  );
}
