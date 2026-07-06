import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIIcon } from '@/components/assessment/AIIcon';
import type { ChatMessage as ChatMessageType } from '@/types/assessment';
import type { AvatarState } from '@/types/assessment';

interface ChatLabels {
  placeholder: string;
  micOn: string;
  micOff: string;
  replay: string;
  you: string;
  ai: string;
  voiceMode: string;
}

interface ChatWindowProps {
  messages: ChatMessageType[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  isListening: boolean;
  onToggleMic: () => void;
  micSupported: boolean;
  disabled?: boolean;
  statusText: string;
  avatarState: AvatarState;
  speakingMessageId?: string | null;
  onReplay?: (text: string) => void;
  labels: ChatLabels;
}

export function ChatWindow({
  messages,
  inputValue,
  onInputChange,
  onSend,
  isListening,
  onToggleMic,
  micSupported,
  disabled,
  statusText,
  avatarState,
  speakingMessageId,
  onReplay,
  labels,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, inputValue]);

  return (
    <div className="flex h-full min-h-[400px] flex-col rounded-2xl bg-white/90 shadow-xl border border-white/80 overflow-hidden">
      <div
        className={cn(
          'flex items-center gap-2 border-b px-4 py-2.5 text-sm font-medium transition-colors',
          avatarState === 'listening' && 'bg-[#FF8FAB]/15 text-[#c9184a]',
          avatarState === 'speaking' && 'bg-[#5BC0FF]/15 text-[#0077b6]',
          avatarState === 'thinking' && 'bg-[#FFE66D]/20 text-[#9a6b00]',
          avatarState === 'idle' && 'bg-slate-50 text-muted-foreground'
        )}
      >
        {avatarState === 'listening' && (
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block h-3 w-0.5 rounded-full bg-[#FF8FAB]"
                animate={{ scaleY: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </span>
        )}
        {avatarState === 'speaking' && <Volume2 className="h-4 w-4 shrink-0 animate-pulse" />}
        <span>{statusText}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const isSpeakingThis = m.role === 'assistant' && speakingMessageId === m.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex items-end gap-2',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {m.role === 'assistant' && <AIIcon size="sm" />}
                <div className="flex max-w-[85%] flex-col gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground px-1">
                    {m.role === 'user' ? labels.you : labels.ai}
                  </span>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 shadow-md',
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white'
                        : 'bg-[#F8FAFC] text-foreground border border-[#5BC0FF]/20',
                      isSpeakingThis && 'ring-2 ring-[#5BC0FF]/50'
                    )}
                  >
                    <p className="text-sm md:text-base whitespace-pre-wrap">{m.content}</p>
                    {m.role === 'assistant' && onReplay && (
                      <button
                        type="button"
                        onClick={() => onReplay(m.content)}
                        className="mt-2 flex items-center gap-1 text-xs text-[#5BC0FF] hover:underline"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        {labels.replay}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-border/50 bg-white/50 flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder={labels.placeholder}
          disabled={disabled || isListening}
          className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#5BC0FF]/50 disabled:opacity-50"
        />
        {micSupported && (
          <button
            type="button"
            onClick={onToggleMic}
            disabled={disabled}
            className={cn(
              'rounded-xl p-3 transition-all',
              isListening
                ? 'bg-[#FF8FAB] text-white shadow-lg shadow-[#FF8FAB]/30'
                : 'bg-muted hover:bg-[#5BC0FF]/20 text-foreground'
            )}
            aria-label={isListening ? labels.micOn : labels.micOff}
          >
            <Mic className={cn('h-5 w-5', isListening && 'animate-pulse')} />
          </button>
        )}
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !inputValue.trim()}
          className="rounded-xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] p-3 text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
          aria-label={labels.placeholder}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
