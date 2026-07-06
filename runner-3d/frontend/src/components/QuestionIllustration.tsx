import { useState } from "react";
import { motion } from "framer-motion";
import type { ImageFocus } from "../game/types";
import { isLocalOrRemoteImage, resolveQuestionImageSrc } from "../lib/questionImage";

interface Props {
  image: string;
  imageFocus?: ImageFocus | null;
  alt?: string;
}

const PAN_ZOOM = 2.4;

export function QuestionIllustration({ image, imageFocus, alt = "" }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = resolveQuestionImageSrc(image);
  const isPhoto = isLocalOrRemoteImage(image);
  const focusX = imageFocus?.x ?? 50;
  const focusY = imageFocus?.y ?? 50;

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="mb-3 flex justify-center"
    >
      {isPhoto ? (
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-lg">
          {src && !imgFailed ? (
            imageFocus ? (
              <div className="relative h-40 w-full overflow-hidden sm:h-44">
                <motion.img
                  key={`${src}-${focusX}-${focusY}`}
                  src={src}
                  alt={alt}
                  className="absolute max-w-none object-cover"
                  style={{
                    width: `${PAN_ZOOM * 100}%`,
                    height: `${PAN_ZOOM * 100}%`,
                  }}
                  initial={false}
                  animate={{
                    left: `${50 - focusX * PAN_ZOOM}%`,
                    top: `${50 - focusY * PAN_ZOOM}%`,
                  }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  loading="eager"
                  decoding="async"
                  onError={() => setImgFailed(true)}
                />
              </div>
            ) : (
              <img
                src={src}
                alt={alt}
                className="h-36 w-full object-cover sm:h-40"
                loading="eager"
                decoding="async"
                onError={() => setImgFailed(true)}
              />
            )
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
