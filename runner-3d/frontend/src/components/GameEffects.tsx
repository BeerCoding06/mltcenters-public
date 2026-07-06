import { motion, AnimatePresence } from "framer-motion";
import type { VisualFx } from "../game/types";

export function GameEffects({ fx }: { fx: VisualFx }) {
  return (
    <>
      <AnimatePresence>
        {fx.flash === "green" && (
          <motion.div
            key="green"
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="pointer-events-none absolute inset-0 z-20 bg-green-400/30"
          />
        )}
        {fx.flash === "red" && (
          <motion.div
            key="red"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-0 z-20 bg-red-500/35"
          />
        )}
      </AnimatePresence>

      {fx.speedLines && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-0.5 w-24 bg-white/30"
              style={{ top: `${15 + i * 14}%`, left: "-6rem" }}
              animate={{ x: ["0%", "120vw"] }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          ))}
        </div>
      )}
    </>
  );
}
