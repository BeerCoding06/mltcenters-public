import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types/assessment';

interface ChatWindowProps {
  messages: ChatMessageType[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  isListening: boolean;
  onToggleMic: () => void;
  micSupported: boolean;
  disabled?: boolean;
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
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full min-h-[400px] flex-col rounded-2xl bg-white/90 shadow-xl border border-white/80 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex',
                m.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 shadow-md',
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white'
                    : 'bg-[#F8FAFC] text-foreground border border-[#5BC0FF]/20'
                )}
              >
                <p className="text-sm md:text-base whitespace-pre-wrap">{m.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-border/50 bg-white/50 flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder="Say or type anything 😊"
          disabled={disabled}
          className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#5BC0FF]/50 disabled:opacity-50"
        />
        {micSupported && (
          <button
            type="button"
            onClick={onToggleMic}
            className={cn(
              'rounded-xl p-3 transition-all',
              isListening
                ? 'bg-[#FF8FAB] text-white animate-pulse'
                : 'bg-muted hover:bg-[#5BC0FF]/20 text-foreground'
            )}
            aria-label={isListening ? 'Stop recording' : 'Start voice input'}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !inputValue.trim()}
          className="rounded-xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] p-3 text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
          aria-label="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
