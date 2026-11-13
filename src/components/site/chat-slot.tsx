'use client';

import { AskOmaWidget } from '@/components/chat/ask-oma-widget';

interface ChatSlotProps {
  className?: string;
}

export function ChatSlot({ className }: ChatSlotProps) {
  return <AskOmaWidget className={className} />;
}
