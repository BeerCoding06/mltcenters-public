import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIIconProps {
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10', icon: 'h-5 w-5' },
  lg: { box: 'h-14 w-14', icon: 'h-7 w-7' },
};

export function AIIcon({ className, iconClassName, size = 'md' }: AIIconProps) {
  const s = sizeMap[size];
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5BC0FF] to-[#6EE7B7] text-white shadow-md',
        s.box,
        className
      )}
      aria-hidden
    >
      <Bot className={cn(s.icon, iconClassName)} strokeWidth={2.25} />
    </div>
  );
}
