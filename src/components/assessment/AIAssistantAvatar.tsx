import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AvatarState } from '@/types/assessment';

interface AIAssistantAvatarProps {
  state: AvatarState;
  className?: string;
}

export function AIAssistantAvatar({ state, className }: AIAssistantAvatarProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-gradient-to-br from-[#5BC0FF]/30 to-[#6EE7B7]/30 p-2 shadow-lg',
        className
      )}
    >
      {/* Glow ring when listening or speaking */}
      {(state === 'listening' || state === 'speaking') && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-[#5BC0FF]/50"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {state === 'thinking' && (
        <motion.div
          className="absolute inset-0 rounded-full bg-[#FFE66D]/20 blur-xl"
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <motion.div
        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#5BC0FF] to-[#6EE7B7] text-4xl shadow-inner md:h-32 md:w-32"
        animate={
          state === 'idle'
            ? { y: [0, -4, 0] }
            : state === 'speaking'
              ? { scale: [1, 1.05, 1] }
              : {}
        }
        transition={
          state === 'idle'
            ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            : state === 'speaking'
              ? { duration: 0.8, repeat: Infinity }
              : {}
        }
      >
        🤖
      </motion.div>
    </div>
  );
}
