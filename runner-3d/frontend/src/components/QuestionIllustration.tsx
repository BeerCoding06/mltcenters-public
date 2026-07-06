import { useState } from "react";
import { motion } from "framer-motion";
import { isLocalOrRemoteImage, resolveQuestionImageSrc } from "../lib/questionImage";

interface Props {
  image: string;
  alt?: string;
}

export function QuestionIllustration({ image, alt = "" }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = resolveQuestionImageSrc(image);
  const isPhoto = isLocalOrRemoteImage(image);

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="mb-3 flex justify-center"
    >
      {isPhoto ? (
        <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-lg">
          {src && !imgFailed ? (
            <img
              src={src}
              alt={alt}
              className="h-36 w-full object-cover sm:h-40"
              loading="eager"
              decoding="async"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-36 items-center justify-center text-sm text-slate-500 sm:h-40">
              Image unavailable
            </div>
          )}
        </div>
      ) : (
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
              {image}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
