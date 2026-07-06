import { useState } from "react";
import { motion } from "framer-motion";
import { emojiToImageUrl } from "../lib/questionImage";

interface Props {
  emoji: string;
  alt?: string;
}

export function QuestionIllustration({ emoji, alt = "" }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = emojiToImageUrl(emoji);

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mb-3 flex justify-center"
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/30 bg-white/95 shadow-lg sm:h-28 sm:w-28">
        {src && !imgFailed ? (
          <img
            src={src}
            alt={alt}
            className="h-16 w-16 object-contain sm:h-20 sm:w-20"
            loading="eager"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-5xl leading-none sm:text-6xl" role="img" aria-label={alt}>
            {emoji}
          </span>
        )}
      </div>
    </motion.div>
  );
}
